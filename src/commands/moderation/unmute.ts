import {
    EmbedBuilder,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";

export default <BaseCommand> {
    data: new SlashCommandBuilder()
        .setName("unmute")
        .setDescription("Remove timeout from a user")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to unmute")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("The reason for unmuting")
                .setRequired(false)),
    config: {
        category: "moderation",
        usage: "<user> [reason]",
        examples: ["/unmute @user", "/unmute @user Spamming"],
        permissions: ["ModerateMembers"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason") || "No reason provided";

        if (!interaction.guild) {
            return interaction.reply({
                content: "This command can only be used in a server.",
                flags: MessageFlags.Ephemeral
            });
        }

        // Get member
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return interaction.reply({
                content: "User not found in this server.",
                flags: MessageFlags.Ephemeral
            });
        }

        // Check if user is actually muted
        if (!member.isCommunicationDisabled()) {
            return interaction.reply({
                content: "This user is not currently muted.",
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            // Remove timeout
            await member.timeout(null, reason);

            // Note: Since "unmute" is not a valid case type, we'll log it as a separate action
            // or you could extend the moderation types to include "unmute"
            const embed = new EmbedBuilder()
                .setColor("#4ECDC4")
                .setTitle("🔊 User Unmuted")
                .addFields(
                    { name: "User", value: `${user.tag} (${user.id})`, inline: true },
                    { name: "Moderator", value: `${interaction.user.tag}`, inline: true },
                    { name: "Reason", value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Try to DM the user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor("#4ECDC4")
                    .setTitle("🔊 You Have Been Unmuted")
                    .setDescription(`Your timeout has been removed in **${interaction.guild.name}**`)
                    .addFields(
                        { name: "Reason", value: reason, inline: false },
                        { name: "Moderator", value: `${interaction.user.tag}`, inline: true }
                    )
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.error("Failed to send DM:", error);
            }
        } catch (error) {
            console.error("Error unmuting user:", error);
            return interaction.reply({
                content: "Failed to unmute user.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
};