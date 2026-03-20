import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags
} from 'discord.js';
import { BaseCommand } from '../../interfaces';
import Logger from '../../features/Logger';

/**
 * Quick Guide on the Formats:
 * 1. {user} - The mentioned user
 * 2. {server} - The server name
 * 3. {memberCount} - The server member count
 * 4. {username} - The username of the mentioned user
 * 5. {dateJoined} - The date the mentioned user joined the server
 */

export default <BaseCommand> {
    data: new SlashCommandBuilder()
        .setName("wmformats")
        .setDescription("View the available formats for the welcome message description")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "welcome-system",
        usage: "/wmformats",
        examples: ["/wmformats"],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle("Available Formats")
                .setDescription(`**Here are the available formats for the welcome message description**:\n\n` +
                    `**{user}** - The mentioned user\n` +
                    `**{server}** - The server name\n` +
                    `**{memberCount}** - The server member count\n` +
                    `**{username}** - The username of the mentioned user\n` +
                    `**{dateJoined}** - The date the mentioned user joined the server\n\n` +
                    `**Example**:\n` +
                    `\`\`\`Welcome {user} to {server}! There are now {memberCount} members in the server.\`\`\``
                )
                .setColor("Aqua");

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            Logger.error(`Error in wmformats command: ${error}`);
            await interaction.reply({
                content: "An error occurred while displaying the formats.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
}