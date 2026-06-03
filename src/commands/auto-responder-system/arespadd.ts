import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    ChannelType,
    EmbedBuilder,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import AutoResponderModel from "../../models/AutoResponderModel";
import Logger from "../../features/Logger";
import { CacheManager } from "../../utils/CacheManager";
import { CacheKeys } from "../../constants/CacheKeys";

/**
 * Validates a regex pattern string.
 * Returns the pattern if valid, or null if invalid.
 */
function validateRegex(pattern: string): string | null {
    try {
        new RegExp(pattern);
        return pattern;
    } catch {
        return null;
    }
}

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("arespadd")
        .setDescription("Add an auto-responder — automatically reply to messages matching a trigger")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("The channel you want the auto responder to be in")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption(option =>
            option
                .setName("trigger")
                .setDescription("The trigger word, phrase, or regex pattern")
                .setRequired(true)
                .setMaxLength(500)
        )
        .addStringOption(option =>
            option
                .setName("response")
                .setDescription("The response message to send when triggered")
                .setRequired(true)
                .setMaxLength(2000)
        )
        .addBooleanOption(option =>
            option
                .setName("case-sensitive")
                .setDescription("Whether the trigger is case-sensitive (default: false)")
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName("exact-match")
                .setDescription("Match the entire message instead of checking if it contains the trigger (default: false)")
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName("use-regex")
                .setDescription("Treat the trigger as a regex pattern (default: false)")
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName("use-embed")
                .setDescription("Send the response as an embed (default: false)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("embed-title")
                .setDescription("Title for the embed (only used if use-embed is true)")
                .setRequired(false)
                .setMaxLength(256)
        )
        .addStringOption(option =>
            option
                .setName("embed-color")
                .setDescription("Hex color for the embed, e.g. #FF0000 (only used if use-embed is true)")
                .setRequired(false)
                .setMaxLength(7)
        )
        .addIntegerOption(option =>
            option
                .setName("cooldown")
                .setDescription("Cooldown in seconds before this responder can trigger again (0 = none, default: 0)")
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(3600)
        )
        .addIntegerOption(option =>
            option
                .setName("response-delay")
                .setDescription("Delay in milliseconds before sending the response (0 = instant, default: 0)")
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(10000)
        )
        .addBooleanOption(option =>
            option
                .setName("suppress-mentions")
                .setDescription("Suppress @everyone and @here in responses (default: true)")
                .setRequired(false)
        )
    ,
    config: {
        category: "auto-responder",
        usage: "<channel> <trigger> <response> [case-sensitive] [exact-match] [use-regex] [use-embed] [embed-title] [embed-color] [cooldown] [response-delay] [suppress-mentions]",
        examples: [
            "/arespadd channel:#general trigger:hello response:Hi there!",
            "/arespadd channel:#support trigger:help response:How can I assist you? cooldown:10",
            "/arespadd channel:#bot trigger:^!rules$ response:Please read our rules! use-regex:true",
            "/arespadd channel:#announcements trigger:welcome response:Welcome! use-embed:true embed-title:Welcome embed-color:#5865F2",
            "/arespadd channel:#general trigger:good morning response:Good morning! ☀️ response-delay:500 suppress-mentions:true"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const options = interaction.options;
            const channel = options.getChannel("channel", true, [ChannelType.GuildText]);
            const trigger = options.getString("trigger", true);
            const response = options.getString("response", true);
            const caseSensitive = options.getBoolean("case-sensitive") ?? false;
            const exactMatch = options.getBoolean("exact-match") ?? false;
            const useRegex = options.getBoolean("use-regex") ?? false;
            const useEmbed = options.getBoolean("use-embed") ?? false;
            const embedTitle = options.getString("embed-title");
            const embedColor = options.getString("embed-color");
            const cooldown = options.getInteger("cooldown") ?? 0;
            const responseDelay = options.getInteger("response-delay") ?? 0;
            const suppressMentions = options.getBoolean("suppress-mentions") ?? true;

            if (!channel || !trigger || !response) return;

            // Validate regex if enabled
            if (useRegex) {
                const validPattern = validateRegex(trigger);
                if (!validPattern) {
                    return interaction.reply({
                        content: "❌ Invalid regex pattern. Please provide a valid regular expression.",
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            // Validate embed color if provided
            if (embedColor) {
                const colorRegex = /^#?[0-9A-Fa-f]{6}$/;
                if (!colorRegex.test(embedColor)) {
                    return interaction.reply({
                        content: "❌ Invalid embed color. Provide a valid hex color (e.g., #FF0000 or FF0000).",
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            // Ensure embedColor starts with #
            const normalizedColor = embedColor && !embedColor.startsWith('#') ? `#${embedColor}` : embedColor;

            // Validate trigger and response
            if (trigger.trim().length === 0) {
                return interaction.reply({
                    content: "❌ Trigger cannot be empty.",
                    flags: MessageFlags.Ephemeral
                });
            }

            if (response.trim().length === 0) {
                return interaction.reply({
                    content: "❌ Response cannot be empty.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Check for duplicate trigger in this channel
            const existingAutoResponder = await AutoResponderModel.findOne({
                guildID: interaction.guild.id,
                channelID: channel.id,
                trigger: caseSensitive ? trigger : { $regex: new RegExp(`^${trigger}$`, 'i') }
            });

            if (existingAutoResponder) {
                return interaction.reply({
                    content: "⚠️ An auto-responder with this trigger already exists in this channel. Delete it first or use a different trigger.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Create the auto-responder
            const newAutoResponder = new AutoResponderModel({
                guildID: interaction.guild.id,
                channelID: channel.id,
                trigger,
                response,
                caseSensitive,
                exactMatch,
                useRegex,
                useEmbed,
                embedTitle: embedTitle || undefined,
                embedColor: normalizedColor || "#5865F2",
                cooldown,
                responseDelay,
                suppressMentions,
                authorID: interaction.user.id
            });

            await newAutoResponder.save();

            // Invalidate cache
            const cacheManager = CacheManager.getInstance();
            await cacheManager.delete(CacheKeys.autoResponder.channel(interaction.guild.id, channel.id));
            await cacheManager.delete(CacheKeys.autoResponder.all(interaction.guild.id));

            // Build response embed
            const fields: { name: string; value: string; inline?: boolean }[] = [
                { name: "Trigger", value: `\`${trigger}\``, inline: false },
                { name: "Response", value: response.length > 1024 ? response.substring(0, 1021) + "..." : response, inline: false },
                { name: "Case Sensitive", value: caseSensitive ? "Yes" : "No", inline: true },
                { name: "Exact Match", value: exactMatch ? "Yes" : "No", inline: true },
                { name: "Regex", value: useRegex ? "Yes" : "No", inline: true },
                { name: "Use Embed", value: useEmbed ? "Yes" : "No", inline: true }
            ];

            if (useEmbed && embedTitle) {
                fields.push({ name: "Embed Title", value: embedTitle, inline: true });
            }
            if (useEmbed) {
                fields.push({ name: "Embed Color", value: normalizedColor || "#5865F2", inline: true });
            }
            if (cooldown > 0) {
                fields.push({ name: "Cooldown", value: `${cooldown}s`, inline: true });
            }
            if (responseDelay > 0) {
                fields.push({ name: "Response Delay", value: `${responseDelay}ms`, inline: true });
            }
            fields.push({ name: "Suppress Mentions", value: suppressMentions ? "Yes" : "No", inline: true });

            const embed = new EmbedBuilder()
                .setTitle("✅ Auto-Responder Added")
                .setDescription(`Auto-responder configured for <#${channel.id}>`)
                .addFields(fields)
                .setColor("Green")
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error(`Error in arespadd command: ${error}`);
            await interaction.reply({
                content: "An error occurred while adding the auto responder.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
