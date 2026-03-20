import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import ModerationSystem from "../../features/ModerationSystem";
import Logger from "../../features/Logger";

export default <BaseCommand>({
    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Issue a warning to a user for rule violations")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to warn")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("The reason for issuing this warning")
                .setRequired(true)),
    config: {
        category: "moderation",
        usage: "/warn <user> <reason>",
        examples: [
            "/warn @user Spamming in general chat",
            "/warn @user Inappropriate language",
            "/warn @user Disrespecting other members"
        ],
        permissions: ["ModerateMembers"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const options = interaction.options;
        const user = options.getUser("user", true);
        const reason = options.getString("reason", true);

        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ This command can only be used in a server.",
                ephemeral: true
            });
        }

        // Check if user is trying to warn themselves
        if (user.id === interaction.user.id) {
            return interaction.reply({
                content: "❌ You cannot warn yourself.",
                ephemeral: true
            });
        }

        // Check if user is trying to warn a bot
        if (user.bot) {
            return interaction.reply({
                content: "❌ You cannot warn bots.",
                ephemeral: true
            });
        }

        // Check if target is a moderator/admin
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (member && (member.permissions.has(PermissionFlagsBits.ModerateMembers) || member.permissions.has(PermissionFlagsBits.Administrator))) {
            return interaction.reply({
                content: "❌ You cannot warn moderators or administrators.",
                ephemeral: true
            });
        }

        try {
            const moderationCase = await ModerationSystem.createCase(
                interaction.guild,
                user,
                interaction.user,
                "warn",
                reason
            );

            // Get updated warning count for display
            const warningCount = await ModerationSystem.getWarningCount(interaction.guild.id, user.id);

            const embed = new EmbedBuilder()
                .setColor("#FFA500")
                .setTitle("⚠️ User Warned")
                .addFields(
                    { name: "👤 User", value: `${user.tag} (${user.id})`, inline: true },
                    { name: "🛡️ Moderator", value: `${interaction.user.tag}`, inline: true },
                    { name: "📋 Case ID", value: `#${moderationCase.caseID}`, inline: true },
                    { name: "📝 Reason", value: reason, inline: false },
                    { name: "⚠️ Total Warnings", value: warningCount.toString(), inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Check for escalation after warning is issued
            await ModerationSystem.checkWarningEscalation(interaction.guild, user, interaction.user);

            // Try to DM the user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor("#FFA500")
                    .setTitle("⚠️ Warning Received")
                    .setDescription(`You have been warned in **${interaction.guild.name}**`)
                    .addFields(
                        { name: "📝 Reason", value: reason, inline: false },
                        { name: "📋 Case ID", value: `#${moderationCase.caseID}`, inline: true },
                        { name: "⚠️ Total Warnings", value: warningCount.toString(), inline: true }
                    )
                    .setFooter({ text: "Please follow the server rules to avoid further action." })
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                Logger.warn(`Failed to send warning DM to user ${user.id}: ${error}`);
            }
        } catch (error) {
            Logger.error(`Error warning user ${user.id}: ${error}`);
            return interaction.reply({
                content: "❌ Failed to warn user. Please try again later.",
                ephemeral: true
            });
        }
    }
});