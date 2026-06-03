import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import { BaseCommand } from '../../interfaces';
import WelcomeSystem from '../../features/WelcomeSystem';

export default <BaseCommand> {
    data: new SlashCommandBuilder()
        .setName("set-welcome-channel")
        .setDescription("Set or update the welcome channel for the server")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("The channel to send welcome messages to")
                .setRequired(true)
                .addChannelTypes([ChannelType.GuildText])
        )
        .addBooleanOption(option =>
            option.setName("enabled")
                .setDescription("Enable or disable the welcome system (default: true)")
                .setRequired(false)
        ),
    config: {
        category: "welcome-system",
        usage: "/set-welcome-channel <channel> [enabled]",
        examples: [
            "/set-welcome-channel channel:#welcome",
            "/set-welcome-channel channel:#welcome enabled:false"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const channel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);
        const enabled = interaction.options.getBoolean("enabled") ?? true;
        const guildID = interaction.guild.id;

        const existing = await WelcomeSystem.getWelcomeMessage(guildID);

        if (existing) {
            await WelcomeSystem.editWelcomeMessage("channelID", channel.id, guildID);
            await WelcomeSystem.editWelcomeMessage("enabled", enabled, guildID);
        } else {
            await WelcomeSystem.addWelcomeMessage(guildID, channel.id);
            if (!enabled) {
                await WelcomeSystem.editWelcomeMessage("enabled", false, guildID);
            }
        }

        const embed = new EmbedBuilder()
            .setTitle("✅ Welcome Channel Updated")
            .setDescription(`Welcome messages will be sent to <#${channel.id}>`)
            .addFields([
                {
                    name: "Channel",
                    value: `<#${channel.id}>`,
                    inline: true
                },
                {
                    name: "Status",
                    value: enabled ? "🟢 Enabled" : "🔴 Disabled",
                    inline: true
                },
                {
                    name: "Type",
                    value: existing?.type === "text" ? "Text" : existing?.type === "both" ? "Embed + Text" : "Embed",
                    inline: true
                }
            ])
            .setColor(enabled ? "Green" : "Orange")
            .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("welcome_preview")
                    .setLabel("Preview")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("👁️"),
                new ButtonBuilder()
                    .setCustomId("welcome_test")
                    .setLabel("Send Test")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("📨")
            );

        await interaction.reply({
            embeds: [embed],
            components: [row],
            flags: MessageFlags.Ephemeral
        });
    }
}