import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    TextChannel
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import SuggestionModel from "../../models/SuggestionModel";
import Logger from "../../features/Logger";
import { CacheManager } from "../../utils/CacheManager";
import { CacheKeys } from "../../constants/CacheKeys";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("delete-suggestion")
        .setDescription("Delete a suggestion entirely (any status)")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addStringOption(option =>
            option.setName("suggestion-id")
                .setDescription("The ID of the suggestion to delete")
                .setRequired(true)
        ),
    config: {
        category: "suggestion-system",
        usage: "<suggestion-id>",
        examples: [
            "/delete-suggestion suggestion-id:5",
            "/delete-suggestion suggestion-id:12"
        ],
        permissions: ["ManageMessages"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const suggestionID = interaction.options.getString("suggestion-id", true);
            const guildID = interaction.guild.id;

            const suggestion = await SuggestionModel.findOne({ guildID, suggestionID });
            if (!suggestion) {
                return interaction.reply({
                    content: `❌ No suggestion found with ID \`${suggestionID}\`.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Delete the message from the channel
            try {
                if (suggestion.channelID && suggestion.messageID) {
                    const channel = await interaction.client.channels.fetch(suggestion.channelID);
                    if (channel && channel instanceof TextChannel) {
                        const message = await channel.messages.fetch(suggestion.messageID).catch(() => null);
                        if (message) {
                            await message.delete().catch(() => null);
                        }
                    }
                }
            } catch (channelError) {
                Logger.warn(`Failed to delete message for suggestion ${suggestionID}: ${channelError}`);
            }

            // Delete from database
            await SuggestionModel.deleteOne({ guildID, suggestionID });

            // Invalidate cache
            const cacheManager = CacheManager.getInstance();
            await cacheManager.delete(CacheKeys.suggestion.single(guildID, suggestionID));
            await cacheManager.delete(CacheKeys.suggestion.all(guildID));
            await cacheManager.delete(CacheKeys.suggestion.pending(guildID));
            await cacheManager.delete(CacheKeys.suggestion.approved(guildID));
            await cacheManager.delete(CacheKeys.suggestion.denied(guildID));

            await interaction.reply({
                content: `🗑️ Suggestion #${suggestionID} has been deleted.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            Logger.error(`Error in delete-suggestion command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while deleting the suggestion.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
