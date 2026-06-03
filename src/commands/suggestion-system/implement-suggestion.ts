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
        .setName("implement-suggestion")
        .setDescription("Mark a suggestion as implemented (has been built/released)")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addStringOption(option =>
            option.setName("suggestion-id")
                .setDescription("The ID of the suggestion to mark as implemented")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("notes")
                .setDescription("Implementation notes (e.g., version, details)")
                .setRequired(false)
                .setMaxLength(2000)
        )
        .addBooleanOption(option =>
            option.setName("notify-user")
                .setDescription("DM the suggestion author (default: true)")
                .setRequired(false)
        ),
    config: {
        category: "suggestion-system",
        usage: "<suggestion-id> [notes] [notify-user]",
        examples: [
            "/implement-suggestion suggestion-id:1",
            "/implement-suggestion suggestion-id:1 notes:Released in v2.5.0!"
        ],
        permissions: ["ManageMessages"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const suggestionID = interaction.options.getString("suggestion-id", true);
            const notes = interaction.options.getString("notes");
            const notifyUser = interaction.options.getBoolean("notify-user") ?? true;
            const guildID = interaction.guild.id;

            const suggestion = await SuggestionModel.findOne({ guildID, suggestionID });
            if (!suggestion) {
                return interaction.reply({
                    content: `❌ No suggestion found with ID \`${suggestionID}\`.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            if (suggestion.status === "Implemented") {
                return interaction.reply({
                    content: `⚠️ Suggestion #${suggestionID} is already marked as implemented.`,
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
                .setTitle(`🚀 Suggestion #${suggestionID} — Implemented`)
                .setDescription(suggestion.suggestion)
                .setColor("#5865F2")
                .addFields([
                    { name: "Category", value: suggestion.category || "General", inline: true },
                    { name: "Priority", value: suggestion.priority || "Medium", inline: true },
                    { name: "Votes", value: `👍 ${upvoteCount} | 👎 ${downvoteCount} | Net: ${netVotes >= 0 ? "+" : ""}${netVotes}`, inline: true }
                ])
                .setFooter({
                    text: `Implemented by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            if (notes) {
                embed.addFields({ name: "📝 Implementation Notes", value: notes, inline: false });
            }

            if (suggestion.response) {
                embed.addFields({ name: "Previous Response", value: suggestion.response, inline: false });
            }

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
                    status: "Implemented",
                    response: notes || suggestion.response || "Implemented!",
                    responseAuthorID: interaction.user.id,
                    messageID: newMessage.id,
                    channelID: newMessage.channel.id,
                    implementedAt: new Date(),
                    implementedBy: interaction.user.id
                }
            );

            const cacheManager = CacheManager.getInstance();
            await cacheManager.delete(CacheKeys.suggestion.single(guildID, suggestionID));
            await cacheManager.delete(CacheKeys.suggestion.all(guildID));
            await cacheManager.delete(CacheKeys.suggestion.pending(guildID));
            await cacheManager.delete(CacheKeys.suggestion.approved(guildID));

            // Notify user via DM
            if (notifyUser && !suggestion.anonymous) {
                const channelConfig = await SuggestionChannelModel.findOne({ guildID });
                if (channelConfig?.dmOnResponse) {
                    try {
                        const author = await interaction.client.users.fetch(suggestion.authorID);
                        const dmEmbed = new EmbedBuilder()
                            .setTitle("🚀 Your Suggestion Was Implemented!")
                            .setDescription(`Your suggestion **#${suggestionID}** in **${interaction.guild.name}** has been implemented!`)
                            .addFields([
                                { name: "Suggestion", value: suggestion.suggestion.substring(0, 1024), inline: false },
                                ...(notes ? [{ name: "Notes", value: notes, inline: false }] : [])
                            ])
                            .setColor("#5865F2")
                            .setTimestamp();
                        await author.send({ embeds: [dmEmbed] });
                    } catch {
                        // DMs disabled
                    }
                }
            }

            await interaction.reply({
                content: `🚀 Suggestion #${suggestionID} has been marked as implemented.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            Logger.error(`Error in implement-suggestion command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while marking the suggestion as implemented.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
