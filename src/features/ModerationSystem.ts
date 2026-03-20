import { Guild, User, TextChannel, EmbedBuilder, ColorResolvable } from "discord.js";
import ModerationModel, { IModerationCase } from "../models/ModerationModel";
import AutoModerationModel, { IAutoModeration } from "../models/AutoModerationModel";
import ModerationLogModel from "../models/ModerationLogModel";
import WarningEscalationModel, { IWarningEscalation, EscalationRule } from "../models/WarningEscalationModel";
import Logger from "./Logger";
import { redis } from "./RedisDB";
import Utility from "../structures/Utility";

export default class ModerationSystem {
    
    // Generate unique case ID
    static async generateCaseID(guildID: string): Promise<string> {
        const count = await ModerationModel.countDocuments({ guildID });
        return `${guildID}-${(count + 1).toString().padStart(4, '0')}`;
    }

    // Create moderation case
    static async createCase(
        guild: Guild,
        user: User,
        moderator: User,
        type: "warn" | "mute" | "kick" | "ban" | "unban" | "timeout",
        reason: string,
        duration?: number,
        evidence?: string[]
    ): Promise<IModerationCase> {
        
        const caseID = await this.generateCaseID(guild.id);
        const expiresAt = duration ? new Date(Date.now() + duration) : undefined;

        const moderationCase = new ModerationModel({
            caseID,
            guildID: guild.id,
            userID: user.id,
            moderatorID: moderator.id,
            type,
            reason,
            duration,
            expiresAt,
            evidence: evidence || []
        });

        await moderationCase.save();

        // Cache the case for quick access
        await redis.setex(
            `modcase:${guild.id}:${caseID}`,
            3600, // 1 hour cache
            JSON.stringify(moderationCase)
        );

        // Log the action
        await this.logModerationAction(guild, moderationCase);

        return moderationCase;
    }

