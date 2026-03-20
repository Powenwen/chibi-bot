import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    Role,
    ColorResolvable
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import Logger from "../../features/Logger";
import Utility from "../../structures/Utility";

export default <BaseCommand>({
    data: new SlashCommandBuilder()
        .setName("roleinfo")
        .setDescription("Display detailed information about a role")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addRoleOption(option =>
            option.setName("role")
                .setDescription("The role to get information about")
                .setRequired(true)),
    config: {
        category: "role-management",
        usage: "<role>",
        examples: ["/roleinfo @Member", "/roleinfo @Moderator"],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const options = interaction.options;
        const role = options.getRole("role", true) as Role;

        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ This command can only be used in a server.",
                ephemeral: true
            });
        }

        try {
            // Get members with this role
            const membersWithRole = interaction.guild.members.cache.filter(member => 
                member.roles.cache.has(role.id)
            );

            // Role permissions array
            const permissions = role.permissions.toArray();
            const permissionList = permissions.length > 0 
                ? permissions.map(perm => `\`${perm}\``).join(", ")
                : "No special permissions";

            // Format creation date
            const createdTimestamp = Utility.formatTimestamp(role.createdAt);

            // Determine if role is mentionable, hoisted, managed
            const flags = [];
            if (role.mentionable) flags.push("Mentionable");
            if (role.hoist) flags.push("Hoisted");
            if (role.managed) flags.push("Managed");
            if (role.tags?.botId) flags.push("Bot Role");
            if (role.tags?.integrationId) flags.push("Integration Role");
            if (role.tags?.premiumSubscriberRole) flags.push("Boost Role");

            const embed = new EmbedBuilder()
                .setTitle(`📋 Role Information: ${role.name}`)
                .setColor(role.color as ColorResolvable || "#99AAB5")
                .addFields(
                    { 
                        name: "🏷️ Basic Info", 
                        value: [
                            `**Name:** ${role.name}`,
                            `**ID:** ${role.id}`,
                            `**Mention:** ${role.toString()}`,
                            `**Position:** ${role.position}`,
                            `**Color:** ${role.hexColor}`
                        ].join("\n"), 
                        inline: false 
                    },
                    { 
                        name: "👥 Members", 
                        value: `${membersWithRole.size} member${membersWithRole.size !== 1 ? "s" : ""}`, 
                        inline: true 
                    },
                    { 
                        name: "📅 Created", 
                        value: createdTimestamp, 
                        inline: true 
                    },
                    { 
                        name: "⚙️ Properties", 
                        value: flags.length > 0 ? flags.join(", ") : "No special properties", 
                        inline: true 
                    }
                )
                .setTimestamp();

            // Add permissions field if there are any
            if (permissions.length > 0 && permissions.length <= 25) {
                // Split permissions into chunks if too long
                const maxLength = 1024;
                if (permissionList.length <= maxLength) {
                    embed.addFields({
                        name: "🔐 Permissions",
                        value: permissionList,
                        inline: false
                    });
                } else {
                    // Split into multiple fields if too long
                    const chunks: string[] = [];
                    let currentChunk: string[] = [];
                    let currentLength = 0;

                    for (const perm of permissions) {
                        const permString = `\`${perm}\`, `;
                        if (currentLength + permString.length > maxLength) {
                            chunks.push(currentChunk.join(", "));
                            currentChunk = [perm];
                            currentLength = permString.length;
                        } else {
                            currentChunk.push(perm);
                            currentLength += permString.length;
                        }
                    }

                    if (currentChunk.length > 0) {
                        chunks.push(currentChunk.map(p => `\`${p}\``).join(", "));
                    }

                    chunks.forEach((chunk, index) => {
                        embed.addFields({
                            name: index === 0 ? "🔐 Permissions" : "🔐 Permissions (continued)",
                            value: chunk,
                            inline: false
                        });
                    });
                }
            }

            // Add role hierarchy information
            if (interaction.guild && role.comparePositionTo(interaction.guild.roles.everyone) > 0) {
                const higherRoles = interaction.guild.roles.cache
                    .filter(r => r.comparePositionTo(role) > 0 && r.id !== interaction.guild!.id)
                    .sort((a, b) => b.position - a.position)
                    .first(5);

                const lowerRoles = interaction.guild.roles.cache
                    .filter(r => r.comparePositionTo(role) < 0 && r.id !== interaction.guild!.id)
                    .sort((a, b) => b.position - a.position)
                    .first(5);

                if (higherRoles.length > 0) {
                    embed.addFields({
                        name: "⬆️ Higher Roles",
                        value: higherRoles.map(r => r.toString()).join(", ") + 
                               (interaction.guild.roles.cache.filter(r => r.comparePositionTo(role) > 0).size > 5 ? "..." : ""),
                        inline: true
                    });
                }

                if (lowerRoles.length > 0) {
                    embed.addFields({
                        name: "⬇️ Lower Roles",
                        value: lowerRoles.map(r => r.toString()).join(", ") + 
                               (interaction.guild.roles.cache.filter(r => r.comparePositionTo(role) < 0).size > 5 ? "..." : ""),
                        inline: true
                    });
                }
            }

            // Add sample of members with this role (if not too many)
            if (membersWithRole.size > 0 && membersWithRole.size <= 10) {
                const memberList = membersWithRole
                    .first(10)
                    .map(member => `${member.user.tag}`)
                    .join(", ");

                embed.addFields({
                    name: "👤 Members with this role",
                    value: memberList,
                    inline: false
                });
            } else if (membersWithRole.size > 10) {
                const sampleMembers = membersWithRole
                    .first(5)
                    .map(member => `${member.user.tag}`)
                    .join(", ");

                embed.addFields({
                    name: "👤 Sample members",
                    value: `${sampleMembers} and ${membersWithRole.size - 5} more...`,
                    inline: false
                });
            }

            await interaction.reply({ embeds: [embed] });

            // Log the action
            Logger.info(`Role info requested for ${role.name} by ${interaction.user.tag} in guild ${interaction.guild.name}`);

        } catch (error) {
            Logger.error(`Error getting role info for role ${role.id}: ${error}`);
            return interaction.reply({
                content: "❌ Failed to get role information. Please try again later.",
                ephemeral: true
            });
        }
    }
});