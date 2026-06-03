import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import SuggestionModel from "../../models/SuggestionModel";
import Logger from "../../features/Logger";

const STATUS_EMOJI: Record<string, string> = {
    Pending: "⏳",
    Approved: "✅",
    Denied: "❌",
    Implemented: "🚀",
    Considered: "💭"
};

const PRIORITY_EMOJI: Record<string, string> = {
    low: "🟢",
    medium: "🟡",
    high: "🟠",
    critical: "🔴"
};

const STATUS_COLORS: Record<string, string> = {
    Pending: "#FFA500",
    Approved: "#57F287",
    Denied: "#ED4245",
    Implemented: "#5865F2",
    Considered: "#FEE75C"
};

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("suggestion-info")
        .setDescription("View detailed information about a specific suggestion")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addStringOption(option =>
            option.setName("suggestion-id")
                .setDescription("The ID of the suggestion")
                .setRequired(true)
        ),
    config: {
        category: "suggestion-system",
        usage: "<suggestion-id>",
        examples: ["/suggestion-info suggestion-id:5"],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const suggestionID = interaction.options.getString("suggestion-id", true);
            const guildID = interaction.guild.id;

            const suggestion = await SuggestionModel.findOne({ guildID, suggestionID });
            if (!suggestion) {
                return interaction.reply({
                    content: `❌ No suggestion found with ID \`${suggestionID}\`.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const upvoteCount = suggestion.upvotes?.length || 0;
            const downvoteCount = suggestion.downvotes?.length || 0;
            const netVotes = upvoteCount - downvoteCount;

            const embed = new EmbedBuilder()
                .setTitle(`💡 Suggestion #${suggestionID}`)
                .setDescription(suggestion.suggestion)
                .setColor((STATUS_COLORS[suggestion.status] || "#FFA500") as any)
                .setTimestamp(suggestion.createdAt);

            // Info fields
            embed.addFields([
                { name: "Status", value: `${STATUS_EMOJI[suggestion.status]} ${suggestion.status}`, inline: true },
                { name: "Category", value: suggestion.category || "General", inline: true },
                { name: "Priority", value: `${PRIORITY_EMOJI[suggestion.priority] || "🟡"} ${(suggestion.priority || "medium").charAt(0).toUpperCase() + (suggestion.priority || "medium").slice(1)}`, inline: true },
                { name: "Author", value: suggestion.anonymous ? "🔒 Anonymous" : `<@${suggestion.authorID}>`, inline: true },
                { name: "Votes", value: `👍 ${upvoteCount} | 👎 ${downvoteCount} | Net: ${netVotes >= 0 ? "+" : ""}${netVotes}`, inline: true },
                { name: "Anonymous", value: suggestion.anonymous ? "Yes" : "No", inline: true }
            ]);

            // Response (if any)
            if (suggestion.response) {
                embed.addFields({
                    name: `Response${suggestion.responseAuthorID ? ` (by <@${suggestion.responseAuthorID}>)` : ""}`,
                    value: suggestion.response,
                    inline: false
                });
            }

            // Notes (if any)
            if (suggestion.notes) {
                embed.addFields({
                    name: "📝 Staff Notes",
                    value: suggestion.notes,
                    inline: false
                });
            }

            // Attachment
            if (suggestion.attachmentUrl) {
                embed.setImage(suggestion.attachmentUrl);
            }

            // Implementation info
            if (suggestion.status === "Implemented" && suggestion.implementedAt) {
                embed.addFields({
                    name: "🚀 Implemented",
                    value: `By <@${suggestion.implementedBy}> on ${suggestion.implementedAt.toLocaleDateString()}`,
                    inline: false
                });
            }

            // Timestamps
            const footerParts: string[] = [`ID: ${suggestionID}`];
            if (suggestion.updatedAt && suggestion.updatedAt.getTime() !== suggestion.createdAt.getTime()) {
                footerParts.push(`Updated: ${suggestion.updatedAt.toLocaleDateString()}`);
            }
            embed.setFooter({ text: footerParts.join(" • ") });

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            Logger.error(`Error in suggestion-info command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while fetching suggestion info.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
