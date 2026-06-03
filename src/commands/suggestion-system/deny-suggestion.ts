import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    TextChannel
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import SuggestionModel from "../../models/SuggestionModel";
import SuggestionChannelModel from "../../models/SuggestionChannelModel";
import Logger from "../../features/Logger";
import { CacheManager } from "../../utils/CacheManager";
import { CacheKeys } from "../../constants/CacheKeys";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("deny-suggestion")
        .setDescription("Deny a pending suggestion")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addStringOption(option =>
            option.setName("suggestion-id")
                .setDescription("The ID of the suggestion to deny")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for denial")
                .setRequired(true)
                .setMaxLength(2000)
        )
        .addBooleanOption(option =>
            option.setName("notify-user")
                .setDescription("DM the suggestion author about the denial (default: true)")
                .setRequired(false)
        ),
    config: {
        category: "suggestion-system",
        usage: "<suggestion-id> <reason> [notify-user]",
        examples: [
            "/deny-suggestion suggestion-id:1 reason:This is not feasible at this time.",
            "/deny-suggestion suggestion-id:3 reason:Duplicate of suggestion #1"
        ],
        permissions: ["ManageMessages"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const suggestionID = interaction.options.getString("suggestion-id", true);
            const reason = interaction.options.getString("reason", true);
            const notifyUser = interaction.options.getBoolean("notify-user") ?? true;
            const guildID = interaction.guild.id;

            if (reason.length > 2000) {
                return interaction.reply({
                    content: "❌ Reason cannot exceed 2000 characters.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const suggestion = await SuggestionModel.findOne({ guildID, suggestionID });
            if (!suggestion) {
                return interaction.reply({
                    content: `❌ No suggestion found with ID \`${suggestionID}\`.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            if (suggestion.status !== "Pending") {
                return interaction.reply({
                    content: `⚠️ Suggestion #${suggestionID} has already been **${suggestion.status}**.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const channel = await interaction.client.channels.fetch(suggestion.channelID);
            if (!channel || !(channel instanceof TextChannel)) {
                return interaction.reply({
                    content: "❌ The suggestion channel no longer exists.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const originalMessage = await channel.messages.fetch(suggestion.messageID).catch(() => null);

            const upvoteCount = suggestion.upvotes?.length || 0;
            const downvoteCount = suggestion.downvotes?.length || 0;
            const netVotes = upvoteCount - downvoteCount;

            const embed = new EmbedBuilder()
                .setTitle(`❌ Suggestion #${suggestionID} — Denied`)
                .setDescription(suggestion.suggestion)
                .setColor("#ED4245")
                .addFields([
                    { name: "Category", value: suggestion.category || "General", inline: true },
                    { name: "Priority", value: suggestion.priority || "Medium", inline: true },
                    { name: "Votes", value: `👍 ${upvoteCount} | 👎 ${downvoteCount} | Net: ${netVotes >= 0 ? "+" : ""}${netVotes}`, inline: true },
                    { name: "Reason", value: reason, inline: false }
                ])
                .setFooter({
                    text: `Denied by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            if (suggestion.attachmentUrl) {
                embed.setImage(suggestion.attachmentUrl);
            }

            if (originalMessage) {
                await originalMessage.delete().catch(() => null);
            }
            const newMessage = await channel.send({ embeds: [embed] });

            await SuggestionModel.updateOne(
                { guildID, suggestionID },
                {
                    status: "Denied",
                    response: reason,
                    responseAuthorID: interaction.user.id,
                    messageID: newMessage.id,
                    channelID: newMessage.channel.id
                }
            );

            const cacheManager = CacheManager.getInstance();
            await cacheManager.delete(CacheKeys.suggestion.single(guildID, suggestionID));
            await cacheManager.delete(CacheKeys.suggestion.pending(guildID));

            // Notify user via DM
            if (notifyUser && !suggestion.anonymous) {
                const channelConfig = await SuggestionChannelModel.findOne({ guildID });
                if (channelConfig?.dmOnResponse) {
                    try {
                        const author = await interaction.client.users.fetch(suggestion.authorID);
                        const dmEmbed = new EmbedBuilder()
                            .setTitle("❌ Your Suggestion Was Denied")
                            .setDescription(`Your suggestion **#${suggestionID}** in **${interaction.guild.name}** has been denied.`)
                            .addFields([
                                { name: "Suggestion", value: suggestion.suggestion.substring(0, 1024), inline: false },
                                { name: "Reason", value: reason, inline: false }
                            ])
                            .setColor("#ED4245")
                            .setTimestamp();
                        await author.send({ embeds: [dmEmbed] });
                    } catch {
                        // User may have DMs disabled
                    }
                }
            }

            await interaction.reply({
                content: `❌ Suggestion #${suggestionID} has been denied.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            Logger.error(`Error in deny-suggestion command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while denying the suggestion.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
