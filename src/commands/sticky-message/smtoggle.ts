import {
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import StickyMessage from "../../features/StickyMessage";
import Utility from "../../structures/Utility";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("smtoggle")
        .setDescription("Enable or disable a sticky message")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addStringOption(option =>
            option.setName("id")
                .setDescription("The ID of the sticky message")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addBooleanOption(option =>
            option.setName("enabled")
                .setDescription("Enable or disable")
                .setRequired(true)
        ),
    config: {
        category: "sticky-message",
        usage: "<id> <enabled>",
        examples: ["/smtoggle id:AbC123 enabled:false"],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const id = interaction.options.getString("id", true);
        const enabled = interaction.options.getBoolean("enabled", true);

        const sticky = await StickyMessage.toggleStickyMessage(id, enabled);
        if (!sticky) {
            return interaction.reply({
                content: "❌ No sticky message found with that ID.",
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`${enabled ? "🟢" : "🔴"} Sticky Message ${enabled ? "Enabled" : "Disabled"}`)
            .setDescription(`Sticky message \`${id}\` has been **${enabled ? "enabled" : "disabled"}**.`)
            .addFields([
                { name: "Channel", value: `<#${sticky.channelID}>`, inline: true },
                { name: "Title", value: sticky.title || "Untitled", inline: true }
            ])
            .setColor(enabled ? "Green" : "Orange")
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },

    async autocomplete(interaction: AutocompleteInteraction) {
        const stickyMessages = await StickyMessage.getStickyMessages(interaction.guildId!);
        const choices = stickyMessages.map(sm => ({
            name: `${sm.uniqueID} — ${sm.title || "Untitled"} (${sm.enabled ? "ON" : "OFF"})`,
            value: sm.uniqueID
        }));
        const focused = interaction.options.getFocused();
        const filtered = Utility.filterAutocompleteChoices(choices.map(c => c.name), focused);
        const result = filtered.map(f => {
            const match = choices.find(c => c.name === f.name || c.name.startsWith(f.name));
            return match || f;
        });
        await interaction.respond(result.slice(0, 25));
    }
};
