import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags
} from 'discord.js';
import { BaseCommand } from '../../interfaces';
import ModerationSystem from '../../features/ModerationSystem';
import Logger from '../../features/Logger';
import { IAutoModeration } from '../../models/AutoModerationModel';

export default <BaseCommand> {
    data: new SlashCommandBuilder()
        .setName("automod-config")
        .setDescription("Configure automatic moderation settings")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addStringOption(option =>
            option
                .setName("feature")
                .setDescription("The auto-moderation feature to configure")
                .setRequired(true)
                .addChoices(
                    { name: "Anti-Spam", value: "antispam" },
                    { name: "Word Filter", value: "wordfilter" },
                    { name: "Link Filter", value: "linkfilter" },
                    { name: "Duplicate Filter", value: "duplicatefilter" },
                    { name: "Raid Protection", value: "raidprotection" },
                    { name: "View Settings", value: "view" }
                )
        )
        .addBooleanOption(option =>
            option
                .setName("enabled")
                .setDescription("Enable or disable this feature")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("action")
                .setDescription("Action to take when triggered")
                .setRequired(false)
                .addChoices(
                    { name: "Delete", value: "delete" },
                    { name: "Warn", value: "warn" },
                    { name: "Mute", value: "mute" },
                    { name: "Kick", value: "kick" },
                    { name: "Ban", value: "ban" }
                )
        )
        .addIntegerOption(option =>
            option
                .setName("threshold")
                .setDescription("Threshold for triggering (number)")
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addIntegerOption(option =>
            option
                .setName("time_window")
                .setDescription("Time window in seconds")
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(3600)
        ),
    config: {
        category: "moderation",
        usage: "/automod-config <feature> [enabled] [action] [threshold] [time_window]",
        examples: [
            "/automod-config feature:antispam enabled:true",
            "/automod-config feature:view",
            "/automod-config feature:wordfilter action:delete enabled:true"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: "This command can only be used in a server.",
                flags: MessageFlags.Ephemeral
            });
        }

        const options = interaction.options;
        const feature = options.getString("feature", true);
        const enabled = options.getBoolean("enabled");
        const action = options.getString("action");
        const threshold = options.getInteger("threshold");
        const timeWindow = options.getInteger("time_window");

        try {
            if (feature === "view") {
                await showSettings(interaction);
                return;
            }

            let settings = await ModerationSystem.getAutoModSettings(interaction.guild.id);
            if (!settings) {
                // Create default settings
                settings = await ModerationSystem.updateAutoModSettings(interaction.guild.id, {
                    guildID: interaction.guild.id,
                    enabled: true
                });
            }

            // Update settings based on feature
            switch (feature) {
                case "antispam":
                    if (enabled !== null) (settings as IAutoModeration).antiSpam.enabled = enabled;
                    if (threshold) (settings as IAutoModeration).antiSpam.maxMessages = threshold;
                    if (timeWindow) (settings as IAutoModeration).antiSpam.timeWindow = timeWindow;
                    break;

                case "wordfilter":
                    if (enabled !== null) (settings as IAutoModeration).wordFilter.enabled = enabled;
                    if (action && ["delete", "warn", "mute", "kick"].includes(action)) {
                        (settings as IAutoModeration).wordFilter.action = action as "delete" | "warn" | "mute" | "kick";
                    }
                    break;

                case "linkfilter":
                    if (enabled !== null) (settings as IAutoModeration).linkFilter.enabled = enabled;
                    if (action && ["delete", "warn", "mute"].includes(action)) {
                        (settings as IAutoModeration).linkFilter.action = action as "delete" | "warn" | "mute";
                    }
                    break;

                case "duplicatefilter":
                    if (enabled !== null) (settings as IAutoModeration).duplicateFilter.enabled = enabled;
                    if (action && ["delete", "warn", "mute"].includes(action)) {
                        (settings as IAutoModeration).duplicateFilter.action = action as "delete" | "warn" | "mute";
                    }
                    if (threshold) (settings as IAutoModeration).duplicateFilter.maxDuplicates = threshold;
                    if (timeWindow) (settings as IAutoModeration).duplicateFilter.timeWindow = timeWindow;
                    break;

                case "raidprotection":
                    if (enabled !== null) (settings as IAutoModeration).raidProtection.enabled = enabled;
                    if (action && ["kick", "ban"].includes(action)) {
                        (settings as IAutoModeration).raidProtection.action = action as "kick" | "ban";
                    }
                    if (threshold) (settings as IAutoModeration).raidProtection.joinThreshold = threshold;
                    if (timeWindow) (settings as IAutoModeration).raidProtection.timeWindow = timeWindow;
                    break;
            }

            await (settings as IAutoModeration).save();

            const embed = new EmbedBuilder()
                .setColor("#4ECDC4")
                .setTitle("✅ Auto-Moderation Settings Updated")
                .setDescription(`Configuration for **${feature}** has been updated.`)
                .setTimestamp();

            // Add current settings for the feature
            const featureSettings = getFeatureSettings(settings, feature);
            if (featureSettings) {
                embed.addFields({ name: "Current Settings", value: featureSettings, inline: false });
            }

            await interaction.reply({ embeds: [embed] });

            Logger.info(`${interaction.user.tag} updated automod settings for ${feature} in ${interaction.guild.name}`);

        } catch (error) {
            Logger.error(`Failed to update automod settings: ${error}`);
            await interaction.reply({
                content: "An error occurred while updating the settings. Please try again.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
};

async function showSettings(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    try {
        const settings = await ModerationSystem.getAutoModSettings(interaction.guild.id);
        
        if (!settings) {
            return interaction.reply({
                content: "No auto-moderation settings found. Use the command with specific options to configure features.",
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = new EmbedBuilder()
            .setColor("#4F46E5")
            .setTitle("🛡️ Auto-Moderation Settings")
            .setDescription(`Global Auto-Mod: ${settings.enabled ? "✅ Enabled" : "❌ Disabled"}`)
            .addFields(
                {
                    name: "🚫 Anti-Spam",
                    value: `Enabled: ${settings.antiSpam.enabled ? "✅" : "❌"}\nMax Messages: ${settings.antiSpam.maxMessages}\nTime Window: ${settings.antiSpam.timeWindow}s\nMute Time: ${settings.antiSpam.muteTime}m`,
                    inline: true
                },
                {
                    name: "🤬 Word Filter",
                    value: `Enabled: ${settings.wordFilter.enabled ? "✅" : "❌"}\nAction: ${settings.wordFilter.action}\nFiltered Words: ${settings.wordFilter.words.length}`,
                    inline: true
                },
                {
                    name: "🔗 Link Filter",
                    value: `Enabled: ${settings.linkFilter.enabled ? "✅" : "❌"}\nAction: ${settings.linkFilter.action}\nAllowed Domains: ${settings.linkFilter.allowedDomains.length}`,
                    inline: true
                },
                {
                    name: "📝 Duplicate Filter",
                    value: `Enabled: ${settings.duplicateFilter.enabled ? "✅" : "❌"}\nMax Duplicates: ${settings.duplicateFilter.maxDuplicates}\nTime Window: ${settings.duplicateFilter.timeWindow}s\nAction: ${settings.duplicateFilter.action}`,
                    inline: true
                },
                {
                    name: "🛡️ Raid Protection",
                    value: `Enabled: ${settings.raidProtection.enabled ? "✅" : "❌"}\nJoin Threshold: ${settings.raidProtection.joinThreshold} joins\nTime Window: ${settings.raidProtection.timeWindow}s\nAction: ${settings.raidProtection.action}`,
                    inline: true
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        Logger.error(`Failed to show automod settings: ${error}`);
        await interaction.reply({
            content: "An error occurred while fetching the settings.",
            flags: MessageFlags.Ephemeral
        });
    }
}

function getFeatureSettings(settings: any, feature: string): string | null {
    switch (feature) {
        case "antispam":
            return `Enabled: ${settings.antiSpam.enabled ? "✅" : "❌"}\nMax Messages: ${settings.antiSpam.maxMessages}\nTime Window: ${settings.antiSpam.timeWindow}s\nMute Time: ${settings.antiSpam.muteTime}m`;
        
        case "wordfilter":
            return `Enabled: ${settings.wordFilter.enabled ? "✅" : "❌"}\nAction: ${settings.wordFilter.action}\nFiltered Words: ${settings.wordFilter.words.length}`;
        
        case "linkfilter":
            return `Enabled: ${settings.linkFilter.enabled ? "✅" : "❌"}\nAction: ${settings.linkFilter.action}\nAllowed Domains: ${settings.linkFilter.allowedDomains.length}`;
        
        case "duplicatefilter":
            return `Enabled: ${settings.duplicateFilter.enabled ? "✅" : "❌"}\nMax Duplicates: ${settings.duplicateFilter.maxDuplicates}\nTime Window: ${settings.duplicateFilter.timeWindow}s\nAction: ${settings.duplicateFilter.action}`;
        
        case "raidprotection":
            return `Enabled: ${settings.raidProtection.enabled ? "✅" : "❌"}\nJoin Threshold: ${settings.raidProtection.joinThreshold} joins\nTime Window: ${settings.raidProtection.timeWindow}s\nAction: ${settings.raidProtection.action}`;
        
        default:
            return null;
    }
}
