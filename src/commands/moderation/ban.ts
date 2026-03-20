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
        .setName("ban")
        .setDescription("Ban a user from the server and optionally delete their recent messages")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("The user to ban from the server")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("The reason for banning this user")
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option
                .setName("delete-messages")
                .setDescription("Delete messages from the last X days (0-7 days)")
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)
        ),
    config: {
        category: "moderation",
        usage: "/ban <user> [reason] [delete-messages]",
        examples: [
            "/ban @user Spamming",
            "/ban @user Breaking server rules",
            "/ban @user Harassment 7"
        ],
        permissions: ["BanMembers"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild || !(interaction.member instanceof GuildMember)) return;

        try {
            const options = interaction.options;
            const targetUser = options.getUser("user", true);
            const reason = options.getString("reason") || "No reason provided";
            const deleteMessages = options.getInteger("delete-messages") || 0;

            const validationError = await ModerationUtility.validateAction(interaction, targetUser, ModerationAction.Ban);
            if (validationError) {
                await interaction.reply({
                    content: validationError,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            await ModerationUtility.sendDm(targetUser, interaction.guild, reason, ModerationAction.Ban, interaction.user);

            await interaction.guild.members.ban(targetUser, {
                reason: `${reason} | Banned by ${interaction.user.tag}`,
                deleteMessageSeconds: deleteMessages * 24 * 60 * 60
            });

            const embed = new EmbedBuilder()
                .setTitle("User Banned")
                .setDescription(`**${targetUser.tag}** has been banned from the server`)
                .addFields([
                    { name: "User", value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: "Moderator", value: interaction.user.tag, inline: true },
                    { name: "Reason", value: reason, inline: false }
                ])
                .setColor("Red")
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            if (deleteMessages > 0) {
                embed.addFields([
                    { name: "Messages Deleted", value: `${deleteMessages} day(s)`, inline: true }
                ]);
            }

            await interaction.reply({ embeds: [embed] });

            Logger.info(`${interaction.user.tag} banned ${targetUser.tag} in ${interaction.guild.name}`);
        } catch (error) {
            Logger.error(`Error in ban command: ${error}`);
            await interaction.reply({
                content: "An error occurred while trying to ban the user.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
