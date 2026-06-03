import {
    CommandInteraction,
    GuildMember,
    EmbedBuilder,
    TextChannel,
    ChannelType,
    ClientUser,
    ColorResolvable,
    Guild,
    User
} from "discord.js";
import WelcomeSystemModel from "../models/WelcomeSystemModel";
import { IWelcomeSystem } from "../shared/types";
import { ErrorHandler } from "../utils/ErrorHandler";
import Logger from "./Logger";
import { CacheManager } from "../utils/CacheManager";
import { CacheKeys } from "../constants/CacheKeys";

type WelcomeMessageField =
    | "channelID"
    | "title"
    | "description"
    | "color"
    | "thumbnail"
    | "thumbnailUrl"
    | "image"
    | "imageUrl"
    | "author.enabled"
    | "author.name"
    | "author.iconUrl"
    | "author.url"
    | "footer.enabled"
    | "footer.text"
    | "footer.iconUrl"
    | "footer.timestamp"
    | "embed.timestamp"
    | "dmEnabled"
    | "dmMessage"
    | "roleEnabled"
    | "roleIDs"
    | "type"
    | "message"
    | "enabled";

/**
 * Advanced Welcome System feature class.
 * Handles welcome message configuration, rendering, and delivery
 * with support for embeds, text messages, DM welcomes, and auto-role assignment.
 */
export default class WelcomeSystem {
    /**
     * Creates a new welcome configuration for a guild.
     */
    public static async addWelcomeMessage(
        guildID: string,
        channelID: string
    ): Promise<boolean | null> {
        return ErrorHandler.handleAsyncOperation(async () => {
            const existing = await WelcomeSystemModel.findOne({ guildID });
            if (existing) {
                Logger.warn(`Welcome message already exists for guild ${guildID}`);
                return false;
            }

            await WelcomeSystemModel.create({
                guildID,
                channelID,
                embed: {
                    title: "Welcome to {server}!",
                    description: "Welcome {user} to our amazing server! You are member #{memberCount}.",
                    color: "#5865F2",
                    thumbnail: true,
                    footer: {
                        enabled: true,
                        text: "Welcome System",
                        timestamp: true
                    }
                }
            });

            await this.invalidateCache(guildID);
            Logger.info(`Welcome message created for guild ${guildID}`);
            return true;
        }, "addWelcomeMessage") ?? false;
    }

    /**
     * Edits a specific field of the welcome configuration.
     */
    public static async editWelcomeMessage(
        field: WelcomeMessageField,
        value: string | boolean | string[],
        guildID: string
    ): Promise<boolean | null> {
        return ErrorHandler.handleAsyncOperation(async () => {
            // Validate boolean fields
            if (typeof value === "string" && (
                field === "footer.enabled" || field === "footer.timestamp" ||
                field === "thumbnail" || field === "image" ||
                field === "author.enabled" || field === "embed.timestamp" ||
                field === "dmEnabled" || field === "roleEnabled" || field === "enabled"
            )) {
                value = value === "true";
            }

            let updateQuery: Record<string, any> = {};

            if (field === "roleIDs") {
                updateQuery.roleIDs = value;
            } else if (field === "channelID" || field === "type" || field === "message" || field === "dmMessage" || field === "enabled") {
                updateQuery[field] = value;
            } else {
                updateQuery[`embed.${field}`] = value;
            }

            const result = await WelcomeSystemModel.updateOne({ guildID }, updateQuery);

            if (result.matchedCount === 0) {
                Logger.warn(`No welcome message found for guild ${guildID}`);
                return false;
            }

            await this.invalidateCache(guildID);
            return true;
        }, "editWelcomeMessage") ?? false;
    }

