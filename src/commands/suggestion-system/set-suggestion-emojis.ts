import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    EmbedBuilder
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import SuggestionChannelModel from "../../models/SuggestionChannelModel";
import Logger from "../../features/Logger";
import { CacheManager } from "../../utils/CacheManager";
import { CacheKeys } from "../../constants/CacheKeys";

const EMOJI_REGEX = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|<a?:.+?:\d{17,19}>)$/;

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("set-suggestion-emojis")
        .setDescription("Set the upvote/downvote emojis for suggestions")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addStringOption(option =>
            option.setName("upvote")
                .setDescription("Emoji for upvoting (Unicode or custom server emoji)")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("downvote")
                .setDescription("Emoji for downvoting (Unicode or custom server emoji)")
                .setRequired(true)
        ),
    config: {
        category: "suggestion-system",
        usage: "<upvote> <downvote>",
        examples: [
            "/set-suggestion-emojis upvote:👍 downvote:👎",
            "/set-suggestion-emojis upvote:✅ downvote:❌",
            "/set-suggestion-emojis upvote:⬆️ downvote:⬇️"
        ],
        permissions: ["ManageMessages"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const upvote = interaction.options.getString("upvote", true);
            const downvote = interaction.options.getString("downvote", true);
            const guildID = interaction.guild.id;

            // Validate emojis
            const upvoteValid = EMOJI_REGEX.test(upvote) || /^:.+:\d{17,19}$/.test(upvote) || /^\d{17,19}$/.test(upvote);
            const downvoteValid = EMOJI_REGEX.test(downvote) || /^:.+:\d{17,19}$/.test(downvote) || /^\d{17,19}$/.test(downvote);

            if (!upvoteValid || !downvoteValid) {
                return interaction.reply({
                    content: "❌ Invalid emoji format. Use Unicode emojis (👍) or custom server emojis (`<:name:id>`).",
                    flags: MessageFlags.Ephemeral
                });
            }

            const channelConfig = await SuggestionChannelModel.findOne({ guildID });
            if (!channelConfig) {
                return interaction.reply({
                    content: "❌ No suggestion channel configured. Use `/set-suggestion-channel` first.",
                    flags: MessageFlags.Ephemeral
                });
            }

            await SuggestionChannelModel.updateOne(
                { guildID },
                { emojis: { upvote, downvote } }
            );

            // Invalidate cache
            const cacheManager = CacheManager.getInstance();
            await cacheManager.delete(CacheKeys.suggestion.channel(guildID));

            const embed = new EmbedBuilder()
                .setTitle("✅ Suggestion Emojis Updated")
                .setDescription("New reaction emojis have been configured.")
                .addFields([
                    { name: "Upvote", value: upvote, inline: true },
                    { name: "Downvote", value: downvote, inline: true }
                ])
                .setColor("Green")
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            Logger.error(`Error in set-suggestion-emojis command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while setting suggestion emojis.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
