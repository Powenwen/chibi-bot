import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    TextChannel
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import SuggestionModel, { ISuggestion } from "../../models/SuggestionModel";
import Logger from "../../features/Logger";
import { redis } from "../../features/RedisDB";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("delete-suggestion")
        .setDescription("Delete a suggestion from the server (any status).")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addStringOption(option =>
            option
                .setName("suggestion-id")
                .setDescription("The ID of the suggestion you want to delete.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("The reason for deleting the suggestion.")
                .setRequired(true)
        ),
    config: {
        category: "suggestion-system",
        usage: "<suggestion-id> <reason>",
        examples: ["/delete-suggestion 1 This suggestion is not needed.", "/delete-suggestion 5 Duplicate suggestion."],
        permissions: ["ManageMessages"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const suggestionID = interaction.options.getString("suggestion-id", true);
            const reason = interaction.options.getString("reason", true);

            if (reason.length > 1024) {
                return interaction.reply({
                    content: "Reason cannot be longer than 1024 characters.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const guildID = interaction.guildId!;

            // Check cache first
            let suggestion: ISuggestion | null = null;
            try {
                const cachedSuggestion = await redis.get(`suggestion:${guildID}:${suggestionID}`);
                if (cachedSuggestion) {
                    suggestion = JSON.parse(cachedSuggestion) as ISuggestion;
                }
            } catch (cacheError) {
                Logger.warn(`Cache error for suggestion ${suggestionID}: ${cacheError}`);
            }

            if (!suggestion) {
                suggestion = await SuggestionModel.findOne({ guildID, suggestionID: suggestionID.toString() });

                if (!suggestion) {
                    return interaction.reply({
                        content: "The suggestion with that ID does not exist.",
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            // Allow deletion of any suggestion regardless of status
            // No status check needed - admins can delete any suggestion

            // Delete from database first
            await SuggestionModel.deleteOne({ guildID, suggestionID: suggestionID.toString() });

            // Clear cache
            try {
                await redis.del(`suggestion:${guildID}:${suggestionID}`);
            } catch (cacheError) {
                Logger.warn(`Failed to clear cache for suggestion ${suggestionID}: ${cacheError}`);
            }

            // Delete the message from the channel
            try {
                if (suggestion.channelID && suggestion.messageID) {
                    const suggestionChannel = await interaction.client.channels.fetch(suggestion.channelID);
                    if (suggestionChannel && suggestionChannel instanceof TextChannel) {
                        const suggestionMessage = await suggestionChannel.messages.fetch(suggestion.messageID).catch(() => null);
                        if (suggestionMessage) {
                            await suggestionMessage.delete().catch((deleteError) => {
                                Logger.warn(`Failed to delete message for suggestion ${suggestionID}: ${deleteError.message}`);
                            });
                        } else {
                            Logger.warn(`Message not found for suggestion ${suggestionID}, may have been already deleted`);
                        }
                    } else {
                        Logger.warn(`Channel not found or invalid type for suggestion ${suggestionID}`);
                    }
                } else {
                    Logger.warn(`Missing channelID or messageID for suggestion ${suggestionID}`);
                }
            } catch (channelError) {
                Logger.warn(`Failed to fetch channel for suggestion ${suggestionID}: ${channelError}`);
            }

            await interaction.reply({
                content: `Suggestion with ID \`${suggestionID}\` has been deleted.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            Logger.error(`Error in delete-suggestion command: ${error}`);
            await interaction.reply({
                content: "An error occurred while deleting the suggestion.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};