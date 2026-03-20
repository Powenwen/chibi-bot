import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import SuggestionChannelModel from "../../models/SuggestionChannelModel";
import Logger from "../../features/Logger";
import { redis } from "../../features/RedisDB";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("set-suggestion-emojis")
        .setDescription("Set the emojis for the suggestion system.")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addStringOption(option =>
            option
                .setName("upvote")
                .setDescription("The emoji to use for upvoting suggestions.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("downvote")
                .setDescription("The emoji to use for downvoting suggestions.")
                .setRequired(true)
        ),
    config: {
        category: "suggestion-system",
        usage: "<upvote> <downvote>",
        examples: ["/set-suggestion-emojis 👍 👎"],
        permissions: ["ManageMessages"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const upvote = interaction.options.getString("upvote", true);
            const downvote = interaction.options.getString("downvote", true);
            const guildID = interaction.guildId!;

            // Validate emojis
            const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|<a?:.+?:\d{17,19}>)$/;
            
            if (!emojiRegex.test(upvote) || !emojiRegex.test(downvote)) {
                return interaction.reply({
                    content: "Please provide valid emojis.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const suggestionChannel = await SuggestionChannelModel.findOne({ guildID });
            if (!suggestionChannel) {
                return interaction.reply({
                    content: "The suggestion channel has not been set for this server. Please set it using the `/set-suggestion-channel` command.",
                    flags: MessageFlags.Ephemeral
                });
            }

            await SuggestionChannelModel.updateOne({ guildID }, { emojis: { upvote, downvote } });

            // Clear cache
            await redis.del(`suggestion:channel:${guildID}`);

            await interaction.reply({
                content: `Suggestion emojis have been set to ${upvote} and ${downvote}.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            Logger.error(`Error in set-suggestion-emojis command: ${error}`);
            await interaction.reply({
                content: "An error occurred while setting suggestion emojis.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
}