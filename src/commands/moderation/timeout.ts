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
        .setName("timeout")
        .setDescription("Timeout a user for a specified duration")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("The user to timeout")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("duration")
                .setDescription("Duration in minutes (1-40320 = 28 days)")
                .setMinValue(1)
                .setMaxValue(40320)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("The reason for the timeout")
                .setRequired(false)
        ),
    config: {
        category: "moderation",
        usage: "/timeout <user> <duration> [reason]",
        examples: [
            "/timeout @user 60 Spamming",
            "/timeout @user 1440 Inappropriate behavior"
        ],
        permissions: ["ModerateMembers"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild || !(interaction.member instanceof GuildMember)) return;

        try {
            const options = interaction.options;
            const targetUser = options.getUser("user", true);
            const duration = options.getInteger("duration", true);
            const reason = options.getString("reason") || "No reason provided";

            const validationError = await ModerationUtility.validateAction(interaction, targetUser, ModerationAction.Timeout);
            if (validationError) {
                await interaction.reply({
                    content: validationError,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            const timeoutDuration = duration * 60 * 1000;
            const timeoutUntil = new Date(Date.now() + timeoutDuration);

            await ModerationUtility.sendDm(targetUser, interaction.guild, reason, ModerationAction.Timeout, interaction.user);

            await targetMember.timeout(timeoutDuration, `${reason} | Timed out by ${interaction.user.tag}`);

            const embed = new EmbedBuilder()
                .setTitle("User Timed Out")
                .setDescription(`**${targetUser.tag}** has been timed out`)
                .addFields([
                    { name: "User", value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: "Moderator", value: interaction.user.tag, inline: true },
                    { name: "Duration", value: `${duration} minutes`, inline: true },
                    { name: "Until", value: `<t:${Math.floor(timeoutUntil.getTime() / 1000)}:f>`, inline: true },
                    { name: "Reason", value: reason, inline: false }
                ])
                .setColor("Yellow")
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            Logger.info(`${interaction.user.tag} timed out ${targetUser.tag} for ${duration} minutes in ${interaction.guild.name}`);
        } catch (error) {
            Logger.error(`Error in timeout command: ${error}`);
            await interaction.reply({
                content: "An error occurred while trying to timeout the user.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
