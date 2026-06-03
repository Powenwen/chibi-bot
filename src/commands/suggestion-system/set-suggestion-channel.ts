import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    ChannelType,
    EmbedBuilder
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import SuggestionChannelModel from "../../models/SuggestionChannelModel";
import { CacheManager } from "../../utils/CacheManager";
import { CacheKeys } from "../../constants/CacheKeys";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("set-suggestion-channel")
        .setDescription("Set or update the suggestion channel for the server")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("The channel for suggestions")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addBooleanOption(option =>
            option.setName("enabled")
                .setDescription("Enable the suggestion system (default: true)")
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName("auto-thread")
                .setDescription("Auto-create discussion threads on suggestions (default: false)")
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName("cooldown")
                .setDescription("Cooldown in seconds between suggestions per user (0 = none, default: 0)")
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(86400)
        )
        .addIntegerOption(option =>
            option.setName("max-per-user")
                .setDescription("Max pending suggestions per user (0 = unlimited, default: 0)")
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(100)
        ),
    config: {
        category: "suggestion-system",
        usage: "<#channel> [enabled] [auto-thread] [cooldown] [max-per-user]",
        examples: [
            "/set-suggestion-channel channel:#suggestions",
            "/set-suggestion-channel channel:#suggestions auto-thread:true cooldown:300"
        ],
        permissions: ["ManageMessages"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const channel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);
        const enabled = interaction.options.getBoolean("enabled") ?? true;
        const autoThread = interaction.options.getBoolean("auto-thread") ?? false;
        const cooldown = interaction.options.getInteger("cooldown") ?? 0;
        const maxPerUser = interaction.options.getInteger("max-per-user") ?? 0;
        const guildID = interaction.guild.id;

        const existing = await SuggestionChannelModel.findOne({ guildID });

        if (existing) {
            existing.channelID = channel.id;
            existing.enabled = enabled;
            existing.autoThread = autoThread;
            existing.cooldown = cooldown;
            existing.maxSuggestionsPerUser = maxPerUser;
            await existing.save();
        } else {
            await SuggestionChannelModel.create({
                guildID,
                channelID: channel.id,
                enabled,
                autoThread,
                cooldown,
                maxSuggestionsPerUser: maxPerUser,
                emojis: { upvote: "👍", downvote: "👎" },
                categories: ["General", "Features", "Bug Reports", "Other"],
                defaultCategory: "General"
            });
        }

        // Invalidate cache
        const cacheManager = CacheManager.getInstance();
        await cacheManager.delete(CacheKeys.suggestion.channel(guildID));
        await cacheManager.delete(CacheKeys.suggestion.all(guildID));

        const embed = new EmbedBuilder()
            .setTitle("✅ Suggestion Channel Configured")
            .setDescription(`Suggestions will be posted in <#${channel.id}>`)
            .addFields([
                { name: "Status", value: enabled ? "🟢 Enabled" : "🔴 Disabled", inline: true },
                { name: "Auto-Thread", value: autoThread ? "✅ On" : "❌ Off", inline: true },
                { name: "Cooldown", value: cooldown > 0 ? `${cooldown}s` : "None", inline: true },
                { name: "Max Per User", value: maxPerUser > 0 ? `${maxPerUser}` : "Unlimited", inline: true },
                { name: "Categories", value: existing ? `${existing.categories.length} categories` : "4 default", inline: true },
                { name: "DM on Response", value: existing?.dmOnResponse ? "✅ On" : "❌ Off", inline: true }
            ])
            .setColor("Green")
            .setTimestamp();

        embed.setFooter({ text: "Use /set-suggestion-emojis to customize reaction emojis" });

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
};
