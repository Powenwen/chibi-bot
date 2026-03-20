import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import ModerationSystem from "../../features/ModerationSystem";
import { EscalationRule } from "../../models/WarningEscalationModel";
import Logger from "../../features/Logger";
import Utility from "../../structures/Utility";

// Forward declaration of command handlers
const commandHandlers = {
    handleView: async function(_interaction: ChatInputCommandInteraction): Promise<any> { return null; },
    handleAdd: async function(_interaction: ChatInputCommandInteraction): Promise<any> { return null; },
    handleRemove: async function(_interaction: ChatInputCommandInteraction): Promise<any> { return null; },
    handleToggle: async function(_interaction: ChatInputCommandInteraction): Promise<any> { return null; },
    handleClear: async function(_interaction: ChatInputCommandInteraction): Promise<any> { return null; }
};

export default <BaseCommand>({
    data: new SlashCommandBuilder()
        .setName("warning-escalation")
        .setDescription("Manage automatic warning escalation rules")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addSubcommand(subcommand =>
            subcommand
                .setName("view")
                .setDescription("View current escalation rules"))
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Add a new escalation rule")
                .addIntegerOption(option =>
                    option.setName("warnings")
                        .setDescription("Number of warnings to trigger this rule")
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100))
                .addStringOption(option =>
                    option.setName("action")
                        .setDescription("Action to take")
                        .setRequired(true)
                        .addChoices(
                            { name: "Timeout", value: "timeout" },
                            { name: "Mute", value: "mute" },
                            { name: "Kick", value: "kick" },
                            { name: "Ban", value: "ban" }
                        ))
                .addStringOption(option =>
                    option.setName("duration")
                        .setDescription("Duration for timeout/mute (e.g., 1h, 2d, 30m)")
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("Reason for the action")
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName("delete-messages")
                        .setDescription("Days of messages to delete (ban only, 0-7)")
                        .setRequired(false)
                        .setMinValue(0)
                        .setMaxValue(7)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove an escalation rule")
                .addIntegerOption(option =>
                    option.setName("warnings")
                        .setDescription("Number of warnings of the rule to remove")
                        .setRequired(true)
                        .setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("toggle")
                .setDescription("Enable or disable warning escalation")
                .addBooleanOption(option =>
                    option.setName("enabled")
                        .setDescription("Whether to enable escalation")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("clear")
                .setDescription("Clear all escalation rules")),
    config: {
        category: "moderation",
        usage: "<subcommand> [options]",
        examples: [
            "/warning-escalation view",
            "/warning-escalation add warnings:3 action:timeout duration:1h",
            "/warning-escalation add warnings:5 action:kick",
            "/warning-escalation toggle enabled:true"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ This command can only be used in a server.",
                ephemeral: true
            });
        }

        const options = interaction.options;
        const subcommand = options.getSubcommand();

        try {
            switch (subcommand) {
                case "view":
                    await commandHandlers.handleView(interaction);
                    break;
                case "add":
                    await commandHandlers.handleAdd(interaction);
                    break;
                case "remove":
                    await commandHandlers.handleRemove(interaction);
                    break;
                case "toggle":
                    await commandHandlers.handleToggle(interaction);
                    break;
                case "clear":
                    await commandHandlers.handleClear(interaction);
                    break;
            }
        } catch (error) {
            Logger.error(`Error in warning escalation command: ${error}`);
            return interaction.reply({
                content: "❌ An error occurred while processing your request.",
                ephemeral: true
            });
        }
    }
});

