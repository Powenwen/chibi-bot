import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import AutoModerationManager from "../../features/AutoModerationManager";
import AutoModerationLogger from "../../features/AutoModerationLogger";

function formatFilterName(filter: string): string {
    const names: Record<string, string> = {
        antiSpam: 'Anti-Spam',
        wordFilter: 'Word Filter', 
        linkFilter: 'Link Filter',
        duplicateFilter: 'Duplicate Filter',
        capsFilter: 'Caps Filter'
    };
    return names[filter] || filter;
}

const command: BaseCommand = {
    data: new SlashCommandBuilder()
        .setName("automod-stats")
        .setDescription("View auto-moderation statistics and performance metrics")
        .addIntegerOption(option =>
            option.setName("days")
                .setDescription("Number of days to show statistics for (default: 7)")
                .setMinValue(1)
                .setMaxValue(30)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    config: {
        category: "moderation",
        usage: "[days]",
        examples: ["/automod-stats", "/automod-stats days:14"],
        permissions: ["ModerateMembers"]
    },

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild || !interaction.isChatInputCommand()) {
            return interaction.reply({
                content: "This command can only be used in a server.",
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            const options = interaction.options;
            const days = options.getInteger("days") || 7;

            // Get current metrics
            const currentMetrics = await AutoModerationManager.getStatistics(interaction.guild.id);
            
            // Get historical statistics
            const historicalStats = await AutoModerationLogger.getStatistics(interaction.guild.id, days);

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Auto-Moderation Statistics')
                .setColor('#3498DB')
                .setTimestamp();

            // Current session metrics
            if (currentMetrics) {
                embed.addFields({
                    name: '📊 Current Session',
                    value: [
                        `**Total Checks:** ${currentMetrics.totalChecks.toLocaleString()}`,
                        `**Actions Taken:** ${currentMetrics.triggeredActions.toLocaleString()}`,
                        `**Average Response Time:** ${Math.round(currentMetrics.avgResponseTime)}ms`,
                        `**Success Rate:** ${((currentMetrics.totalChecks - currentMetrics.triggeredActions) / currentMetrics.totalChecks * 100).toFixed(1)}%`
                    ].join('\n'),
                    inline: false
                });

                // Filter breakdown
                const filters = Object.entries(currentMetrics.filterBreakdown)
                    .filter(([_, count]) => count > 0)
                    .map(([filter, count]) => `**${formatFilterName(filter)}:** ${count}`)
                    .join('\n');

                if (filters) {
                    embed.addFields({
                        name: '🔍 Filter Breakdown (Current Session)',
                        value: filters,
                        inline: true
                    });
                }
            }

            // Historical statistics
            if (historicalStats.length > 0) {
                const totalActions = historicalStats.reduce((sum: number, day: any) => sum + day.totalActions, 0);
                const totalUsers = new Set(historicalStats.flatMap((day: any) => Array(day.uniqueUsers).fill(0).map((_, i) => i))).size;
                const avgResponseTime = historicalStats.reduce((sum: number, day: any) => sum + day.averageResponseTime, 0) / historicalStats.length;

                embed.addFields({
                    name: `📈 Last ${days} Days`,
                    value: [
                        `**Total Actions:** ${totalActions.toLocaleString()}`,
                        `**Unique Users Affected:** ${totalUsers.toLocaleString()}`,
                        `**Average Response Time:** ${Math.round(avgResponseTime)}ms`,
                        `**Daily Average:** ${Math.round(totalActions / days)} actions/day`
                    ].join('\n'),
                    inline: false
                });

                // Historical filter breakdown
                const historicalFilters = historicalStats.reduce((acc: Record<string, number>, day: any) => {
                    Object.entries(day.filterBreakdown).forEach(([filter, count]) => {
                        acc[filter] = (acc[filter] || 0) + (count as number);
                    });
                    return acc;
                }, {} as Record<string, number>);

                const historicalFilterText = Object.entries(historicalFilters)
                    .filter(([_, count]) => (count as number) > 0)
                    .sort(([_, a], [__, b]) => (b as number) - (a as number))
                    .map(([filter, count]) => `**${formatFilterName(filter)}:** ${count}`)
                    .join('\n');

                if (historicalFilterText) {
                    embed.addFields({
                        name: `🔍 Filter Breakdown (${days} Days)`,
                        value: historicalFilterText,
                        inline: true
                    });
                }

                // Daily trend (last 7 days)
                const recentDays = historicalStats.slice(-7);
                const trendText = recentDays.map((day: any) => {
                    const date = new Date(day.date);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    return `**${dayName}:** ${day.totalActions} actions`;
                }).join('\n');

                if (trendText) {
                    embed.addFields({
                        name: '📊 Daily Trend',
                        value: trendText,
                        inline: true
                    });
                }
            }

            // Performance indicators
            const performanceIndicators = [];
            if (currentMetrics?.avgResponseTime) {
                if (currentMetrics.avgResponseTime < 50) {
                    performanceIndicators.push('🟢 Excellent response time');
                } else if (currentMetrics.avgResponseTime < 100) {
                    performanceIndicators.push('🟡 Good response time');
                } else {
                    performanceIndicators.push('🔴 Slow response time - consider optimization');
                }
            }

            if (currentMetrics && currentMetrics.totalChecks > 1000) {
                const successRate = (currentMetrics.totalChecks - currentMetrics.triggeredActions) / currentMetrics.totalChecks * 100;
                if (successRate > 95) {
                    performanceIndicators.push('🟢 High efficiency - low false positives');
                } else if (successRate > 90) {
                    performanceIndicators.push('🟡 Good efficiency');
                } else {
                    performanceIndicators.push('🔴 Low efficiency - review filter settings');
                }
            }

            if (performanceIndicators.length > 0) {
                embed.addFields({
                    name: '⚡ Performance Indicators',
                    value: performanceIndicators.join('\n'),
                    inline: false
                });
            }

            embed.setFooter({ text: `Stats for ${interaction.guild.name} • Auto-refresh every 5 minutes` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Error in automod-stats command:", error);
            await interaction.editReply({
                content: "An error occurred while fetching auto-moderation statistics."
            });
        }
    }
};

export default command;