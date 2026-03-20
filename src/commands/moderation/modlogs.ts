import {
    EmbedBuilder,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import ModerationSystem from "../../features/ModerationSystem";
import Utility from "../../structures/Utility";

export default <BaseCommand> {
    data: new SlashCommandBuilder()
        .setName("modlogs")
        .setDescription("View moderation logs for a user or recent server activity")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to view logs for (leave empty for recent server activity)")
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName("limit")
                .setDescription("Number of cases to show (default: 10, max: 25)")
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(25)),
    config: {
        category: "moderation",
        usage: "[user] [limit]",
        examples: ["/modlogs", "/modlogs @user", "/modlogs @user 5"],
        permissions: ["ModerateMembers"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: "This command can only be used in a server.",
                flags: MessageFlags.Ephemeral
            });
        }

        const user = interaction.options.getUser("user");
        const limit = interaction.options.getInteger("limit") || 10;

        try {
            let cases;
            let title;

            if (user) {
                const allCases = await ModerationSystem.getUserHistory(interaction.guild.id, user.id);
                cases = allCases.slice(0, limit);
                title = `📋 Moderation History for ${user.tag}`;
            } else {
                // Get recent cases for the guild
                const ModerationModel = (await import("../../models/ModerationModel")).default;
                cases = await ModerationModel.find({ guildID: interaction.guild.id })
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .lean();
                title = `📋 Recent Moderation Activity`;
            }

            if (cases.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor("#6C7B7F")
                    .setTitle(title)
                    .setDescription(user ? "This user has no moderation history." : "No recent moderation activity.")
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }

            // Create embed with case information
            const embed = new EmbedBuilder()
                .setColor("#4F46E5")
                .setTitle(title)
                .setDescription(`Showing ${cases.length} case${cases.length === 1 ? '' : 's'}`)
                .setTimestamp();

            // Add fields for each case
            for (const moderationCase of cases) {
                const moderator = interaction.client.users.cache.get(moderationCase.moderatorID) || { tag: "Unknown Moderator" };
                
                let value = `**Moderator:** ${moderator.tag}\n**Reason:** ${moderationCase.reason}`;
                
                if (moderationCase.duration) {
                    value += `\n**Duration:** ${Utility.formatDuration(moderationCase.duration)}`;
                }
                
                if (moderationCase.expiresAt && moderationCase.expiresAt > new Date()) {
                    value += `\n**Expires:** <t:${Math.floor(moderationCase.expiresAt.getTime() / 1000)}:R>`;
                } else if (moderationCase.expiresAt) {
                    value += `\n**Expired:** <t:${Math.floor(moderationCase.expiresAt.getTime() / 1000)}:R>`;
                }

                embed.addFields({ name: `Case #${moderationCase.caseID}`, value, inline: false });
            }

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Error fetching moderation logs:", error);
            return interaction.reply({
                content: "An error occurred while fetching moderation logs.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
