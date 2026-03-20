import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    GuildMember,
    TextChannel
} from 'discord.js';
import { BaseCommand } from '../../interfaces';
import Logger from '../../features/Logger';

export default <BaseCommand> {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Delete multiple messages from a channel")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("Number of messages to delete (1-100)")
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Only delete messages from this user")
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName("silent")
                .setDescription("Don't send a confirmation message")
                .setRequired(false)
        ),
    config: {
        category: "moderation",
        usage: "/clear <amount> [user] [silent]",
        examples: [
            "/clear 10",
            "/clear 50 @user",
            "/clear 25 silent:true"
        ],
        permissions: ["ManageMessages"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild || !(interaction.member instanceof GuildMember) || !(interaction.channel instanceof TextChannel)) return;

        try {
            const options = interaction.options;
            const amount = options.getInteger("amount", true);
            const targetUser = options.getUser("user");
            const silent = options.getBoolean("silent") || false;

            await interaction.deferReply({ ephemeral: true });

            // Fetch messages
            const messages = await interaction.channel.messages.fetch({ limit: amount + 1 });
            
            // Filter messages if a specific user is targeted
            let messagesToDelete = messages;
            if (targetUser) {
                messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id);
            }

            // Remove the interaction message from deletion
            messagesToDelete = messagesToDelete.filter(msg => msg.id !== interaction.id);

            if (messagesToDelete.size === 0) {
                await interaction.editReply({
                    content: targetUser 
                        ? `No messages found from ${targetUser.tag} in the last ${amount} messages.`
                        : "No messages found to delete."
                });
                return;
            }

            // Separate messages by age (Discord only allows bulk delete for messages < 14 days old)
            const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
            const bulkDeletable = messagesToDelete.filter(msg => msg.createdTimestamp > twoWeeksAgo);
            const individualDeletable = messagesToDelete.filter(msg => msg.createdTimestamp <= twoWeeksAgo);

            let deletedCount = 0;

            // Bulk delete newer messages
            if (bulkDeletable.size > 0) {
                try {
                    await interaction.channel.bulkDelete(bulkDeletable, true);
                    deletedCount += bulkDeletable.size;
                } catch (error) {
                    Logger.error(`Bulk delete failed: ${error}`);
                }
            }

            // Individual delete older messages
            if (individualDeletable.size > 0) {
                for (const message of individualDeletable.values()) {
                    try {
                        await message.delete();
                        deletedCount++;
                    } catch (error) {
                        Logger.warn(`Failed to delete message ${message.id}: ${error}`);
                    }
                }
            }

            // Create confirmation embed
            const embed = new EmbedBuilder()
                .setTitle("Messages Cleared")
                .setDescription(`Successfully deleted **${deletedCount}** message(s)`)
                .addFields([
                    { name: "Channel", value: `${interaction.channel}`, inline: true },
                    { name: "Moderator", value: interaction.user.tag, inline: true }
                ])
                .setColor("Green")
                .setTimestamp();

            if (targetUser) {
                embed.addFields([
                    { name: "Target User", value: `${targetUser.tag}`, inline: true }
                ]);
            }

            await interaction.editReply({ embeds: [embed] });

            // Send public confirmation if not silent
            if (!silent && deletedCount > 0) {
                const publicEmbed = new EmbedBuilder()
                    .setDescription(`🧹 **${deletedCount}** message(s) cleared by ${interaction.user}`)
                    .setColor("Green");

                const confirmationMsg = await interaction.channel.send({ embeds: [publicEmbed] });
                
                // Auto-delete confirmation after 5 seconds
                setTimeout(async () => {
                    try {
                        await confirmationMsg.delete();
                    } catch {
                        // Message already deleted or no permissions
                    }
                }, 5000);
            }

            Logger.info(`${interaction.user.tag} cleared ${deletedCount} messages in #${interaction.channel.name} (${interaction.guild.name})`);
        } catch (error) {
            Logger.error(`Error in clear command: ${error}`);
            await interaction.editReply({
                content: "An error occurred while trying to clear messages."
            }).catch(() => null);
        }
    }
}
