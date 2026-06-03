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
import { CacheManager } from "../../utils/CacheManager";
import { CacheKeys } from "../../constants/CacheKeys";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("ardelete")
        .setDescription("Delete an auto-reaction from a channel")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("The channel to remove auto-reactions from")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        ),
    config: {
        category: "auto-reaction",
        usage: "<channel>",
        examples: [
            "/ardelete channel:#general",
            "/ardelete channel:#starboard"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const channel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);

            if (!channel) {
                return interaction.reply({
                    content: "❌ Invalid channel specified.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const autoReaction = await AutoReactionModel.findOne({
                guildID: interaction.guild.id,
                channelID: channel.id
            });

            if (!autoReaction) {
                return interaction.reply({
                    content: `⚠️ No auto-reaction configured in <#${channel.id}>.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Store info before deletion for the confirmation embed
            const emojiCount = autoReaction.emojis?.length ?? 0;
            const emojiPreview = autoReaction.emojis?.slice(0, 5).map((e: any) => e.raw).join(" ") ?? "None";
            const authorId = autoReaction.authorID;

            await autoReaction.deleteOne();

            // Invalidate cache
            const cacheManager = CacheManager.getInstance();
            await cacheManager.delete(CacheKeys.autoReaction.channel(interaction.guild.id, channel.id));
            await cacheManager.delete(CacheKeys.autoReaction.all(interaction.guild.id));

            const embed = new EmbedBuilder()
                .setTitle("🗑️ Auto-Reaction Deleted")
                .setDescription(`Auto-reaction removed from <#${channel.id}>`)
                .addFields([
                    {
                        name: "Emojis Removed",
                        value: emojiCount > 5 ? `${emojiPreview}... (${emojiCount} total)` : emojiPreview,
                        inline: false
                    },
                    {
                        name: "Originally Added By",
                        value: `<@${authorId}>`,
                        inline: true
                    }
                ])
                .setColor("Red")
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error(`Error in ardelete command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while deleting the auto-reaction.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
}