// Implement command handlers
commandHandlers.handleView = async function(interaction: ChatInputCommandInteraction) {
        const escalation = await ModerationSystem.getWarningEscalation(interaction.guild!.id);

        if (!escalation || escalation.escalationRules.length === 0) {
            return interaction.reply({
                content: "❌ No escalation rules are configured for this server.",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("⚠️ Warning Escalation Rules")
            .setDescription(`Escalation is currently **${escalation.enabled ? "enabled" : "disabled"}**`)
            .setColor(escalation.enabled ? "#FFA500" : "#808080")
            .setTimestamp();

        for (const rule of escalation.escalationRules.sort((a, b) => a.warningCount - b.warningCount)) {
            let value = `**Action:** ${rule.action.toUpperCase()}\n**Reason:** ${rule.reason}`;
            
            if (rule.duration) {
                value += `\n**Duration:** ${Utility.formatDuration(rule.duration)}`;
            }
            
            if (rule.deleteMessages !== undefined) {
                value += `\n**Delete Messages:** ${rule.deleteMessages} days`;
            }

            embed.addFields({
                name: `${rule.warningCount} Warning${rule.warningCount > 1 ? "s" : ""}`,
                value: value,
                inline: true
            });
        }

        await interaction.reply({ embeds: [embed] });
};

commandHandlers.handleAdd = async function(interaction: ChatInputCommandInteraction) {
        const options = interaction.options;
        const warnings = options.getInteger("warnings", true);
        const action = options.getString("action", true) as "timeout" | "mute" | "kick" | "ban";
        const durationStr = options.getString("duration");
        const reason = options.getString("reason") || `Automatic ${action} after ${warnings} warnings`;
        const deleteMessages = options.getInteger("delete-messages");

        // Parse duration if provided
        let duration: number | undefined;
        if (durationStr && (action === "timeout" || action === "mute")) {
            const parsedDuration = Utility.parseDuration(durationStr);
            if (!parsedDuration) {
                return interaction.reply({
                    content: "❌ Invalid duration format. Use formats like: 1h, 30m, 2d, 1w",
                    ephemeral: true
                });
            }
            duration = parsedDuration;
        }

        // Get current escalation settings
        const currentEscalation = await ModerationSystem.getWarningEscalation(interaction.guild!.id);
        const currentRules = currentEscalation?.escalationRules || [];

        // Check if rule already exists
        if (currentRules.some(rule => rule.warningCount === warnings)) {
            return interaction.reply({
                content: `❌ A rule for ${warnings} warnings already exists. Remove it first if you want to replace it.`,
                ephemeral: true
            });
        }

        // Create new rule
        const newRule: EscalationRule = {
            warningCount: warnings,
            action,
            reason,
            duration,
            deleteMessages: deleteMessages || undefined
        };

        // Add to existing rules
        const updatedRules = [...currentRules, newRule];

        // Update database
        await ModerationSystem.updateWarningEscalation(interaction.guild!.id, updatedRules, currentEscalation?.enabled ?? true);

        const embed = new EmbedBuilder()
            .setTitle("✅ Escalation Rule Added")
            .setColor("#00FF00")
            .addFields(
                { name: "Warnings", value: warnings.toString(), inline: true },
                { name: "Action", value: action.toUpperCase(), inline: true },
                { name: "Reason", value: reason, inline: false }
            )
            .setTimestamp();

        if (duration) {
            embed.addFields({ name: "Duration", value: Utility.formatDuration(duration), inline: true });
        }

        if (deleteMessages !== null) {
            embed.addFields({ name: "Delete Messages", value: `${deleteMessages} days`, inline: true });
        }

        await interaction.reply({ embeds: [embed] });
};

commandHandlers.handleRemove = async function(interaction: ChatInputCommandInteraction) {
        const options = interaction.options;
        const warnings = options.getInteger("warnings", true);

        const currentEscalation = await ModerationSystem.getWarningEscalation(interaction.guild!.id);
        if (!currentEscalation || currentEscalation.escalationRules.length === 0) {
            return interaction.reply({
                content: "❌ No escalation rules are configured for this server.",
                ephemeral: true
            });
        }

        const ruleIndex = currentEscalation.escalationRules.findIndex(rule => rule.warningCount === warnings);
        if (ruleIndex === -1) {
            return interaction.reply({
                content: `❌ No rule found for ${warnings} warnings.`,
                ephemeral: true
            });
        }

        const removedRule = currentEscalation.escalationRules[ruleIndex];
        const updatedRules = currentEscalation.escalationRules.filter(rule => rule.warningCount !== warnings);

        await ModerationSystem.updateWarningEscalation(interaction.guild!.id, updatedRules, currentEscalation.enabled);

        const embed = new EmbedBuilder()
            .setTitle("✅ Escalation Rule Removed")
            .setColor("#FF6B6B")
            .addFields(
                { name: "Warnings", value: warnings.toString(), inline: true },
                { name: "Action", value: removedRule.action.toUpperCase(), inline: true },
                { name: "Reason", value: removedRule.reason, inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
};

commandHandlers.handleToggle = async function(interaction: ChatInputCommandInteraction) {
        const options = interaction.options;
        const enabled = options.getBoolean("enabled", true);

        const currentEscalation = await ModerationSystem.getWarningEscalation(interaction.guild!.id);
        const currentRules = currentEscalation?.escalationRules || [];

        await ModerationSystem.updateWarningEscalation(interaction.guild!.id, currentRules, enabled);

        const embed = new EmbedBuilder()
            .setTitle("✅ Escalation Settings Updated")
            .setColor(enabled ? "#00FF00" : "#FF6B6B")
            .addFields(
                { name: "Status", value: enabled ? "Enabled" : "Disabled", inline: true },
                { name: "Rules Count", value: currentRules.length.toString(), inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
};

commandHandlers.handleClear = async function(interaction: ChatInputCommandInteraction) {
        await ModerationSystem.updateWarningEscalation(interaction.guild!.id, [], false);

        const embed = new EmbedBuilder()
            .setTitle("✅ All Escalation Rules Cleared")
            .setColor("#FF6B6B")
            .setDescription("All warning escalation rules have been removed and escalation has been disabled.")
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
};