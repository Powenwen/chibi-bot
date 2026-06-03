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
        .setName("warn-list")
        .setDescription("View all warnings for a user")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to view warnings for")
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName("page")
                .setDescription("Page number (default: 1)")
                .setRequired(false)
                .setMinValue(1)),
    config: {
        category: "warn-system",
        usage: "<user> [page]",
        examples: [
            "/warn-list user:@user",
            "/warn-list user:@user page:2"
        ],
        permissions: ["ModerateMembers"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const user = interaction.options.getUser("user", true);
            const page = interaction.options.getInteger("page") ?? 1;
            const perPage = 5;

            const allWarnings = await ModerationSystem.getUserWarnings(
                interaction.guild.id,
                user.id
            );

            const totalWarnings = allWarnings.length;
            const totalPages = Math.ceil(totalWarnings / perPage) || 1;
            const currentPage = Math.min(page, totalPages);
            const skip = (currentPage - 1) * perPage;
            const warnings = allWarnings.slice(skip, skip + perPage);

            const activeWarnings = allWarnings.filter(w => w.active).length;

            const embed = new EmbedBuilder()
                .setTitle(`⚠️ Warning History — ${user.tag}`)
                .setDescription(
                    `**${totalWarnings}** total warning${totalWarnings !== 1 ? "s" : ""} | ` +
                    `**${activeWarnings}** active | ` +
                    `**${totalWarnings - activeWarnings}** removed`
                )
                .setColor("#FFA500")
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();

            if (warnings.length === 0) {
                embed.setDescription("📭 No warnings found for this user.");
            } else {
                for (const w of warnings) {
                    const fields: string[] = [];
                    fields.push(`**Reason:** ${w.reason}`);
                    fields.push(`**Moderator:** <@${w.moderatorID}>`);
                    fields.push(`**Date:** ${w.createdAt.toLocaleDateString()}`);
                    fields.push(`**Status:** ${w.active ? "🟢 Active" : "🔴 Removed"}`);
                    if (w.evidence && w.evidence.length > 0) {
                        fields.push(`**Evidence:** ${w.evidence.length} attachment(s)`);
                    }

                    embed.addFields({
                        name: `📋 Case #${w.caseID}`,
                        value: fields.join("\n"),
                        inline: false
                    });
                }
            }

            embed.setFooter({ text: `Page ${currentPage}/${totalPages} • Use /warn-info <caseID> for details` });

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            Logger.error(`Error in warn-list command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while fetching warnings.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
