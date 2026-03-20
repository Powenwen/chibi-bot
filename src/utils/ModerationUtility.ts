import { CommandInteraction, GuildMember, User, Guild, EmbedBuilder } from 'discord.js';

/**
 * Enum for different types of moderation actions.
 * The values are past-tense verbs used in logging and user messages.
 */
export enum ModerationAction {
    Ban = 'banned',
    Kick = 'kicked',
    Mute = 'muted',
    Timeout = 'timed out',
    Unmute = 'unmuted',
    Warn = 'warned',
}

/**
 * A utility class containing static methods to support moderation commands.
 * This includes validation checks and sending standardized direct messages.
 */
export class ModerationUtility {
    /**
     * Validates if a moderation action can be performed by a moderator on a target user.
     * Checks for self-moderation, bot moderation, role hierarchy, and bot permissions.
     * @param interaction The command interaction initiated by the moderator.
     * @param target The user to perform the action on.
     * @param action The moderation action being performed.
     * @returns A string containing an error message if validation fails, otherwise `null`.
     */
    public static async validateAction(interaction: CommandInteraction, target: User, action: ModerationAction): Promise<string | null> {
        if (!interaction.guild || !(interaction.member instanceof GuildMember)) {
            return "This command can only be used in a server.";
        }

        if (target.id === interaction.user.id) {
            return `You cannot ${action} yourself!`;
        }

        if (target.id === interaction.client.user.id) {
            return `I cannot ${action} myself!`;
        }

        const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (targetMember) {
            // Check if the moderator's highest role is lower than the target's.
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return `You cannot ${action} a user with an equal or higher role!`;
            }

            // Check if the bot has the necessary permissions to perform the action.
            switch (action) {
                case ModerationAction.Ban:
                    if (!targetMember.bannable) return "I cannot ban this user. They may have higher permissions than me.";
                    break;
                case ModerationAction.Kick:
                    if (!targetMember.kickable) return "I cannot kick this user. They may have higher permissions than me.";
                    break;
                case ModerationAction.Timeout:
                    if (!targetMember.moderatable) return "I cannot time out this user. They may have higher permissions than me.";
                    break;
            }
        }

        // Action-specific checks
        if (action === ModerationAction.Ban) {
            const banList = await interaction.guild.bans.fetch().catch(() => null);
            if (banList?.has(target.id)) {
                return "This user is already banned!";
            }
        } else if (action === ModerationAction.Timeout) {
            if (targetMember?.isCommunicationDisabled()) {
                return "This user is already timed out!";
            }
        }

        return null; // Validation passed
    }

    /**
     * Sends a standardized direct message to a user about a moderation action taken against them.
     * Fails silently if the user has DMs disabled.
     * @param target The user who is being moderated.
     * @param guild The guild where the action took place.
     * @param reason The reason for the action.
     * @param action The moderation action.
     * @param moderator The moderator who performed the action.
     */
    public static async sendDm(target: User, guild: Guild, reason: string, action: ModerationAction, moderator: User): Promise<void> {
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle(`You have been ${action}`)
                .setDescription(`You have been ${action} from **${guild.name}**`)
                .addFields([
                    { name: "Reason", value: reason },
                    { name: "Moderator", value: moderator.tag }
                ])
                .setColor("Red")
                .setTimestamp();

            await target.send({ embeds: [dmEmbed] });
        } catch {
            // User likely has DMs disabled or has blocked the bot.
            // This is not a critical error, so we can ignore it.
        }
    }
}
