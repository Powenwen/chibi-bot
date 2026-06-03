import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import ModerationSystem from "../../features/ModerationSystem";
import { EscalationRule } from "../../models/WarningEscalationModel";
import Logger from "../../features/Logger";
import Utility from "../../structures/Utility";

const commandHandlers: Record<string, (i: ChatInputCommandInteraction) => Promise<any>> = {
    handleView: async () => null,
    handleAdd: async () => null,
    handleRemove: async () => null,
    handleToggle: async () => null,
    handleClear: async () => null,
    handleImport: async () => null,
    handleExport: async () => null,
    handlePreset: async () => null
};

export default <BaseCommand>({
    data: new SlashCommandBuilder()
        .setName("warning-escalation")
        .setDescription("Manage automatic warning escalation rules")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addSubcommand(sc => sc.setName("view").setDescription("View current escalation rules"))
        .addSubcommand(sc =>
            sc.setName("add")
                .setDescription("Add a new escalation rule")
                .addIntegerOption(o => o.setName("warnings").setDescription("Number of warnings to trigger this rule").setRequired(true).setMinValue(1).setMaxValue(100))
                .addStringOption(o => o.setName("action").setDescription("Action to take").setRequired(true)
                    .addChoices(
                        { name: "Timeout", value: "timeout" },
                        { name: "Mute", value: "mute" },
                        { name: "Kick", value: "kick" },
                        { name: "Ban", value: "ban" }
                    ))
                .addStringOption(o => o.setName("duration").setDescription("Duration for timeout/mute (e.g., 1h, 2d, 30m)").setRequired(false))
                .addStringOption(o => o.setName("reason").setDescription("Reason for the action").setRequired(false))
                .addIntegerOption(o => o.setName("delete-messages").setDescription("Days of messages to delete (ban only, 0-7)").setRequired(false).setMinValue(0).setMaxValue(7))
        )
        .addSubcommand(sc =>
            sc.setName("remove")
                .setDescription("Remove an escalation rule")
                .addIntegerOption(o => o.setName("warnings").setDescription("Number of warnings of the rule to remove").setRequired(true).setMinValue(1))
        )
        .addSubcommand(sc =>
            sc.setName("toggle")
                .setDescription("Enable or disable warning escalation")
                .addBooleanOption(o => o.setName("enabled").setDescription("Whether to enable escalation").setRequired(true))
        )
        .addSubcommand(sc => sc.setName("clear").setDescription("Clear all escalation rules"))
        .addSubcommand(sc =>
            sc.setName("preset")
                .setDescription("Apply a preset escalation configuration")
                .addStringOption(o => o.setName("preset").setDescription("Preset to apply").setRequired(true)
                    .addChoices(
                        { name: "Mild (3→timeout 1h, 5→kick)", value: "mild" },
                        { name: "Standard (3→timeout 6h, 5→kick, 7→ban)", value: "standard" },
                        { name: "Strict (2→timeout 1h, 3→mute 24h, 5→ban)", value: "strict" }
                    ))
        )
        .addSubcommand(sc => sc.setName("export").setDescription("Export current rules as JSON"))
        .addSubcommand(sc =>
            sc.setName("import")
                .setDescription("Import rules from JSON string")
                .addStringOption(o => o.setName("json").setDescription("JSON string of escalation rules").setRequired(true))
        ),
    config: {
        category: "warn-system",
        usage: "<subcommand> [options]",
        examples: [
            "/warning-escalation view",
            "/warning-escalation add warnings:3 action:timeout duration:1h",
            "/warning-escalation preset preset:standard",
            "/warning-escalation export",
            "/warning-escalation toggle enabled:true"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "❌ This command can only be used in a server.", flags: MessageFlags.Ephemeral });
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            const handler = commandHandlers[`handle${subcommand.charAt(0).toUpperCase() + subcommand.slice(1)}`];
            if (handler) {
                await handler(interaction);
            }
        } catch (error) {
            Logger.error(`Error in warning escalation command: ${error}`);
            return interaction.reply({ content: "❌ An error occurred while processing your request.", flags: MessageFlags.Ephemeral });
        }
    }
});

