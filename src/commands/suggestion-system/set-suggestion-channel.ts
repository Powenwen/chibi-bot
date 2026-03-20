import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    ChannelType
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import SuggestionChannelModel from "../../models/SuggestionChannelModel";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("set-suggestion-channel")
        .setDescription("Set the suggestion channel for the server.")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("The channel to set as the suggestion channel.")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        ),
    config: {
        category: "suggestion-system",
        usage: "<#channel>",
        examples: ["/set-suggestion-channel #suggestions"],
        permissions: ["ManageMessages"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const channel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);
        const guildID = interaction.guildId;

        const suggestionChannel = await SuggestionChannelModel.findOne({ guildID });
        if (suggestionChannel) {
            suggestionChannel.channelID = channel.id;
            await suggestionChannel.save();
        } else {
            await SuggestionChannelModel.create({ 
                guildID, 
                channelID: channel.id,
                emojis: {
                    upvote: "👍",
                    downvote: "👎"
                }
            });
        }

        await interaction.reply({
            content: `Suggestion channel has been set to <#${channel.id}>.`,
            flags: MessageFlags.Ephemeral
        });
    }
};