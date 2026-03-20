import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import ModerationSystem from "../../features/ModerationSystem";
import Utility from "../../structures/Utility";

export default <BaseCommand>({
    data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Mute a user for a specified duration")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to mute")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("duration")
                .setDescription("Duration (e.g., 10m, 1h, 2d)")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("The reason for the mute")
                .setRequired(true)),
    config: {
        category: "moderation",
        usage: "<user> <duration> <reason>",
        examples: ["/mute @user 10m Spamming", "/mute @user 1h Inappropriate language"],
        permissions: ["ModerateMembers"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser("user", true);
        const durationStr = interaction.options.getString("duration", true);
        const reason = interaction.options.getString("reason", true);

        if (!interaction.guild) {
            return interaction.reply({
                content: "This command can only be used in a server.",
                ephemeral: true
            });
        }

        // Parse duration
        const duration = Utility.parseDuration(durationStr);
        if (!duration || duration < 1000 || duration > 28 * 24 * 60 * 60 * 1000) { // Max 28 days
            return interaction.reply({
                content: "Invalid duration. Please use format like: 10m, 1h, 2d (max 28 days)",
                ephemeral: true
            });
        }

        // Check if user is trying to mute themselves
        if (user.id === interaction.user.id) {
            return interaction.reply({
                content: "You cannot mute yourself.",
                ephemeral: true
            });
        }

        // Get member
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return interaction.reply({
                content: "User not found in this server.",
                ephemeral: true
            });
        }

        // Check if user is a bot
        if (user.bot) {
            return interaction.reply({
                content: "You cannot mute bots.",
                ephemeral: true
            });
        }

        // Check if target is a moderator/admin
        if (member.permissions.has(PermissionFlagsBits.ModerateMembers) || member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: "You cannot mute moderators or administrators.",
                ephemeral: true
            });
        }

        try {
            // Timeout the user
            await member.timeout(duration, reason);

            const moderationCase = await ModerationSystem.createCase(
                interaction.guild,
                user,
                interaction.user,
                "timeout",
                reason,
                duration
            );

            const embed = new EmbedBuilder()
                .setColor("#FF6B6B")
                .setTitle("🔇 User Muted")
                .addFields(
                    { name: "User", value: `${user.tag} (${user.id})`, inline: true },
                    { name: "Moderator", value: `${interaction.user.tag}`, inline: true },
                    { name: "Case ID", value: `#${moderationCase.caseID}`, inline: true },
                    { name: "Duration", value: `${Utility.formatDuration(duration)}`, inline: true },
                    { name: "Expires", value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true },
                    { name: "Reason", value: reason, inline: false }
                );

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Error muting user:", error);
            return interaction.reply({
                content: "Failed to mute user.",
                ephemeral: true
            });
        }
    }
})