import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    TextChannel
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import SuggestionModel from "../../models/SuggestionModel";
import Logger from "../../features/Logger";
import { redis } from "../../features/RedisDB";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("deny-suggestion")
        .setDescription("Deny a suggestion that has been submitted.")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addStringOption(option =>
            option
                .setName("suggestion-id")
                .setDescription("The ID of the suggestion you want to deny.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("The reason for denying the suggestion.")
                .setRequired(true)
        ),
    config: {
        category: "suggestion-system",
        usage: "<suggestion-id> <reason>",
        examples: ["/deny-suggestion 1 This suggestion is not needed."],
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
            let suggestion: any;
            try {
                const cachedSuggestion = await redis.get(`suggestion:${guildID}:${suggestionID}`);
                if (cachedSuggestion) {
                    suggestion = JSON.parse(cachedSuggestion);
                }
            } catch (cacheError) {
                Logger.warn(`Cache error for suggestion ${suggestionID}: ${cacheError}`);
            }

            if (!suggestion) {
                suggestion = await SuggestionModel.findOne({ guildID, suggestionID: suggestionID.toString() });
                if (suggestion) {
                    try {
                        await redis.set(`suggestion:${guildID}:${suggestionID}`, JSON.stringify(suggestion), "EX", 300);
                    } catch (cacheError) {
                        Logger.warn(`Failed to cache suggestion ${suggestionID}: ${cacheError}`);
                    }
                }
            }

            if (!suggestion) {
                return interaction.reply({
                    content: "The suggestion with that ID does not exist.",
                    flags: MessageFlags.Ephemeral
                });
            }

            if (suggestion.status !== "Pending") {
                return interaction.reply({
                    content: "The suggestion with that ID has already been approved or denied.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const suggestionChannel = await interaction.client.channels.fetch(suggestion.channelID);

            if (suggestionChannel && suggestionChannel instanceof TextChannel) {
                const suggestionMessage = await suggestionChannel.messages.fetch(suggestion.messageID).catch(() => null);
                if (suggestionMessage) {
                    const embed = new EmbedBuilder()
                        .setTitle("Suggestion Denied")
                        .setDescription(suggestion.suggestion)
                        .addFields([
                            {
                                name: "Reason",
                                value: reason
                            },
                            {
                                name: "Author",
                                value: `<@${suggestion.authorID}>`,
                                inline: true
                            },
                            {
                                name: "Suggestion ID",
                                value: `${suggestion.suggestionID}`,
                                inline: true
                            }
                        ])
                        .setColor("Red")
                        .setFooter({
                            text: `Denied by ${interaction.user.username}`,
                            iconURL: interaction.user.displayAvatarURL()
                        })
                        .setTimestamp();

                    // Delete the old message and send the new one
                    await suggestionMessage.delete().catch(() => null);
                    const newMessage = await suggestionChannel.send({ embeds: [embed] });

                    await SuggestionModel.updateOne({
                        guildID,
                        suggestionID: suggestionID.toString()
                    }, {
                        status: "Denied",
                        response: reason,
                        responseAuthorID: interaction.user.id,
                        messageID: newMessage.id,
                        channelID: newMessage.channel.id
                    });

                    // Update cache
                    try {
                        const updatedSuggestion = { 
                            ...suggestion, 
                            status: "Denied", 
                            response: reason, 
                            responseAuthorID: interaction.user.id,
                            messageID: newMessage.id,
                            channelID: newMessage.channel.id
                        };
                        await redis.set(`suggestion:${guildID}:${suggestionID}`, JSON.stringify(updatedSuggestion), "EX", 300);
                    } catch (cacheError) {
                        Logger.warn(`Failed to update cache for suggestion ${suggestionID}: ${cacheError}`);
                    }
                }
            }

            await interaction.reply({
                content: "The suggestion has been denied.",
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            Logger.error(`Error in deny-suggestion command: ${error}`);
            await interaction.reply({
                content: "An error occurred while denying the suggestion.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};