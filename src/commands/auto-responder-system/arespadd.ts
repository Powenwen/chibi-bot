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
import { redis } from "../../features/RedisDB";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("arespadd")
        .setDescription("Adds an auto responder to the bot")
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
                .setDescription("The trigger word/phrase that will activate the response")
                .setRequired(true)
                .setMaxLength(200)
        )
        .addStringOption(option =>
            option
                .setName("response")
                .setDescription("The response message to send")
                .setRequired(true)
                .setMaxLength(2000)
        )
        .addBooleanOption(option =>
            option
                .setName("case-sensitive")
                .setDescription("Whether the trigger should be case-sensitive (default: false)")
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName("exact-match")
                .setDescription("Whether to match the entire message or just check if it contains the trigger (default: false)")
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
                .setDescription("Hex color for the embed (e.g., #FF0000 or FF0000, only used if use-embed is true)")
                .setRequired(false)
                .setMaxLength(7)
        )
    ,
    config: {
        category: "auto-responder",
        usage: "<channel> <trigger> <response> [case-sensitive] [exact-match] [use-embed] [embed-title] [embed-color]",
        examples: [
            "/arespadd channel:#general trigger:hello response:Hi there!",
            "/arespadd channel:#support trigger:help response:How can I assist you?",
            "/arespadd channel:#bot trigger:!rules response:Please read our rules!",
            "/arespadd channel:#announcements trigger:welcome response:Welcome to the server! use-embed:true embed-title:Welcome! embed-color:#5865F2"
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
            const useEmbed = options.getBoolean("use-embed") ?? false;
            const embedTitle = options.getString("embed-title");
            const embedColor = options.getString("embed-color");

            if (!channel || !trigger || !response) return;

            // Validate embed color if provided
            if (embedColor) {
                const colorRegex = /^#?[0-9A-Fa-f]{6}$/;
                if (!colorRegex.test(embedColor)) {
                    return interaction.reply({
                        content: "Invalid embed color. Please provide a valid hex color (e.g., #FF0000 or FF0000).",
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            // Ensure embedColor starts with #
            const normalizedColor = embedColor && !embedColor.startsWith('#') ? `#${embedColor}` : embedColor;

            // Validate trigger and response
            if (trigger.trim().length === 0) {
                return interaction.reply({
                    content: "Trigger cannot be empty.",
                    flags: MessageFlags.Ephemeral
                });
            }

            if (response.trim().length === 0) {
                return interaction.reply({
                    content: "Response cannot be empty.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Check if auto responder already exists for this channel and trigger
            const existingAutoResponder = await AutoResponderModel.findOne({
                guildID: interaction.guild.id,
                channelID: channel.id,
                trigger: caseSensitive ? trigger : { $regex: new RegExp(`^${trigger}$`, 'i') }
            });

            if (existingAutoResponder) {
                return interaction.reply({
                    content: "An auto responder with this trigger already exists in this channel. Please delete it first or use a different trigger.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Create new auto responder
            const newAutoResponder = new AutoResponderModel({
                guildID: interaction.guild.id,
                channelID: channel.id,
                trigger: trigger,
                response: response,
                caseSensitive: caseSensitive,
                exactMatch: exactMatch,
                useEmbed: useEmbed,
                embedTitle: embedTitle,
                embedColor: normalizedColor || "#5865F2",
                authorID: interaction.user.id
            });

            await newAutoResponder.save();

            // Clear cache
            await redis.del(`autoresponder:${interaction.guildId}`);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Auto Responder Added")
                        .setDescription(`Auto responder has been added to <#${channel.id}>`)
                        .addFields([
                            {
                                name: "Trigger",
                                value: `\`${trigger}\``
                            },
                            {
                                name: "Response",
                                value: response.length > 1024 ? response.substring(0, 1021) + "..." : response
                            },
                            {
                                name: "Case Sensitive",
                                value: caseSensitive ? "Yes" : "No",
                                inline: true
                            },
                            {
                                name: "Exact Match",
                                value: exactMatch ? "Yes" : "No",
                                inline: true
                            },
                            {
                                name: "Use Embed",
                                value: useEmbed ? "Yes" : "No",
                                inline: true
                            },
                            ...(useEmbed && embedTitle ? [{
                                name: "Embed Title",
                                value: embedTitle,
                                inline: true
                            }] : []),
                            ...(useEmbed ? [{
                                name: "Embed Color",
                                value: normalizedColor || "#5865F2",
                                inline: true
                            }] : []),
                            {
                                name: "Author",
                                value: `<@${interaction.user.id}>`,
                                inline: true
                            }
                        ])
                        .setColor("Green")
                        .setTimestamp()
                ]
            });
        } catch (error) {
            Logger.error(`Error in arespadd command: ${error}`);
            await interaction.reply({
                content: "An error occurred while adding the auto responder.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
