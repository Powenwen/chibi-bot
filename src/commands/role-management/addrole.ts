import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    Role
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import Logger from "../../features/Logger";

export default <BaseCommand>({
    data: new SlashCommandBuilder()
        .setName("addrole")
        .setDescription("Add a role to a user")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to add the role to")
                .setRequired(true))
        .addRoleOption(option =>
            option.setName("role")
                .setDescription("The role to add")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for adding the role")
                .setRequired(false)),
    config: {
        category: "role-management",
        usage: "<user> <role> [reason]",
        examples: ["/addrole @user @Member Welcome to the server", "/addrole @user @Verified Verified account"],
        permissions: ["ManageRoles"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const options = interaction.options;
        const user = options.getUser("user", true);
        const role = options.getRole("role", true) as Role;
        const reason = options.getString("reason") || "No reason provided";

        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ This command can only be used in a server.",
                ephemeral: true
            });
        }

        // Security checks
        if (user.bot && user.id !== interaction.client.user.id) {
            return interaction.reply({
                content: "❌ You cannot manage roles for other bots.",
                ephemeral: true
            });
        }

        // Check if role is manageable
        if (!role.editable) {
            return interaction.reply({
                content: "❌ I cannot manage this role. It may be higher than my highest role or it's a managed role.",
                ephemeral: true
            });
        }

        // Check if role is higher than user's highest role (if not admin)
        const memberExecutor = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (memberExecutor && !memberExecutor.permissions.has(PermissionFlagsBits.Administrator)) {
            const memberHighestRole = memberExecutor.roles.highest;
            if (role.position >= memberHighestRole.position) {
                return interaction.reply({
                    content: "❌ You cannot assign a role that is higher than or equal to your highest role.",
                    ephemeral: true
                });
            }
        }

        // Get target member
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return interaction.reply({
                content: "❌ User not found in this server.",
                ephemeral: true
            });
        }

        // Check if user already has the role
        if (member.roles.cache.has(role.id)) {
            return interaction.reply({
                content: `❌ ${user.tag} already has the ${role.name} role.`,
                ephemeral: true
            });
        }

        try {
            await member.roles.add(role, `Added by ${interaction.user.tag}: ${reason}`);

            const embed = new EmbedBuilder()
                .setColor("#00FF00")
                .setTitle("✅ Role Added")
                .addFields(
                    { name: "👤 User", value: `${user.tag} (${user.id})`, inline: true },
                    { name: "🏷️ Role", value: `${role.name} (${role.id})`, inline: true },
                    { name: "🛡️ Added by", value: interaction.user.tag, inline: true },
                    { name: "📝 Reason", value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Log the action
            Logger.info(`Role ${role.name} added to user ${user.tag} by ${interaction.user.tag} in guild ${interaction.guild.name}`);

            // Try to DM the user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor("#00FF00")
                    .setTitle("🏷️ Role Added")
                    .setDescription(`You have been given the **${role.name}** role in **${interaction.guild.name}**`)
                    .addFields(
                        { name: "📝 Reason", value: reason, inline: false }
                    )
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                Logger.warn(`Failed to send role addition DM to user ${user.id}: ${error}`);
            }

        } catch (error) {
            Logger.error(`Error adding role to user ${user.id}: ${error}`);
            return interaction.reply({
                content: "❌ Failed to add role. Please check my permissions and try again.",
                ephemeral: true
            });
        }
    }
});