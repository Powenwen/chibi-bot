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
import SuggestionChannelModel from "../../models/SuggestionChannelModel";
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

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("list-suggestions")
        .setDescription("List all suggestions in this server")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addStringOption(option =>
            option.setName("status")
                .setDescription("Filter by status")
                .setRequired(false)
                .addChoices(
                    { name: "All", value: "all" },
                    { name: "⏳ Pending", value: "Pending" },
                    { name: "✅ Approved", value: "Approved" },
                    { name: "❌ Denied", value: "Denied" },
                    { name: "🚀 Implemented", value: "Implemented" },
                    { name: "💭 Considered", value: "Considered" }
                )
        )
        .addStringOption(option =>
            option.setName("category")
                .setDescription("Filter by category")
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName("page")
                .setDescription("Page number (default: 1)")
                .setRequired(false)
                .setMinValue(1)
        ),
    config: {
        category: "suggestion-system",
        usage: "[status] [category] [page]",
        examples: [
            "/list-suggestions",
            "/list-suggestions status:Pending",
            "/list-suggestions category:Features page:2"
        ],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const guildID = interaction.guild.id;
            const statusFilter = interaction.options.getString("status");
            const categoryFilter = interaction.options.getString("category");
            const page = interaction.options.getInteger("page") ?? 1;
            const perPage = 10;

            // Check if suggestion system is configured
            const channelConfig = await SuggestionChannelModel.findOne({ guildID });
            if (!channelConfig) {
                return interaction.reply({
                    content: "❌ The suggestion system has not been configured for this server.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Build query
            const query: Record<string, any> = { guildID };
            if (statusFilter && statusFilter !== "all") {
                query.status = statusFilter;
            }
            if (categoryFilter) {
                query.category = categoryFilter;
            }

            const total = await SuggestionModel.countDocuments(query);
            const totalPages = Math.ceil(total / perPage) || 1;
            const currentPage = Math.min(page, totalPages);
            const skip = (currentPage - 1) * perPage;

            const suggestions = await SuggestionModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(perPage);

            if (suggestions.length === 0) {
                return interaction.reply({
                    content: statusFilter && statusFilter !== "all"
                        ? `📭 No **${statusFilter}** suggestions found.`
                        : "📭 No suggestions found.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("💡 Server Suggestions")
                .setColor("Aqua")
                .setTimestamp();

            // Build description
            const filterDesc: string[] = [];
            if (statusFilter && statusFilter !== "all") filterDesc.push(`Status: **${statusFilter}**`);
            if (categoryFilter) filterDesc.push(`Category: **${categoryFilter}**`);

            embed.setDescription(
                filterDesc.length > 0 ? filterDesc.join(" | ") : "All suggestions" +
                `\n**${total}** total suggestion${total !== 1 ? "s" : ""}\n`
            );

            // Status summary
            const pendingCount = await SuggestionModel.countDocuments({ guildID, status: "Pending" });
            const approvedCount = await SuggestionModel.countDocuments({ guildID, status: "Approved" });
            const deniedCount = await SuggestionModel.countDocuments({ guildID, status: "Denied" });
            const implementedCount = await SuggestionModel.countDocuments({ guildID, status: "Implemented" });

            embed.addFields({
                name: "📊 Overview",
                value: `⏳ Pending: **${pendingCount}** | ✅ Approved: **${approvedCount}** | ❌ Denied: **${deniedCount}** | 🚀 Implemented: **${implementedCount}**`,
                inline: false
            });

            // Suggestion list
            let listText = "";
            for (const s of suggestions) {
                const upvoteCount = s.upvotes?.length || 0;
                const downvoteCount = s.downvotes?.length || 0;
                const netVotes = upvoteCount - downvoteCount;
                const priority = PRIORITY_EMOJI[s.priority] || "🟡";
                const status = STATUS_EMOJI[s.status] || "❓";
                const preview = s.suggestion.length > 60 ? s.suggestion.substring(0, 57) + "..." : s.suggestion;

                listText += `**#${s.suggestionID}** ${status} ${priority} ${s.category || "General"}\n`;
                listText += `└ ${preview} | 👍${upvoteCount} 👎${downvoteCount} (${netVotes >= 0 ? "+" : ""}${netVotes})\n\n`;
            }

            embed.addFields({
                name: `📋 Suggestions (Page ${currentPage}/${totalPages})`,
                value: listText,
                inline: false
            });

            embed.setFooter({ text: `Page ${currentPage}/${totalPages} • Use /suggestion-info <id> for details` });

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            Logger.error(`Error in list-suggestions command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while listing suggestions.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