commandHandlers.handleView = async (interaction: ChatInputCommandInteraction) => {
    const escalation = await ModerationSystem.getWarningEscalation(interaction.guild!.id);

    if (!escalation || escalation.escalationRules.length === 0) {
        return interaction.reply({
            content: "❌ No escalation rules are configured for this server.",
            flags: MessageFlags.Ephemeral
        });
    }

    const embed = new EmbedBuilder()
        .setTitle("⚠️ Warning Escalation Rules")
        .setDescription(`Escalation is currently **${escalation.enabled ? "🟢 enabled" : "🔴 disabled"}**`)
        .setColor(escalation.enabled ? "#FFA500" : "#808080")
        .setTimestamp();

    for (const rule of escalation.escalationRules.sort((a, b) => a.warningCount - b.warningCount)) {
        const value = [
            `**Action:** ${rule.action.toUpperCase()}`,
            `**Reason:** ${rule.reason}`,
            ...(rule.duration ? [`**Duration:** ${Utility.formatDuration(rule.duration)}`] : []),
            ...(rule.deleteMessages !== undefined ? [`**Delete Messages:** ${rule.deleteMessages} days`] : [])
        ].join("\n");

        embed.addFields({ name: `${rule.warningCount} Warning${rule.warningCount > 1 ? "s" : ""}`, value, inline: true });
    }

    embed.setFooter({ text: "Use /warning-escalation preset to apply a preset configuration" });
    await interaction.reply({ embeds: [embed] });
};

commandHandlers.handleAdd = async (interaction: ChatInputCommandInteraction) => {
    const warnings = interaction.options.getInteger("warnings", true);
    const action = interaction.options.getString("action", true) as "timeout" | "mute" | "kick" | "ban";
    const durationStr = interaction.options.getString("duration");
    const reason = interaction.options.getString("reason") || `Automatic ${action} after ${warnings} warnings`;
    const deleteMessages = interaction.options.getInteger("delete-messages");

    let duration: number | undefined;
    if (durationStr && (action === "timeout" || action === "mute")) {
        const parsed = Utility.parseDuration(durationStr);
        if (!parsed) {
            return interaction.reply({ content: "❌ Invalid duration format. Use: 1h, 30m, 2d, 1w", flags: MessageFlags.Ephemeral });
        }
        duration = parsed;
    }

    const current = await ModerationSystem.getWarningEscalation(interaction.guild!.id);
    const currentRules = current?.escalationRules || [];

    if (currentRules.some(r => r.warningCount === warnings)) {
        return interaction.reply({ content: `❌ A rule for ${warnings} warnings already exists. Remove it first.`, flags: MessageFlags.Ephemeral });
    }

    const newRule: EscalationRule = { warningCount: warnings, action, reason, duration, deleteMessages: deleteMessages || undefined };
    await ModerationSystem.updateWarningEscalation(interaction.guild!.id, [...currentRules, newRule], current?.enabled ?? true);

    const embed = new EmbedBuilder()
        .setTitle("✅ Escalation Rule Added")
        .setColor("#00FF00")
        .addFields(
            { name: "Warnings", value: warnings.toString(), inline: true },
            { name: "Action", value: action.toUpperCase(), inline: true },
            { name: "Reason", value: reason, inline: false }
        )
        .setTimestamp();

    if (duration) embed.addFields({ name: "Duration", value: Utility.formatDuration(duration), inline: true });
    if (deleteMessages !== null) embed.addFields({ name: "Delete Messages", value: `${deleteMessages} days`, inline: true });

    await interaction.reply({ embeds: [embed] });
};

commandHandlers.handleRemove = async (interaction: ChatInputCommandInteraction) => {
    const warnings = interaction.options.getInteger("warnings", true);
    const current = await ModerationSystem.getWarningEscalation(interaction.guild!.id);

    if (!current || current.escalationRules.length === 0) {
        return interaction.reply({ content: "❌ No escalation rules configured.", flags: MessageFlags.Ephemeral });
    }

    const rule = current.escalationRules.find(r => r.warningCount === warnings);
    if (!rule) {
        return interaction.reply({ content: `❌ No rule found for ${warnings} warnings.`, flags: MessageFlags.Ephemeral });
    }

    const updatedRules = current.escalationRules.filter(r => r.warningCount !== warnings);
    await ModerationSystem.updateWarningEscalation(interaction.guild!.id, updatedRules, current.enabled);

    await interaction.reply({
        embeds: [new EmbedBuilder()
            .setTitle("✅ Escalation Rule Removed")
            .setColor("#FF6B6B")
            .addFields(
                { name: "Warnings", value: warnings.toString(), inline: true },
                { name: "Action", value: rule.action.toUpperCase(), inline: true },
                { name: "Reason", value: rule.reason, inline: false }
            )
            .setTimestamp()]
    });
};

commandHandlers.handleToggle = async (interaction: ChatInputCommandInteraction) => {
    const enabled = interaction.options.getBoolean("enabled", true);
    const current = await ModerationSystem.getWarningEscalation(interaction.guild!.id);
    await ModerationSystem.updateWarningEscalation(interaction.guild!.id, current?.escalationRules || [], enabled);

    await interaction.reply({
        embeds: [new EmbedBuilder()
            .setTitle("✅ Escalation Settings Updated")
            .setColor(enabled ? "#00FF00" : "#FF6B6B")
            .addFields(
                { name: "Status", value: enabled ? "🟢 Enabled" : "🔴 Disabled", inline: true },
                { name: "Rules Count", value: (current?.escalationRules.length || 0).toString(), inline: true }
            )
            .setTimestamp()]
    });
};

