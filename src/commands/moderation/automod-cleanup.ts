import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import AutoModerationManager from "../../features/AutoModerationManager";
import AutoModerationLogger from "../../features/AutoModerationLogger";
import AntiSpam from "../../features/AntiSpam";
import DuplicateFilter from "../../features/DuplicateFilter";
import RaidProtection from "../../features/RaidProtection";

const command: BaseCommand = {
    data: new SlashCommandBuilder()
        .setName("automod-cleanup")
        .setDescription("Clean up auto-moderation cache and reset statistics")
        .addStringOption(option =>
            option.setName("action")
                .setDescription("Cleanup action to perform")
                .setRequired(true)
                .addChoices(
                    { name: "Cache Cleanup", value: "cache" },
                    { name: "Reset Statistics", value: "stats" },
                    { name: "Full Cleanup", value: "full" },
                    { name: "End Raid Protection", value: "raid" }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    config: {
        category: "moderation",
        usage: "<action>",
        examples: [
            "/automod-cleanup action:cache",
            "/automod-cleanup action:stats",
            "/automod-cleanup action:full"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild || !interaction.isChatInputCommand()) {
            return interaction.reply({
                content: "This command can only be used in a server.",
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const action = interaction.options.getString("action", true);
            const guildId = interaction.guild.id;

            const embed = new EmbedBuilder()
                .setTitle('🧹 Auto-Moderation Cleanup')
                .setColor('#3498DB')
                .setTimestamp();

            let description = [];

            switch (action) {
                case "cache":
                    // Clean up various caches
                    await Promise.all([
                        AntiSpam.cleanupTrackers(),
                        DuplicateFilter.cleanupHistory(),
                        RaidProtection.cleanupHistory()
                    ]);
                    
                    description.push('✅ Cleaned up spam trackers');
                    description.push('✅ Cleaned up duplicate message history');
                    description.push('✅ Cleaned up raid protection trackers');
                    break;

                case "stats":
                    // Reset statistics
                    await AutoModerationManager.resetStatistics(guildId);
                    
                    description.push('✅ Reset auto-moderation statistics');
                    description.push('⚠️ Historical data has been cleared');
                    break;

                case "raid":
                    // End raid protection if active
                    const wasActive = await RaidProtection.isUnderRaidProtection(interaction.guild);
                    if (wasActive) {
                        const success = await RaidProtection.endRaidProtection(interaction.guild);
                        if (success) {
                            description.push('✅ Ended active raid protection');
                            description.push('✅ Restored server permissions');
                        } else {
                            description.push('❌ Failed to end raid protection');
                        }
                    } else {
                        description.push('ℹ️ Raid protection is not currently active');
                    }
                    break;

                case "full":
                    // Full cleanup
                    await Promise.all([
                        AntiSpam.cleanupTrackers(),
                        DuplicateFilter.cleanupHistory(),
                        RaidProtection.cleanupHistory(),
                        AutoModerationManager.resetStatistics(guildId),
                        AutoModerationLogger.flushAllBuffers()
                    ]);

                    // End raid protection if active
                    const raidActive = await RaidProtection.isUnderRaidProtection(interaction.guild);
                    if (raidActive) {
                        await RaidProtection.endRaidProtection(interaction.guild);
                        description.push('✅ Ended active raid protection');
                    }

                    description.push('✅ Cleaned up all caches and trackers');
                    description.push('✅ Reset all statistics');
                    description.push('✅ Flushed log buffers');
                    description.push('⚠️ All auto-moderation data has been reset');
                    break;

                default:
                    description.push('❌ Invalid action specified');
            }

            embed.setDescription(description.join('\n'));

            // Add performance info
            const stats = await AutoModerationManager.getStatistics(guildId);
            if (stats && action !== "stats" && action !== "full") {
                embed.addFields({
                    name: '📊 Current Statistics',
                    value: [
                        `**Total Checks:** ${stats.totalChecks.toLocaleString()}`,
                        `**Actions Taken:** ${stats.triggeredActions.toLocaleString()}`,
                        `**Avg Response Time:** ${Math.round(stats.avgResponseTime)}ms`
                    ].join('\n'),
                    inline: true
                });
            }

            embed.setFooter({ 
                text: `Cleanup performed by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Error in automod-cleanup command:", error);
            await interaction.editReply({
                content: "An error occurred while performing the cleanup operation."
            });
        }
    }
};

export default command;