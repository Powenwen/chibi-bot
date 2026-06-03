import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    MessageFlags
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
                .setRequired(true)
                .setMaxLength(1000))
        .addStringOption(option =>
            option.setName("notes")
                .setDescription("Private staff notes about this warning (not shown to user)")
                .setRequired(false)
                .setMaxLength(500))
        .addAttachmentOption(option =>
            option.setName("evidence")
                .setDescription("Attach evidence (screenshot, etc.)")
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName("silent")
                .setDescription("Don't DM the user about this warning")
                .setRequired(false)),
    config: {
        category: "warn-system",
        usage: "/warn <user> <reason> [notes] [evidence] [silent]",
        examples: [
            "/warn @user Spamming in general chat",
            "/warn @user Inappropriate language notes:3rd offense",
            "/warn @user Raid participation evidence:[screenshot.png] silent:true"
        ],
        permissions: ["ModerateMembers"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);
        const notes = interaction.options.getString("notes");
        const evidence = interaction.options.getAttachment("evidence");
        const silent = interaction.options.getBoolean("silent") ?? false;

        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ This command can only be used in a server.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (user.id === interaction.user.id) {
            return interaction.reply({
                content: "❌ You cannot warn yourself.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (user.bot) {
            return interaction.reply({
                content: "❌ You cannot warn bots.",
                flags: MessageFlags.Ephemeral
            });
        }

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (member && (member.permissions.has(PermissionFlagsBits.ModerateMembers) || member.permissions.has(PermissionFlagsBits.Administrator))) {
            return interaction.reply({
                content: "❌ You cannot warn moderators or administrators.",
                flags: MessageFlags.Ephemeral
            });
        }

        // Validate evidence
        let evidenceUrl = "";
        if (evidence) {
            if (!evidence.contentType?.startsWith("image/")) {
                return interaction.reply({
                    content: "❌ Evidence must be an image file.",
                    flags: MessageFlags.Ephemeral
                });
            }
            if (evidence.size > 8 * 1024 * 1024) {
                return interaction.reply({
                    content: "❌ Evidence file must be under 8MB.",
                    flags: MessageFlags.Ephemeral
                });
            }
            evidenceUrl = evidence.url;
        }

        try {
            const moderationCase = await ModerationSystem.createCase(
                interaction.guild,
                user,
                interaction.user,
                "warn",
                reason,
                undefined,
                evidenceUrl ? [evidenceUrl] : undefined
            );

            const warningCount = await ModerationSystem.getWarningCount(interaction.guild.id, user.id);

            // Build the response embed
            const embed = new EmbedBuilder()
                .setColor("#FFA500")
                .setTitle("⚠️ User Warned")
                .addFields([
                    { name: "👤 User", value: `${user.tag} (${user.id})`, inline: true },
                    { name: "🛡️ Moderator", value: `${interaction.user.tag}`, inline: true },
                    { name: "📋 Case ID", value: `#${moderationCase.caseID}`, inline: true },
                    { name: "📝 Reason", value: reason, inline: false },
                    { name: "⚠️ Total Warnings", value: warningCount.toString(), inline: true },
                    { name: "📎 Evidence", value: evidenceUrl ? "✅ Attached" : "None", inline: true }
                ])
                .setTimestamp();

            if (notes) {
                embed.addFields({ name: "🔒 Staff Notes", value: notes, inline: false });
            }

            await interaction.reply({ embeds: [embed] });

            // Check for escalation
            await ModerationSystem.checkWarningEscalation(interaction.guild, user, interaction.user);

            // DM the user (unless silent)
            if (!silent) {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor("#FFA500")
                        .setTitle("⚠️ Warning Received")
                        .setDescription(`You have been warned in **${interaction.guild.name}**`)
                        .addFields([
                            { name: "📝 Reason", value: reason, inline: false },
                            { name: "📋 Case ID", value: `#${moderationCase.caseID}`, inline: true },
                            { name: "⚠️ Total Warnings", value: warningCount.toString(), inline: true }
                        ])
                        .setFooter({ text: "Please follow the server rules to avoid further action." })
                        .setTimestamp();

                    await user.send({ embeds: [dmEmbed] });
                } catch (error) {
                    Logger.warn(`Failed to send warning DM to user ${user.id}: ${error}`);
                }
            }
        } catch (error) {
            Logger.error(`Error warning user ${user.id}: ${error}`);
            return interaction.reply({
                content: "❌ Failed to warn user. Please try again later.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
});
