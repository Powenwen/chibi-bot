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
        .setName("warn-clear")
        .setDescription("Clear all warnings for a user")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to clear warnings for")
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName("confirm")
                .setDescription("Confirm that you want to clear all warnings")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for clearing all warnings")
                .setRequired(false)
                .setMaxLength(500)),
    config: {
        category: "warn-system",
        usage: "<user> <confirm> [reason]",
        examples: [
            "/warn-clear user:@user confirm:true",
            "/warn-clear user:@user confirm:true reason:Good behavior reset"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const user = interaction.options.getUser("user", true);
        const confirm = interaction.options.getBoolean("confirm", true);
        const reason = interaction.options.getString("reason") || "No reason provided";

        if (!confirm) {
            return interaction.reply({
                content: "❌ You must set `confirm:true` to clear all warnings for a user.",
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            const result = await ModerationSystem.clearAllWarnings(
                interaction.guild.id,
                user.id,
                interaction.user.id,
                reason
            );

            if (!result.success) {
                return interaction.reply({
                    content: `❌ ${result.message}`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("🧹 All Warnings Cleared")
                .setDescription(`All warnings for **${user.tag}** have been cleared.`)
                .addFields([
                    { name: "User", value: `${user.tag} (${user.id})`, inline: true },
                    { name: "Warnings Cleared", value: (result.clearedCount ?? 0).toString(), inline: true },
                    { name: "Reason", value: reason, inline: false },
                    { name: "Cleared By", value: `${interaction.user.tag}`, inline: true }
                ])
                .setColor("#57F287")
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error(`Error in warn-clear command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while clearing warnings.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
