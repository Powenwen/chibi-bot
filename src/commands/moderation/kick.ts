import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    GuildMember
} from 'discord.js';
import { BaseCommand } from '../../interfaces';
import Logger from '../../features/Logger';
import { ModerationAction, ModerationUtility } from '../../utils/ModerationUtility';

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kick a user from the server (they can rejoin)")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("The user to kick from the server")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("The reason for kicking this user")
                .setRequired(false)
        ),
    config: {
        category: "moderation",
        usage: "/kick <user> [reason]",
        examples: [
            "/kick @user Inappropriate behavior",
            "/kick @user Violating channel rules",
            "/kick @user"
        ],
        permissions: ["KickMembers"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild || !(interaction.member instanceof GuildMember)) return;

        try {
            const options = interaction.options;
            const targetUser = options.getUser("user", true);
            const reason = options.getString("reason") || "No reason provided";

            const validationError = await ModerationUtility.validateAction(interaction, targetUser, ModerationAction.Kick);
            if (validationError) {
                await interaction.reply({
                    content: validationError,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const targetMember = await interaction.guild.members.fetch(targetUser.id);

            await ModerationUtility.sendDm(targetUser, interaction.guild, reason, ModerationAction.Kick, interaction.user);

            await targetMember.kick(`${reason} | Kicked by ${interaction.user.tag}`);

            const embed = new EmbedBuilder()
                .setTitle("User Kicked")
                .setDescription(`**${targetUser.tag}** has been kicked from the server`)
                .addFields([
                    { name: "User", value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: "Moderator", value: interaction.user.tag, inline: true },
                    { name: "Reason", value: reason, inline: false }
                ])
                .setColor("Orange")
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            Logger.info(`${interaction.user.tag} kicked ${targetUser.tag} in ${interaction.guild.name}`);
        } catch (error) {
            Logger.error(`Error in kick command: ${error}`);
            await interaction.reply({
                content: "An error occurred while trying to kick the user.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
