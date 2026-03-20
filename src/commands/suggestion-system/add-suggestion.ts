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
import SuggestionChannelModel from "../../models/SuggestionChannelModel";
import SuggestionModel from "../../models/SuggestionModel";
import Logger from "../../features/Logger";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("add-suggestion")
        .setDescription("Add a suggestion to the server.")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addStringOption(option =>
            option
                .setName("suggestion")
                .setDescription("The suggestion you want to add.")
                .setRequired(true)
        ),
    config: {
        category: "suggestion-system",
        usage: "<suggestion>",
        examples: ["/add-suggestion Add a new command to the bot."],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const suggestion = interaction.options.getString("suggestion", true);

            if (suggestion.length > 1024) {
                return interaction.reply({
                    content: "Suggestion cannot be longer than 1024 characters.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const guildID = interaction.guildId!;
            const suggestionChannel = await SuggestionChannelModel.findOne({ guildID });

            if (!suggestionChannel) {
                return interaction.reply({
                    content: "The suggestion channel has not been set for this server. Please set it using the `/set-suggestion-channel` command.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const suggestions = await SuggestionModel.find({ guildID });
            const suggestionCount = suggestions.length;

            const suggestionData = {
                guildID,
                channelID: suggestionChannel.channelID,
                suggestionID: (suggestionCount + 1).toString(),
                suggestion,
                authorID: interaction.user.id,
                status: "Pending" as const
            };

            const suggestionChannelData = await interaction.client.channels.fetch(suggestionChannel.channelID);

            if (!suggestionChannelData || !(suggestionChannelData instanceof TextChannel)) {
                return interaction.reply({
                    content: "The suggestion channel does not exist or is not a text channel.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const suggestionChannelEmbed = new EmbedBuilder()
                .setTitle("New Suggestion")
                .setDescription(suggestion)
                .addFields([
                    {
                        name: "Suggestion ID",
                        value: suggestionData.suggestionID,
                        inline: true
                    },
                    {
                        name: "Author",
                        value: `<@${interaction.user.id}>`,
                        inline: true
                    }
                ])
                .setColor("#FFA500")
                .setFooter({
                    text: "Pending",
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setTimestamp();

            const message = await suggestionChannelData.send({ embeds: [suggestionChannelEmbed] });
            
            await Promise.all([
                SuggestionModel.create({ ...suggestionData, messageID: message.id }),
                message.react(suggestionChannel.emojis.upvote),
                message.react(suggestionChannel.emojis.downvote)
            ]);

            await interaction.reply({
                content: "Suggestion has been added.",
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            Logger.error(`Error in add-suggestion command: ${error}`);
            await interaction.reply({
                content: "An error occurred while adding the suggestion.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};