    // Get user's moderation history
    static async getUserHistory(guildID: string, userID: string): Promise<IModerationCase[]> {
        const cacheKey = `modhist:${guildID}:${userID}`;
        
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached) as IModerationCase[];
            }
        } catch (error) {
            Logger.warn(`Failed to get cached moderation history: ${error}`);
        }

        const cases = await ModerationModel.find({ guildID, userID })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean<IModerationCase[]>();

        // Cache for 30 minutes
        await redis.setex(cacheKey, 1800, JSON.stringify(cases));

        return cases;
    }

    // Get auto-moderation settings
    static async getAutoModSettings(guildID: string): Promise<IAutoModeration | null> {
        const cacheKey = `automod:${guildID}`;
        
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached) as IAutoModeration;
            }
        } catch (error) {
            Logger.warn(`Failed to get cached auto-mod settings: ${error}`);
        }

        const settings = await AutoModerationModel.findOne({ guildID });
        
        if (settings) {
            await redis.setex(cacheKey, 1800, JSON.stringify(settings));
        }

        return settings;
    }

    // Update auto-moderation settings
    static async updateAutoModSettings(guildID: string, settings: Partial<IAutoModeration>): Promise<IAutoModeration> {
        const updated = await AutoModerationModel.findOneAndUpdate(
            { guildID },
            settings,
            { new: true, upsert: true }
        );

        // Update cache
        await redis.setex(`automod:${guildID}`, 1800, JSON.stringify(updated));

        return updated;
    }

    // Log moderation action
    static async logModerationAction(guild: Guild, moderationCase: IModerationCase): Promise<void> {
        try {
            const logSettings = await ModerationLogModel.findOne({ guildID: guild.id });
            
            if (!logSettings || !logSettings.channelID) return;

            const logChannel = guild.channels.cache.get(logSettings.channelID) as TextChannel;
            if (!logChannel) return;

            const user = await guild.client.users.fetch(moderationCase.userID).catch(() => null);
            const moderator = await guild.client.users.fetch(moderationCase.moderatorID).catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle(`Moderation Case #${moderationCase.caseID}`)
                .setColor(this.getActionColor(moderationCase.type) as ColorResolvable)
                .addFields(
                    { name: "Action", value: moderationCase.type.toUpperCase(), inline: true },
                    { name: "User", value: user ? `${user.tag} (${user.id})` : moderationCase.userID, inline: true },
                    { name: "Moderator", value: moderator ? `${moderator.tag}` : "Unknown", inline: true },
                    { name: "Reason", value: moderationCase.reason || "No reason provided", inline: false }
                )
                .setTimestamp();

            if (moderationCase.duration) {
                embed.addFields({
                    name: "Duration",
                    value: Utility.formatDuration(moderationCase.duration),
                    inline: true
                });
            }

            if (moderationCase.evidence && moderationCase.evidence.length > 0) {
                embed.addFields({
                    name: "Evidence",
                    value: moderationCase.evidence.join('\n'),
                    inline: false
                });
            }

            if (user) {
                embed.setThumbnail(user.displayAvatarURL());
            }

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            Logger.error(`Failed to log moderation action: ${error}`);
        }
    }

    // Get action color for embeds
    private static getActionColor(type: string): string {
        const colors = {
            warn: "#FFA500",
            mute: "#FF6B6B",
            timeout: "#FF6B6B", 
            kick: "#FF4444",
            ban: "#CC0000",
            unban: "#00CC00"
        };
        return colors[type as keyof typeof colors] || "#808080";
    }

    // Check if user has active punishment
    static async hasActivePunishment(guildID: string, userID: string, type: string): Promise<boolean> {
        const activeCase = await ModerationModel.findOne({
            guildID,
            userID,
            type,
            active: true,
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } }
            ]
        });

        return !!activeCase;
    }

    // Get warning count for user
    static async getWarningCount(guildID: string, userID: string): Promise<number> {
        return await ModerationModel.countDocuments({
            guildID,
            userID,
            type: "warn",
            active: true
        });
    }

    // Get warning escalation settings
    static async getWarningEscalation(guildID: string): Promise<IWarningEscalation | null> {
        const cacheKey = `warning_escalation:${guildID}`;
        
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached) as IWarningEscalation;
            }
        } catch (error) {
            Logger.warn(`Failed to get cached warning escalation: ${error}`);
        }

        const escalation = await WarningEscalationModel.findOne({ guildID });
        
        if (escalation) {
            await redis.setex(cacheKey, 1800, JSON.stringify(escalation));
        }

        return escalation;
    }

    // Update warning escalation settings
    static async updateWarningEscalation(guildID: string, rules: EscalationRule[], enabled: boolean = true): Promise<IWarningEscalation> {
        const updated = await WarningEscalationModel.findOneAndUpdate(
            { guildID },
            { 
                escalationRules: rules.sort((a, b) => a.warningCount - b.warningCount), // Sort by warning count
                enabled,
                updatedAt: new Date()
            },
            { new: true, upsert: true }
        );

        // Update cache
        await redis.setex(`warning_escalation:${guildID}`, 1800, JSON.stringify(updated));

        return updated;
    }

    // Check and apply warning escalation
    static async checkWarningEscalation(guild: Guild, user: User, moderator: User): Promise<void> {
        try {
            const escalationSettings = await this.getWarningEscalation(guild.id);
            
            if (!escalationSettings || !escalationSettings.enabled || escalationSettings.escalationRules.length === 0) {
                return;
            }

            const warningCount = await this.getWarningCount(guild.id, user.id);
            
            // Find applicable escalation rule
            const applicableRule = escalationSettings.escalationRules
                .filter(rule => rule.warningCount === warningCount)
                .pop(); // Get the last matching rule

            if (!applicableRule) {
                return;
            }

            Logger.info(`Applying escalation rule for user ${user.id} in guild ${guild.id}: ${applicableRule.action} after ${warningCount} warnings`);

            const member = await guild.members.fetch(user.id).catch(() => null);
            if (!member) {
                Logger.warn(`Could not fetch member ${user.id} for escalation`);
                return;
            }

            // Apply the escalation action
            switch (applicableRule.action) {
                case "timeout":
                    if (applicableRule.duration) {
                        await member.timeout(applicableRule.duration, applicableRule.reason);
                        await this.createCase(
                            guild,
                            user,
                            moderator,
                            "timeout",
                            `${applicableRule.reason} (${warningCount} warnings)`,
                            applicableRule.duration
                        );
                    }
                    break;

                case "mute":
                    // This would require a mute role system - placeholder for now
                    await this.createCase(
                        guild,
                        user,
                        moderator,
                        "mute",
                        `${applicableRule.reason} (${warningCount} warnings)`,
                        applicableRule.duration
                    );
                    break;

                case "kick":
                    if (member.kickable) {
                        await member.kick(applicableRule.reason);
                        await this.createCase(
                            guild,
                            user,
                            moderator,
                            "kick",
                            `${applicableRule.reason} (${warningCount} warnings)`
                        );
                    }
                    break;

                case "ban":
                    if (member.bannable) {
                        await member.ban({
                            reason: applicableRule.reason,
                            deleteMessageSeconds: (applicableRule.deleteMessages || 0) * 24 * 60 * 60
                        });
                        await this.createCase(
                            guild,
                            user,
                            moderator,
                            "ban",
                            `${applicableRule.reason} (${warningCount} warnings)`
                        );
                    }
                    break;
            }

            // Send notification to user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor("#FF4444")
                    .setTitle("🚨 Automatic Action Taken")
                    .setDescription(`You have been ${applicableRule.action}${applicableRule.action === "ban" ? "ned" : applicableRule.action === "timeout" ? " out" : "ed"} from **${guild.name}** due to accumulated warnings.`)
                    .addFields(
                        { name: "Action", value: applicableRule.action.toUpperCase(), inline: true },
                        { name: "Warning Count", value: warningCount.toString(), inline: true },
                        { name: "Reason", value: applicableRule.reason, inline: false }
                    );

                if (applicableRule.duration) {
                    dmEmbed.addFields({
                        name: "Duration",
                        value: Utility.formatDuration(applicableRule.duration),
                        inline: true
                    });
                }

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                Logger.warn(`Failed to send escalation DM to user ${user.id}: ${error}`);
            }

        } catch (error) {
            Logger.error(`Error in warning escalation for user ${user.id} in guild ${guild.id}: ${error}`);
        }
    }
}
