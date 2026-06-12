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
import AutoReactionModel, { IEmojiReaction } from "../../models/AutoReactionModel";
import Logger from "../../features/Logger";
import { CacheManager } from "../../utils/CacheManager";
import { CacheKeys } from "../../constants/CacheKeys";

// Regex patterns for emoji parsing
const CUSTOM_EMOJI_REGEX = /<(a?):(.+?):(\d{17,19})>/;
const UNICODE_EMOJI_REGEX = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;

interface ParsedEmoji {
    emojiID?: string;
    name: string;
    animated: boolean;
    isUnicode: boolean;
    raw: string;
}

/**
 * Parses a single emoji string into a structured object.
 * Supports both custom Discord emojis and Unicode emojis.
 */
function parseEmoji(emoji: string, guild: any): ParsedEmoji | null {
    const trimmed = emoji.trim();
    if (!trimmed) return null;

    // Try custom emoji first
    const customMatch = trimmed.match(CUSTOM_EMOJI_REGEX);
    if (customMatch) {
        const animated = customMatch[1] === 'a';
        const name = customMatch[2];
        const emojiId = customMatch[3];

        // Verify the emoji exists in this guild
        if (!guild.emojis.cache.has(emojiId)) {
            return null;
        }

        return {
            emojiID: emojiId,
            name,
            animated,
            isUnicode: false,
            raw: trimmed
        };
    }

    // Try unicode emoji
    if (UNICODE_EMOJI_REGEX.test(trimmed)) {
        return {
            name: trimmed,
            animated: false,
            isUnicode: true,
            raw: trimmed
        };
    }

    return null;
}

/**
 * Parses a space-separated string of emojis, returning valid ones and invalid ones separately.
 */
function parseEmojisInput(input: string, guild: any): { valid: ParsedEmoji[]; invalid: string[] } {
    const tokens = input.split(/\s+/).filter(t => t.trim());
    const valid: ParsedEmoji[] = [];
    const invalid: string[] = [];
    const seen = new Set<string>();

    for (const token of tokens) {
        const parsed = parseEmoji(token, guild);
        if (parsed && !seen.has(parsed.raw)) {
            seen.add(parsed.raw);
            valid.push(parsed);
        } else if (!parsed) {
            invalid.push(token);
        }
    }

    return { valid, invalid };
}

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("aradd")
        .setDescription("Add auto-reactions to a channel — every message will get automatic emoji reactions")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addStringOption(option =>
            option
                .setName("emojis")
                .setDescription("Emojis to react with, separated by spaces (e.g., '😄 👍 <:custom:123>')")
                .setRequired(true)
        )
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("The channel for auto-reactions (leave empty for all channels)")
                .setRequired(false)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addIntegerOption(option =>
            option
                .setName("cooldown")
                .setDescription("Cooldown in seconds between reactions (0 = no cooldown, default: 0)")
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(3600)
        )
        .addBooleanOption(option =>
            option
                .setName("ignore-bots")
                .setDescription("Whether to ignore messages from bots (default: true)")
                .setRequired(false)
        )
    ,
    config: {
        category: "auto-reaction",
        usage: "[channel] <emojis> [cooldown] [ignore-bots]",
        examples: [
            "/aradd emojis:😄 👍 🎉",
            "/aradd channel:#general emojis:😄 👍 🎉",
            "/aradd channel:#starboard emojis:⭐ 🌟 cooldown:5",
            "/aradd emojis:👋 <:custom_emoji:123456789> ignore-bots:true"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const channel = interaction.options.getChannel("channel", false, [ChannelType.GuildText]);
            const emojisInput = interaction.options.getString("emojis", true);
            const cooldown = interaction.options.getInteger("cooldown") ?? 0;
            const ignoreBots = interaction.options.getBoolean("ignore-bots") ?? true;

            // Parse emojis
            const { valid: parsedEmojis, invalid: invalidEmojis } = parseEmojisInput(emojisInput, interaction.guild);

            if (parsedEmojis.length === 0) {
                return interaction.reply({
                    content: "❌ No valid emojis found. Provide Unicode emojis (😄) or custom server emojis (`<:name:id>`).",
                    flags: MessageFlags.Ephemeral
                });
            }

            if (parsedEmojis.length > 20) {
                return interaction.reply({
                    content: `❌ Too many emojis (${parsedEmojis.length}). Maximum is 20 per channel.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Check for existing auto-reaction in this channel (or all channels)
            const dupQuery: any = { guildID: interaction.guild.id };
            if (channel) dupQuery.channelID = channel.id;
            const existing = await AutoReactionModel.findOne(dupQuery);

            if (existing) {
                return interaction.reply({
                    content: `⚠️ Auto-reaction already exists${channel ? ` in <#${channel.id}>` : ' for all channels'}. Use \`/ardelete\` first to remove it.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Create the auto-reaction
            const newAutoReaction = new AutoReactionModel({
                guildID: interaction.guild.id,
                channelID: channel ? channel.id : '',
                emojis: parsedEmojis as IEmojiReaction[],
                authorID: interaction.user.id,
                cooldown,
                ignoreBots
            });

            await newAutoReaction.save();

            // Invalidate cache
            const cacheManager = CacheManager.getInstance();
            if (channel) await cacheManager.delete(CacheKeys.autoReaction.channel(interaction.guild.id, channel.id));
            await cacheManager.delete(CacheKeys.autoReaction.all(interaction.guild.id));

            // Build response embed
            const embed = new EmbedBuilder()
                .setTitle("✅ Auto-Reaction Added")
                .setDescription(`Auto-reaction configured for ${channel ? `<#${channel.id}>` : 'all channels'}`)
                .addFields([
                    {
                        name: "Emojis",
                        value: parsedEmojis.map(e => e.raw).join(" "),
                        inline: false
                    },
                    {
                        name: "Total Emojis",
                        value: `${parsedEmojis.length}`,
                        inline: true
                    },
                    {
                        name: "Cooldown",
                        value: cooldown > 0 ? `${cooldown}s` : "None",
                        inline: true
                    },
                    {
                        name: "Ignore Bots",
                        value: ignoreBots ? "Yes" : "No",
                        inline: true
                    },
                    {
                        name: "Author",
                        value: `<@${interaction.user.id}>`,
                        inline: true
                    }
                ])
                .setColor("Green")
                .setTimestamp();

            // Warn about invalid emojis if any
            if (invalidEmojis.length > 0) {
                embed.addFields({
                    name: "⚠️ Skipped Invalid",
                    value: invalidEmojis.map(e => `\`${e}\``).join(", "),
                    inline: false
                });
                embed.setColor("Yellow");
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error(`Error in aradd command: ${error}`);
            await interaction.reply({
                content: "❌ An unexpected error occurred while adding the auto-reaction.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};