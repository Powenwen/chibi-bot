import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import ModerationSystem from "../../features/ModerationSystem";
import Utility from "../../structures/Utility";
import Logger from "../../features/Logger";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("warn-info")
        .setDescription("View detailed information about a specific warning")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addStringOption(option =>
            option.setName("case-id")
                .setDescription("The case ID of the warning (e.g., 12345678-0001)")
                .setRequired(true)),
    config: {
        category: "warn-system",
        usage: "<case-id>",
        examples: ["/warn-info case-id:12345678-0001"],
        permissions: ["ModerateMembers"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const caseID = interaction.options.getString("case-id", true);

            const warning = await ModerationSystem.getWarningByCaseID(
                interaction.guild.id,
                caseID
            );

            if (!warning) {
                return interaction.reply({
                    content: `❌ No warning found with case ID \`${caseID}\`.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(`📋 Warning #${caseID}`)
                .setColor(warning.active ? "#FFA500" : "#808080")
                .setTimestamp(warning.createdAt);

            const fields: { name: string; value: string; inline?: boolean }[] = [
                { name: "👤 User", value: `<@${warning.userID}>`, inline: true },
                { name: "🛡️ Moderator", value: `<@${warning.moderatorID}>`, inline: true },
                { name: "📊 Status", value: warning.active ? "🟢 Active" : "🔴 Removed", inline: true },
                { name: "📝 Reason", value: warning.reason, inline: false },
                { name: "📅 Date", value: warning.createdAt.toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                }), inline: true }
            ];

            if (warning.duration) {
                fields.push({
                    name: "⏱️ Duration",
                    value: Utility.formatDuration(warning.duration),
                    inline: true
                });
            }

            if (warning.evidence && warning.evidence.length > 0) {
                fields.push({
                    name: "📎 Evidence",
                    value: warning.evidence.map((url, i) => `[Attachment ${i + 1}](${url})`).join("\n"),
                    inline: false
                });
            }

            embed.addFields(fields);

            if (warning.evidence && warning.evidence.length > 0) {
                embed.setImage(warning.evidence[0]);
            }

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            Logger.error(`Error in warn-info command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while fetching warning info.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
