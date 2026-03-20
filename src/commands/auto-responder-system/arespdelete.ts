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
import AutoResponderModel from "../../models/AutoResponderModel";
import Logger from "../../features/Logger";
import { redis } from "../../features/RedisDB";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("arespdelete")
        .setDescription("Delete an auto responder from the bot")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("The channel you want to delete the auto responder from")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption(option =>
            option
                .setName("trigger")
                .setDescription("The trigger of the auto responder to delete")
                .setRequired(true)
        ),
    config: {
        category: "auto-responder",
        usage: "<channel> <trigger>",
        examples: [
            "/arespdelete channel:#general trigger:hello",
            "/arespdelete channel:#support trigger:help"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const options = interaction.options;
            const channel = options.getChannel("channel", true, [ChannelType.GuildText]);
            const trigger = options.getString("trigger", true);

            if (!channel) return;

            const autoResponder = await AutoResponderModel.findOne({ 
                guildID: interaction.guildId, 
                channelID: channel.id,
                trigger: trigger
            });

            if (!autoResponder) {
                // Try case-insensitive search
                const caseInsensitiveResponder = await AutoResponderModel.findOne({
                    guildID: interaction.guildId,
                    channelID: channel.id,
                    trigger: { $regex: new RegExp(`^${trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
                });

                if (caseInsensitiveResponder) {
                    await caseInsensitiveResponder.deleteOne();
                } else {
                    return interaction.reply({
                        content: "There is no auto responder with this trigger in this channel.",
                        flags: MessageFlags.Ephemeral
                    });
                }
            } else {
                await autoResponder.deleteOne();
            }

            // Clear cache
            await redis.del(`autoresponder:${interaction.guildId}`);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Auto Responder Deleted")
                        .setDescription(`The auto responder with trigger \`${trigger}\` in <#${channel.id}> has been deleted.`)
                        .setColor("Red")
                        .setTimestamp()
                ]
            });
        } catch (error) {
            Logger.error(`Error in arespdelete command: ${error}`);
            await interaction.reply({
                content: "An error occurred while deleting the auto responder.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
