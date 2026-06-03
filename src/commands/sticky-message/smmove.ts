import {
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    ChannelType,
    MessageFlags,
    EmbedBuilder
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import StickyMessage from "../../features/StickyMessage";
import Utility from "../../structures/Utility";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("smmove")
        .setDescription("Move a sticky message to a different channel")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addStringOption(option =>
            option.setName("id")
                .setDescription("The ID of the sticky message")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("The new channel for the sticky message")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        ),
    config: {
        category: "sticky-message",
        usage: "<id> <channel>",
        examples: ["/smmove id:AbC123 channel:#new-channel"],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const id = interaction.options.getString("id", true);
        const newChannel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);

        const sticky = await StickyMessage.getStickyMessage(id);
        if (!sticky || sticky.guildID !== interaction.guild.id) {
            return interaction.reply({
                content: "❌ No sticky message found with that ID.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (sticky.channelID === newChannel.id) {
            return interaction.reply({
                content: "⚠️ The sticky message is already in that channel.",
                flags: MessageFlags.Ephemeral
            });
        }

        // Check if target channel already has a sticky
        const existingInTarget = await StickyMessage.getStickyMessageByChannel(interaction.guild.id, newChannel.id);
        if (existingInTarget) {
            return interaction.reply({
                content: `⚠️ A sticky message already exists in <#${newChannel.id}> (ID: \`${existingInTarget.uniqueID}\`). Delete it first.`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Delete old embed
        try {
            const oldChannel = interaction.guild.channels.cache.get(sticky.channelID);
            if (oldChannel && sticky.embedID) {
                const oldMsg = await (oldChannel as any).messages.fetch(sticky.embedID).catch(() => null);
                if (oldMsg) await oldMsg.delete().catch(() => null);
            }
        } catch {
            // Old message already deleted
        }

        // Move in database
        await StickyMessage.moveStickyMessage(id, newChannel.id);

        // Send new embed in target channel
        const updatedSticky = await StickyMessage.getStickyMessage(id);
        if (updatedSticky) {
            await StickyMessage.sendStickyEmbed(updatedSticky, interaction.client as any);
        }

        const embed = new EmbedBuilder()
            .setTitle("📦 Sticky Message Moved")
            .setDescription(`Sticky message \`${id}\` has been moved.`)
            .addFields([
                { name: "From", value: `<#${sticky.channelID}>`, inline: true },
                { name: "To", value: `<#${newChannel.id}>`, inline: true },
                { name: "Title", value: sticky.title || "Untitled", inline: false }
            ])
            .setColor("Blue")
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },

    async autocomplete(interaction: AutocompleteInteraction) {
        const stickyMessages = await StickyMessage.getStickyMessages(interaction.guildId!);
        const choices = stickyMessages.map(sm => ({
            name: `${sm.uniqueID} — ${sm.title || "Untitled"}`,
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