    /**
     * Adds a field to the welcome embed.
     */
    public static async addField(
        guildID: string,
        name: string,
        value: string,
        inline: boolean = false
    ): Promise<boolean | null> {
        return ErrorHandler.handleAsyncOperation(async () => {
            const config = await WelcomeSystemModel.findOne({ guildID });
            if (!config) return false;
            if (config.embed.fields.length >= 25) return false;

            config.embed.fields.push({ name, value, inline });
            await config.save();
            await this.invalidateCache(guildID);
            return true;
        }, "addWelcomeField") ?? false;
    }

    /**
     * Removes a field from the welcome embed by index.
     */
    public static async removeField(guildID: string, index: number): Promise<boolean | null> {
        return ErrorHandler.handleAsyncOperation(async () => {
            const config = await WelcomeSystemModel.findOne({ guildID });
            if (!config || index < 0 || index >= config.embed.fields.length) return false;

            config.embed.fields.splice(index, 1);
            await config.save();
            await this.invalidateCache(guildID);
            return true;
        }, "removeWelcomeField") ?? false;
    }

    /**
     * Adds a role to the auto-assign list.
     */
    public static async addRole(guildID: string, roleID: string): Promise<boolean | null> {
        return ErrorHandler.handleAsyncOperation(async () => {
            const config = await WelcomeSystemModel.findOne({ guildID });
            if (!config) return false;
            if (config.roleIDs.includes(roleID)) return false;

            config.roleIDs.push(roleID);
            await config.save();
            await this.invalidateCache(guildID);
            return true;
        }, "addWelcomeRole") ?? false;
    }

    /**
     * Removes a role from the auto-assign list.
     */
    public static async removeRole(guildID: string, roleID: string): Promise<boolean | null> {
        return ErrorHandler.handleAsyncOperation(async () => {
            const config = await WelcomeSystemModel.findOne({ guildID });
            if (!config) return false;

            config.roleIDs = config.roleIDs.filter(id => id !== roleID);
            await config.save();
            await this.invalidateCache(guildID);
            return true;
        }, "removeWelcomeRole") ?? false;
    }

    /**
     * Removes the entire welcome configuration.
     */
    public static async removeWelcomeMessage(guildID: string): Promise<void> {
        await WelcomeSystemModel.deleteOne({ guildID });
        await this.invalidateCache(guildID);
    }

    /**
     * Gets the welcome configuration for a guild with Redis caching.
     */
    public static async getWelcomeMessage(guildID: string): Promise<IWelcomeSystem | null> {
        const cacheManager = CacheManager.getInstance();
        const cacheKey = CacheKeys.guild.data(guildID);

        const cached = await cacheManager.get<IWelcomeSystem>(cacheKey);
        if (cached) return cached;

        const result = await ErrorHandler.handleAsyncOperation(async () => {
            return await WelcomeSystemModel.findOne({ guildID });
        }, "getWelcomeMessage");

        if (result) {
            await cacheManager.set(cacheKey, result, 300);
        }

        return result;
    }

    /**
     * Builds and sends the complete welcome for a new member.
     */
    public static async sendWelcome(
        member: GuildMember,
        config: IWelcomeSystem,
        clientUser: ClientUser
    ): Promise<void> {
        if (!config.enabled) return;

        const replacements = this.getReplacements(member);

        // Channel welcome
        if (config.type === "embed" || config.type === "both") {
            const embed = this.buildEmbed(config, replacements, member, clientUser);
            const channel = member.guild.channels.cache.get(config.channelID);

            if (channel && channel.isTextBased() && channel.type === ChannelType.GuildText) {
                const content = config.type === "both"
                    ? this.parsePlaceholders(config.message, replacements)
                    : undefined;

                await (channel as TextChannel).send({ content, embeds: [embed] }).catch((err: Error) => {
                    Logger.error(`Failed to send welcome message: ${err}`);
                });
            } else {
                Logger.warn(`Welcome channel not found or invalid: ${config.channelID}`);
            }
        } else if (config.type === "text") {
            const channel = member.guild.channels.cache.get(config.channelID);
            if (channel && channel.isTextBased() && channel.type === ChannelType.GuildText) {
                const content = this.parsePlaceholders(config.message, replacements);
                await (channel as TextChannel).send(content).catch((err: Error) => {
                    Logger.error(`Failed to send welcome message: ${err}`);
                });
            }
        }

        // DM welcome
        if (config.dmEnabled && config.dmMessage) {
            const dmContent = this.parsePlaceholders(config.dmMessage, replacements);
            await member.send(dmContent).catch(() => {
                // User may have DMs disabled — silently ignore
            });
        }

        // Auto-role assignment
        if (config.roleEnabled && config.roleIDs.length > 0) {
            for (const roleID of config.roleIDs) {
                try {
                    await member.roles.add(roleID);
                } catch (err) {
                    Logger.warn(`Failed to assign role ${roleID} to ${member.user.tag}: ${err}`);
                }
            }
        }
    }

