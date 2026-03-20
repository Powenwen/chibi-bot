import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder, 
    InteractionContextType,
    ApplicationIntegrationType,
    ChannelType,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import AutoReactionModel from "../../models/AutoReactionModel";
import Logger from "../../features/Logger";
import { redis } from "../../features/RedisDB";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("ardelete")
        .setDescription("Delete an auto reaction from the bot")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("The channel you want to delete the auto reaction from")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        ),
    config: {
        category: "auto-reaction",
        usage: "<channel>",
        examples: [
            "/delete-auto-reaction #general",
            "/delete-auto-reaction #starboard"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const options = interaction.options;
            const channel = options.getChannel("channel", true, [ChannelType.GuildText]);

            if (!channel) return;

            const autoReaction = await AutoReactionModel.findOne({ guildID: interaction.guildId, channelID: channel.id });
            if (!autoReaction) {
                return interaction.reply({
                    content: "There are no auto reactions in this channel.",
                    flags: MessageFlags.Ephemeral
                });
            }

            await autoReaction.deleteOne();

            // Clear cache
            await redis.del(`guild:${interaction.guildId}`);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Auto Reaction Deleted")
                        .setDescription(`The auto reaction in <#${channel.id}> has been deleted.`)
                        .setColor("Red")
                        .setTimestamp()
                ]
            });
        } catch (error) {
            Logger.error(`Error in ardelete command: ${error}`);
            await interaction.reply({
                content: "An error occurred while deleting the auto reaction.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
}