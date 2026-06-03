import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    GuildMember
} from 'discord.js';
import { BaseCommand } from '../../interfaces';
import WelcomeSystem from '../../features/WelcomeSystem';
import Logger from '../../features/Logger';

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("wmpreview")
        .setDescription("Preview the welcome message that new members will see")
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
            const config = await WelcomeSystem.getWelcomeMessage(guildID);

            if (!config) {
                return interaction.reply({
                    content: "⚠️ No welcome message configured. Use `/set-welcome-channel` to set one up.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const member = interaction.member as GuildMember;
            const replacements = WelcomeSystem.getReplacements(member);

            // Build the preview embed
            const embed = WelcomeSystem.buildEmbed(config, replacements, member, interaction.client.user);

            // Build info text
            const infoLines: string[] = [];
            infoLines.push(`**Status:** ${config.enabled ? "🟢 Enabled" : "🔴 Disabled"}`);
            infoLines.push(`**Type:** ${config.type === "embed" ? "📋 Embed" : config.type === "text" ? "💬 Text" : "📋💬 Embed + Text"}`);
            infoLines.push(`**Channel:** <#${config.channelID}>`);
            if (config.dmEnabled) infoLines.push(`**DM Welcome:** ✅ Enabled`);
            if (config.roleEnabled && config.roleIDs.length > 0) infoLines.push(`**Auto-Roles:** ${config.roleIDs.length} role(s)`);
            if (config.embed.fields.length > 0) infoLines.push(`**Fields:** ${config.embed.fields.length}`);

            const infoEmbed = new EmbedBuilder()
                .setTitle("👁️ Welcome Message Preview")
                .setDescription(infoLines.join("\n"))
                .setColor("Greyple")
                .setTimestamp();

            await interaction.reply({
                content: "Here's what new members will see:",
                embeds: [infoEmbed, embed],
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            Logger.error(`Error in wmpreview command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while generating the preview.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
}