    /**
     * Builds the welcome embed from config and replacements.
     */
    public static buildEmbed(
        config: IWelcomeSystem,
        replacements: Record<string, string>,
        member: GuildMember,
        clientUser: ClientUser
    ): EmbedBuilder {
        const embed = new EmbedBuilder();

        if (config.embed.title) {
            embed.setTitle(this.parsePlaceholders(config.embed.title, replacements));
        }
        if (config.embed.description) {
            embed.setDescription(this.parsePlaceholders(config.embed.description, replacements));
        }

        embed.setColor((config.embed.color || "#5865F2") as ColorResolvable);

        // Thumbnail
        if (config.embed.thumbnail) {
            const thumbUrl = config.embed.thumbnailUrl
                ? this.parsePlaceholders(config.embed.thumbnailUrl, replacements)
                : member.user.displayAvatarURL();
            embed.setThumbnail(thumbUrl);
        }

        // Image
        if (config.embed.image && config.embed.imageUrl) {
            embed.setImage(this.parsePlaceholders(config.embed.imageUrl, replacements));
        }

        // Author
        if (config.embed.author.enabled) {
            const authorData: { name: string; iconURL?: string; url?: string } = {
                name: this.parsePlaceholders(config.embed.author.name || member.user.tag, replacements)
            };
            if (config.embed.author.iconUrl) {
                authorData.iconURL = this.parsePlaceholders(config.embed.author.iconUrl, replacements);
            }
            if (config.embed.author.url) {
                authorData.url = this.parsePlaceholders(config.embed.author.url, replacements);
            }
            embed.setAuthor(authorData);
        }

        // Fields
        for (const field of config.embed.fields) {
            embed.addFields({
                name: this.parsePlaceholders(field.name, replacements),
                value: this.parsePlaceholders(field.value, replacements),
                inline: field.inline
            });
        }

        // Footer
        if (config.embed.footer.enabled) {
            const footerData: { text: string; iconURL?: string } = {
                text: this.parsePlaceholders(config.embed.footer.text, replacements)
            };
            if (config.embed.footer.iconUrl) {
                footerData.iconURL = this.parsePlaceholders(config.embed.footer.iconUrl, replacements);
            }
            embed.setFooter(footerData);
            if (config.embed.footer.timestamp) {
                embed.setTimestamp();
            }
        }

        // Embed-level timestamp
        if (config.embed.timestamp) {
            embed.setTimestamp();
        }

        return embed;
    }

    /**
     * Parses placeholder strings with the given replacements.
     */
    public static parsePlaceholders(text: string, replacements: Record<string, string>): string {
        let result = text;
        for (const [placeholder, value] of Object.entries(replacements)) {
            result = result.replace(new RegExp(`\\{${placeholder}\\}`, "g"), value);
        }
        return result;
    }

    /**
     * Legacy: Parse welcome description (keeps backward compatibility).
     */
    public static parseWelcomeDescription(
        description: string,
        target: CommandInteraction | GuildMember
    ): string {
        const replacements = this.getReplacements(target);
        return this.parsePlaceholders(description, replacements);
    }

