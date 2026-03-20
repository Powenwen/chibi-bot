import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    ChannelType
} from 'discord.js';
import { BaseCommand } from '../../interfaces';
import WelcomeSystem from '../../features/WelcomeSystem';

export default <BaseCommand> {
    data: new SlashCommandBuilder()
        .setName("set-welcome-channel")
        .setDescription("Sets the welcome channel for the server")
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
        ),
    config: {
        category: "welcome-system",
        usage: "/set-welcome-channel <channel>",
        examples: ["/set-welcome-channel #welcome"],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const channel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);
        const guildID = interaction.guild.id;

        const welcomeMessage = await WelcomeSystem.getWelcomeMessage(guildID);
        if (welcomeMessage) {
            await WelcomeSystem.editWelcomeMessage("channelID", channel.id, guildID);
        } else {
            await WelcomeSystem.addWelcomeMessage(guildID, channel.id);
        }

        await interaction.reply({
            content: `Welcome channel has been set to <#${channel.id}>.`,
            flags: MessageFlags.Ephemeral
        });
    }
}