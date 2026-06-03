import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    TextChannel,
    AttachmentBuilder
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import SuggestionChannelModel from "../../models/SuggestionChannelModel";
import SuggestionModel from "../../models/SuggestionModel";
import Logger from "../../features/Logger";
import { CacheManager } from "../../utils/CacheManager";
import { CacheKeys } from "../../constants/CacheKeys";

// Cooldown tracking (guildID:userID -> last suggestion timestamp)
const suggestionCooldowns = new Map<string, number>();

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("add-suggestion")
        .setDescription("Submit a suggestion to the server")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addStringOption(option =>
            option.setName("suggestion")
                .setDescription("Your suggestion (max 4000 characters)")
                .setRequired(true)
                .setMaxLength(4000)
        )
        .addStringOption(option =>
            option.setName("category")
                .setDescription("Category for this suggestion")
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("priority")
                .setDescription("Priority level")
                .setRequired(false)
                .addChoices(
                    { name: "🟢 Low", value: "low" },
                    { name: "🟡 Medium", value: "medium" },
                    { name: "🟠 High", value: "high" },
                    { name: "🔴 Critical", value: "critical" }
                )
        )
        .addBooleanOption(option =>
            option.setName("anonymous")
                .setDescription("Submit anonymously (hides your identity)")
                .setRequired(false)
        )
        .addAttachmentOption(option =>
            option.setName("attachment")
                .setDescription("Attach an image to your suggestion")
                .setRequired(false)
        ),
    config: {
        category: "suggestion-system",
        usage: "<suggestion> [category] [priority] [anonymous] [attachment]",
        examples: [
            "/add-suggestion suggestion:Add a daily quest system category:Features priority:High",
            "/add-suggestion suggestion:Fix the login bug category:Bug Reports priority:Critical",
            "/add-suggestion suggestion:Great server! anonymous:true"
        ],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const suggestionText = interaction.options.getString("suggestion", true);
            const category = interaction.options.getString("category");
            const priority = interaction.options.getString("priority") ?? "medium";
            const anonymous = interaction.options.getBoolean("anonymous") ?? false;
            const attachment = interaction.options.getAttachment("attachment");

            const guildID = interaction.guild.id;
            const userID = interaction.user.id;

            // Get channel config
            const channelConfig = await SuggestionChannelModel.findOne({ guildID });
            if (!channelConfig || !channelConfig.enabled) {
                return interaction.reply({
                    content: "❌ The suggestion system is not configured or has been disabled.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Validate category
            const validCategory = channelConfig.categories.length > 0
                ? (category && channelConfig.categories.includes(category) ? category : channelConfig.defaultCategory)
                : (category || "General");

            // Check cooldown
            if (channelConfig.cooldown > 0) {
                const cooldownKey = `${guildID}:${userID}`;
                const lastSuggestion = suggestionCooldowns.get(cooldownKey) || 0;
                const now = Date.now();
                if (now - lastSuggestion < channelConfig.cooldown * 1000) {
                    const remaining = Math.ceil((channelConfig.cooldown * 1000 - (now - lastSuggestion)) / 1000);
                    return interaction.reply({
                        content: `⏳ You must wait **${remaining}s** before submitting another suggestion.`,
                        flags: MessageFlags.Ephemeral
                    });
                }
                suggestionCooldowns.set(cooldownKey, now);
            }

            // Check max suggestions per user
            if (channelConfig.maxSuggestionsPerUser > 0) {
                const userSuggestions = await SuggestionModel.countDocuments({
                    guildID,
                    authorID: userID,
                    status: "Pending"
                });
                if (userSuggestions >= channelConfig.maxSuggestionsPerUser) {
                    return interaction.reply({
                        content: `❌ You have reached the maximum of **${channelConfig.maxSuggestionsPerUser}** pending suggestions. Wait for them to be reviewed before submitting more.`,
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            // Check role restrictions
            if (channelConfig.requiredRoleID) {
                const member = interaction.guild.members.cache.get(userID);
                if (member && !member.roles.cache.has(channelConfig.requiredRoleID)) {
                    return interaction.reply({
                        content: "❌ You don't have the required role to submit suggestions.",
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
            if (channelConfig.blockedRoleID) {
                const member = interaction.guild.members.cache.get(userID);
                if (member && member.roles.cache.has(channelConfig.blockedRoleID)) {
                    return interaction.reply({
                        content: "❌ You are blocked from submitting suggestions.",
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            // Validate attachment
            let attachmentUrl = "";
            if (attachment) {
                if (!attachment.contentType?.startsWith("image/")) {
                    return interaction.reply({
                        content: "❌ Only image attachments are allowed.",
                        flags: MessageFlags.Ephemeral
                    });
                }
                if (attachment.size > 8 * 1024 * 1024) {
                    return interaction.reply({
                        content: "❌ Attachment must be under 8MB.",
                        flags: MessageFlags.Ephemeral
                    });
                }
                attachmentUrl = attachment.url;
            }

            // Get next suggestion ID
            const lastSuggestion = await SuggestionModel.findOne({ guildID })
                .sort({ createdAt: -1 })
                .limit(1);
            const nextID = lastSuggestion
                ? (parseInt(lastSuggestion.suggestionID) + 1).toString()
                : "1";

            // Fetch the suggestion channel
            const channel = await interaction.client.channels.fetch(channelConfig.channelID);
            if (!channel || !(channel instanceof TextChannel)) {
                return interaction.reply({
                    content: "❌ The suggestion channel no longer exists or is invalid.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Build the suggestion embed
            const priorityEmoji: Record<string, string> = {
                low: "🟢", medium: "🟡", high: "🟠", critical: "🔴"
            };
            const statusEmoji: Record<string, string> = {
                Pending: "⏳", Approved: "✅", Denied: "❌", Implemented: "🚀", Considered: "💭"
            };

            const embed = new EmbedBuilder()
                .setTitle(`💡 Suggestion #${nextID}`)
                .setDescription(suggestionText)
                .setColor("#FFA500")
                .setTimestamp();

            // Author field (or anonymous)
            if (anonymous) {
                embed.setAuthor({ name: "Anonymous Suggestion", iconURL: interaction.client.user.displayAvatarURL() });
            } else {
                embed.setAuthor({
                    name: interaction.user.tag,
                    iconURL: interaction.user.displayAvatarURL()
                });
            }

            // Info fields
            embed.addFields([
                { name: "Status", value: `${statusEmoji["Pending"]} Pending`, inline: true },
                { name: "Category", value: validCategory, inline: true },
                { name: "Priority", value: `${priorityEmoji[priority] || "🟡"} ${priority.charAt(0).toUpperCase() + priority.slice(1)}`, inline: true },
                { name: "Votes", value: "👍 0 | 👎 0", inline: true }
            ]);

            // Attachment image
            if (attachmentUrl) {
                embed.setImage(attachmentUrl);
            }

            embed.setFooter({ text: `ID: ${nextID} • Use /add-suggestion to submit your own` });

            // Send the message
            const message = await channel.send({ embeds: [embed] });

            // Add reactions
            await message.react(channelConfig.emojis.upvote);
            await message.react(channelConfig.emojis.downvote);

            // Create auto-thread if enabled
            if (channelConfig.autoThread) {
                try {
                    await message.startThread({
                        name: `Suggestion #${nextID} Discussion`,
                        autoArchiveDuration: 1440
                    });
                } catch (threadError) {
                    Logger.warn(`Failed to create thread for suggestion ${nextID}: ${threadError}`);
                }
            }

            // Notify role if configured
            if (channelConfig.notifyRoleID) {
                try {
                    const role = interaction.guild.roles.cache.get(channelConfig.notifyRoleID);
                    if (role) {
                        await channel.send({
                            content: `${role} New suggestion #${nextID} submitted!`,
                            allowedMentions: { roles: [channelConfig.notifyRoleID] }
                        }).then(msg => {
                            // Delete notification after 5 seconds
                            setTimeout(() => msg.delete().catch(() => null), 5000);
                        });
                    }
                } catch (notifyError) {
                    Logger.warn(`Failed to notify role for suggestion ${nextID}: ${notifyError}`);
                }
            }

            // Save to database
            await SuggestionModel.create({
                guildID,
                channelID: channelConfig.channelID,
                messageID: message.id,
                suggestionID: nextID,
                suggestion: suggestionText,
                authorID: userID,
                status: "Pending",
                category: validCategory,
                anonymous,
                priority,
                attachmentUrl,
                response: "",
                responseAuthorID: ""
            });

            // Invalidate cache
            const cacheManager = CacheManager.getInstance();
            await cacheManager.delete(CacheKeys.suggestion.all(guildID));

            // Reply to user
            const replyEmbed = new EmbedBuilder()
                .setTitle("✅ Suggestion Submitted")
                .setDescription(`Your suggestion **#${nextID}** has been posted in <#${channelConfig.channelID}>.`)
                .addFields([
                    { name: "Category", value: validCategory, inline: true },
                    { name: "Priority", value: `${priorityEmoji[priority]} ${priority.charAt(0).toUpperCase() + priority.slice(1)}`, inline: true },
                    { name: "Anonymous", value: anonymous ? "Yes" : "No", inline: true }
                ])
                .setColor("Green")
                .setTimestamp();

            await interaction.reply({ embeds: [replyEmbed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            Logger.error(`Error in add-suggestion command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while submitting your suggestion.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