commandHandlers.handleClear = async (interaction: ChatInputCommandInteraction) => {
    await ModerationSystem.updateWarningEscalation(interaction.guild!.id, [], false);

    await interaction.reply({
        embeds: [new EmbedBuilder()
            .setTitle("✅ All Escalation Rules Cleared")
            .setColor("#FF6B6B")
            .setDescription("All warning escalation rules have been removed and escalation has been disabled.")
            .setTimestamp()]
    });
};

commandHandlers.handlePreset = async (interaction: ChatInputCommandInteraction) => {
    const preset = interaction.options.getString("preset", true);

    const presets: Record<string, EscalationRule[]> = {
        mild: [
            { warningCount: 3, action: "timeout", duration: 3600000, reason: "3 warnings — 1 hour timeout" },
            { warningCount: 5, action: "kick", reason: "5 warnings — kicked from server" }
        ],
        standard: [
            { warningCount: 3, action: "timeout", duration: 21600000, reason: "3 warnings — 6 hour timeout" },
            { warningCount: 5, action: "kick", reason: "5 warnings — kicked from server" },
            { warningCount: 7, action: "ban", reason: "7 warnings — banned from server", deleteMessages: 1 }
        ],
        strict: [
            { warningCount: 2, action: "timeout", duration: 3600000, reason: "2 warnings — 1 hour timeout" },
            { warningCount: 3, action: "mute", duration: 86400000, reason: "3 warnings — 24 hour mute" },
            { warningCount: 5, action: "ban", reason: "5 warnings — banned from server", deleteMessages: 3 }
        ]
    };

    const rules = presets[preset];
    if (!rules) {
        return interaction.reply({ content: "❌ Invalid preset.", flags: MessageFlags.Ephemeral });
    }

    await ModerationSystem.updateWarningEscalation(interaction.guild!.id, rules, true);

    const embed = new EmbedBuilder()
        .setTitle(`✅ Preset Applied: ${preset.charAt(0).toUpperCase() + preset.slice(1)}`)
        .setColor("#00FF00")
        .setDescription(`**${rules.length}** escalation rules have been configured.`)
        .setTimestamp();

    for (const rule of rules) {
        embed.addFields({
            name: `${rule.warningCount} Warnings`,
            value: `→ ${rule.action.toUpperCase()}${rule.duration ? ` (${Utility.formatDuration(rule.duration)})` : ""}`,
            inline: true
        });
    }

    await interaction.reply({ embeds: [embed] });
};

commandHandlers.handleExport = async (interaction: ChatInputCommandInteraction) => {
    const escalation = await ModerationSystem.getWarningEscalation(interaction.guild!.id);

    if (!escalation || escalation.escalationRules.length === 0) {
        return interaction.reply({ content: "❌ No escalation rules to export.", flags: MessageFlags.Ephemeral });
    }

    const exportData = {
        enabled: escalation.enabled,
        rules: escalation.escalationRules.map(r => ({
            warningCount: r.warningCount,
            action: r.action,
            duration: r.duration,
            reason: r.reason,
            deleteMessages: r.deleteMessages
        }))
    };

    const json = JSON.stringify(exportData, null, 2);

    await interaction.reply({
        embeds: [new EmbedBuilder()
            .setTitle("📤 Escalation Rules Export")
            .setDescription(`\`\`\`json\n${json.length > 4000 ? json.substring(0, 3997) + "..." : json}\n\`\`\``)
            .setColor("Blue")
            .setTimestamp()],
        flags: MessageFlags.Ephemeral
    });
};

commandHandlers.handleImport = async (interaction: ChatInputCommandInteraction) => {
    const jsonStr = interaction.options.getString("json", true);

    try {
        const data = JSON.parse(jsonStr);

        if (!data.rules || !Array.isArray(data.rules)) {
            return interaction.reply({ content: "❌ Invalid JSON format. Expected { rules: [...], enabled: boolean }.", flags: MessageFlags.Ephemeral });
        }

        const rules: EscalationRule[] = data.rules.map((r: any) => ({
            warningCount: r.warningCount,
            action: r.action,
            duration: r.duration,
            reason: r.reason || "Imported rule",
            deleteMessages: r.deleteMessages
        }));

        const enabled = data.enabled !== false;
        await ModerationSystem.updateWarningEscalation(interaction.guild!.id, rules, enabled);

        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setTitle("✅ Escalation Rules Imported")
                .setColor("#00FF00")
                .setDescription(`Imported **${rules.length}** rules. Escalation is **${enabled ? "enabled" : "disabled"}**.`)
                .setTimestamp()]
        });
    } catch {
        return interaction.reply({ content: "❌ Invalid JSON. Please provide a valid JSON string.", flags: MessageFlags.Ephemeral });
    }
};
