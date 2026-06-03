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
import { CacheManager } from "../../utils/CacheManager";
import { CacheKeys } from "../../constants/CacheKeys";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("arespdelete")
        .setDescription("Delete an auto-responder from a channel")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("The channel to delete the auto-responder from")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption(option =>
            option
                .setName("trigger")
                .setDescription("The trigger of the auto-responder to delete")
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
            const channel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);
            const trigger = interaction.options.getString("trigger", true);

            if (!channel) return;

            // Try exact match first, then case-insensitive
            let autoResponder = await AutoResponderModel.findOne({
                guildID: interaction.guild.id,
                channelID: channel.id,
                trigger
            });

            if (!autoResponder) {
                autoResponder = await AutoResponderModel.findOne({
                    guildID: interaction.guild.id,
                    channelID: channel.id,
                    trigger: { $regex: new RegExp(`^${trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
                });
            }

            if (!autoResponder) {
                return interaction.reply({
                    content: "⚠️ No auto-responder with that trigger found in this channel.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Store info before deletion
            const deletedTrigger = autoResponder.trigger;
            const wasEmbed = autoResponder.useEmbed;
            const authorId = autoResponder.authorID;

            await autoResponder.deleteOne();

            // Invalidate cache
            const cacheManager = CacheManager.getInstance();
            await cacheManager.delete(CacheKeys.autoResponder.channel(interaction.guild.id, channel.id));
            await cacheManager.delete(CacheKeys.autoResponder.all(interaction.guild.id));

            const embed = new EmbedBuilder()
                .setTitle("🗑️ Auto-Responder Deleted")
                .setDescription(`Auto-responder removed from <#${channel.id}>`)
                .addFields([
                    {
                        name: "Trigger",
                        value: `\`${deletedTrigger}\``,
                        inline: true
                    },
                    {
                        name: "Was Embed",
                        value: wasEmbed ? "Yes" : "No",
                        inline: true
                    },
                    {
                        name: "Added By",
                        value: `<@${authorId}>`,
                        inline: true
                    }
                ])
                .setColor("Red")
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error(`Error in arespdelete command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while deleting the auto-responder.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