    /**
     * Gets all available placeholder replacements for a member.
     */
    public static getReplacements(
        target: CommandInteraction | GuildMember | { guild: Guild; user: User; joinedAt?: Date | null }
    ): Record<string, string> {
        let guild: Guild;
        let user: User;
        let joinedAt: Date | null | undefined;
        let username: string;

        if (target instanceof CommandInteraction) {
            guild = target.guild!;
            user = target.user;
            const member = target.member as GuildMember;
            joinedAt = member?.joinedAt;
            username = target.user.username;
        } else if (target instanceof GuildMember) {
            guild = target.guild;
            user = target.user;
            joinedAt = target.joinedAt;
            username = target.user.username;
        } else {
            guild = target.guild;
            user = target.user;
            joinedAt = target.joinedAt;
            username = user.username;
        }

        const memberCount = guild.memberCount.toString();
        const accountCreated = user.createdAt?.toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric"
        }) || "Unknown";
        const dateJoined = joinedAt?.toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric"
        }) || "Unknown";

        return {
            user: user.toString(),
            username,
            userID: user.id,
            server: guild.name,
            serverID: guild.id,
            memberCount,
            userAvatar: user.displayAvatarURL(),
            serverIcon: guild.iconURL() || "",
            dateJoined,
            accountCreated,
            currentTime: new Date().toLocaleTimeString(),
            currentDate: new Date().toLocaleDateString(),
            serverOwner: guild.ownerId,
            serverBoosts: guild.premiumSubscriptionCount?.toString() || "0",
            serverBoostTier: guild.premiumTier.toString(),
            memberMention: user.toString(),
            memberTag: user.tag,
            memberDiscriminator: user.discriminator || "0",
            isBot: user.bot ? "Yes" : "No"
        };
    }

    /**
     * Gets all available placeholder names and descriptions.
     */
    public static getPlaceholderGuide(): { placeholder: string; description: string; example: string }[] {
        return [
            { placeholder: "user", description: "Mentions the new member", example: "@Powenwen" },
            { placeholder: "username", description: "The member's username", example: "Powenwen" },
            { placeholder: "userID", description: "The member's Discord ID", example: "123456789012345678" },
            { placeholder: "userAvatar", description: "URL of the member's avatar", example: "https://cdn.discordapp.com/..." },
            { placeholder: "memberMention", description: "Same as {user} — mentions the member", example: "@Powenwen" },
            { placeholder: "memberTag", description: "The member's full tag", example: "Powenwen#0001" },
            { placeholder: "memberDiscriminator", description: "The member's discriminator", example: "0001" },
            { placeholder: "server", description: "The server name", example: "My Awesome Server" },
            { placeholder: "serverID", description: "The server's Discord ID", example: "987654321098765432" },
            { placeholder: "serverIcon", description: "URL of the server's icon", example: "https://cdn.discordapp.com/..." },
            { placeholder: "serverOwner", description: "Mentions the server owner", example: "@Owner" },
            { placeholder: "memberCount", description: "Total member count", example: "150" },
            { placeholder: "serverBoosts", description: "Number of server boosts", example: "5" },
            { placeholder: "serverBoostTier", description: "Server boost tier (0-3)", example: "2" },
            { placeholder: "dateJoined", description: "Date the member joined", example: "January 15, 2025" },
            { placeholder: "accountCreated", description: "Date the account was created", example: "March 10, 2020" },
            { placeholder: "currentTime", description: "Current time", example: "3:45:22 PM" },
            { placeholder: "currentDate", description: "Current date", example: "6/3/2026" },
            { placeholder: "isBot", description: "Whether the member is a bot", example: "No" }
        ];
    }

    private static async invalidateCache(guildID: string): Promise<void> {
        const cacheManager = CacheManager.getInstance();
        await cacheManager.delete(CacheKeys.guild.data(guildID));
    }
}