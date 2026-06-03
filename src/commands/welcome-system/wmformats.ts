import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags
} from 'discord.js';
import { BaseCommand } from '../../interfaces';
import WelcomeSystem from '../../features/WelcomeSystem';
import Logger from '../../features/Logger';

export default <BaseCommand> {
    data: new SlashCommandBuilder()
        .setName("wmformats")
        .setDescription("View all available placeholder formats for welcome messages")
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
            const guide = WelcomeSystem.getPlaceholderGuide();

            // Split into groups for multiple embeds if needed
            const embeds: EmbedBuilder[] = [];

            // Page 1: Core + Member
            const embed1 = new EmbedBuilder()
                .setTitle("📝 Welcome Message Placeholders")
                .setDescription("Use these placeholders in your welcome title, description, message, DM, and embed fields. They are replaced with real values when a member joins.\n")
                .setColor("Aqua")
                .setTimestamp();

            const core = guide.filter(g => ["user", "username", "userID", "memberMention", "memberTag", "memberDiscriminator", "isBot"].includes(g.placeholder));
            const server = guide.filter(g => ["server", "serverID", "serverIcon", "serverOwner", "memberCount", "serverBoosts", "serverBoostTier"].includes(g.placeholder));
            const dates = guide.filter(g => ["dateJoined", "accountCreated", "currentTime", "currentDate"].includes(g.placeholder));
            const media = guide.filter(g => ["userAvatar", "serverIcon"].includes(g.placeholder));

            embed1.addFields({
                name: "👤 Member",
                value: core.map(g => `\`{${g.placeholder}}\` — ${g.description}`).join("\n"),
                inline: false
            });
            embed1.addFields({
                name: "🏠 Server",
                value: server.map(g => `\`{${g.placeholder}}\` — ${g.description}`).join("\n"),
                inline: false
            });
            embed1.addFields({
                name: "📅 Dates & Time",
                value: dates.map(g => `\`{${g.placeholder}}\` — ${g.description}`).join("\n"),
                inline: false
            });

            embed1.setFooter({ text: "Use /wmedit to configure • Placeholders work in title, description, message, DM, and fields" });

            await interaction.reply({ embeds: [embed1], flags: MessageFlags.Ephemeral });
        } catch (error) {
            Logger.error(`Error in wmformats command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while displaying the formats.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
}