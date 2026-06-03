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
import Logger from "../../features/Logger";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("warn-remove")
        .setDescription("Remove a specific warning from a user by case ID")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addStringOption(option =>
            option.setName("case-id")
                .setDescription("The case ID of the warning to remove (e.g., 12345678-0001)")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for removing this warning")
                .setRequired(false)
                .setMaxLength(500)),
    config: {
        category: "warn-system",
        usage: "<case-id> [reason]",
        examples: [
            "/warn-remove case-id:12345678-0001",
            "/warn-remove case-id:12345678-0001 reason:Warning was issued in error"
        ],
        permissions: ["ModerateMembers"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const caseID = interaction.options.getString("case-id", true);
            const removalReason = interaction.options.getString("reason") || "No reason provided";

            const result = await ModerationSystem.removeWarning(
                interaction.guild.id,
                caseID,
                interaction.user.id,
                removalReason
            );

            if (!result.success) {
                return interaction.reply({
                    content: `❌ ${result.message}`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("✅ Warning Removed")
                .setDescription(`Warning **#${caseID}** has been removed.`)
                .addFields([
                    { name: "User", value: `<@${result.userID}>`, inline: true },
                    { name: "Original Reason", value: result.originalReason || "N/A", inline: false },
                    { name: "Removal Reason", value: removalReason, inline: false },
                    { name: "Removed By", value: `${interaction.user.tag}`, inline: true },
                    { name: "Remaining Warnings", value: (result.remainingCount ?? 0).toString(), inline: true }
                ])
                .setColor("#57F287")
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error(`Error in warn-remove command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while removing the warning.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
