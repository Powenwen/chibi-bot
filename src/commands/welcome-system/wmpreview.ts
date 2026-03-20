import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    ColorResolvable,
    GuildMember
} from 'discord.js';
import { BaseCommand } from '../../interfaces';
import WelcomeSystem from '../../features/WelcomeSystem';
import Logger from '../../features/Logger';

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("wmpreview")
        .setDescription("Preview the welcome message for the server")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "welcome-system",
        usage: "/wmpreview",
        examples: ["/wmpreview"],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const guildID = interaction.guild.id;
            const welcomeMessage = await WelcomeSystem.getWelcomeMessage(guildID);
            if (!welcomeMessage) {
                await interaction.reply({
                    content: "No welcome message has been set for this server.",
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(welcomeMessage.embed.title)
                .setColor(welcomeMessage.embed.color as ColorResolvable);

            const description = WelcomeSystem.parseWelcomeDescription(
                welcomeMessage.embed.description, 
                interaction.member as GuildMember
            );

            embed.setDescription(description);

            if (welcomeMessage.embed.thumbnail) {
                embed.setThumbnail(interaction.client.user.displayAvatarURL());
            }

            if (welcomeMessage.embed.footer.enabled) {
                embed.setFooter({
                    text: welcomeMessage.embed.footer.text
                });
                if (welcomeMessage.embed.footer.timestamp) {
                    embed.setTimestamp();
                }
            }

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            Logger.error(`Error in wmpreview command: ${error}`);
            await interaction.reply({
                content: "An error occurred while generating the preview.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
}