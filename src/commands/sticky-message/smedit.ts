import {
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    ColorResolvable
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import StickyMessage from "../../features/StickyMessage";
import Utility from "../../structures/Utility";
import Logger from "../../features/Logger";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("smedit")
        .setDescription("Edit an existing sticky message")
        .addSubcommand(sc =>
            sc.setName("title")
                .setDescription("Edit the title")
                .addStringOption(o => o.setName("id").setDescription("Sticky message ID").setRequired(true).setAutocomplete(true))
                .addStringOption(o => o.setName("title").setDescription("New title").setRequired(true).setMaxLength(256))
        )
        .addSubcommand(sc =>
            sc.setName("content")
                .setDescription("Edit the content/description")
                .addStringOption(o => o.setName("id").setDescription("Sticky message ID").setRequired(true).setAutocomplete(true))
                .addStringOption(o => o.setName("content").setDescription("New content").setRequired(true).setMaxLength(4096))
        )
        .addSubcommand(sc =>
            sc.setName("color")
                .setDescription("Edit the embed color")
                .addStringOption(o => o.setName("id").setDescription("Sticky message ID").setRequired(true).setAutocomplete(true))
                .addStringOption(o => o.setName("color").setDescription("Hex color, e.g. #FF0000").setRequired(true).setMaxLength(7))
        )
        .addSubcommand(sc =>
            sc.setName("thumbnail")
                .setDescription("Set or remove the thumbnail")
                .addStringOption(o => o.setName("id").setDescription("Sticky message ID").setRequired(true).setAutocomplete(true))
                .addStringOption(o => o.setName("url").setDescription("Thumbnail URL (empty to remove)").setRequired(true))
        )
        .addSubcommand(sc =>
            sc.setName("image")
                .setDescription("Set or remove the image")
                .addStringOption(o => o.setName("id").setDescription("Sticky message ID").setRequired(true).setAutocomplete(true))
                .addStringOption(o => o.setName("url").setDescription("Image URL (empty to remove)").setRequired(true))
        )
        .addSubcommand(sc =>
            sc.setName("footer")
                .setDescription("Edit the footer text")
                .addStringOption(o => o.setName("id").setDescription("Sticky message ID").setRequired(true).setAutocomplete(true))
                .addStringOption(o => o.setName("text").setDescription("Footer text").setRequired(true).setMaxLength(2048))
        )
        .addSubcommand(sc =>
            sc.setName("max-messages")
                .setDescription("Set the message count threshold")
                .addStringOption(o => o.setName("id").setDescription("Sticky message ID").setRequired(true).setAutocomplete(true))
                .addIntegerOption(o => o.setName("count").setDescription("Messages before repost (0 = persistent)").setRequired(true).setMinValue(0).setMaxValue(1000))
        )
        .addSubcommand(sc =>
            sc.setName("mode")
                .setDescription("Set the sticky mode")
                .addStringOption(o => o.setName("id").setDescription("Sticky message ID").setRequired(true).setAutocomplete(true))
                .addStringOption(o => o.setName("mode").setDescription("Mode").setRequired(true)
                    .addChoices(
                        { name: "Message Count", value: "message-count" },
                        { name: "Persistent", value: "persistent" }
                    )
                )
        )
        .addSubcommand(sc =>
            sc.setName("mention-role")
                .setDescription("Set the role to ping on repost")
                .addStringOption(o => o.setName("id").setDescription("Sticky message ID").setRequired(true).setAutocomplete(true))
                .addRoleOption(o => o.setName("role").setDescription("Role to ping (none to remove)").setRequired(false))
        )
        .addSubcommand(sc =>
            sc.setName("resend")
                .setDescription("Force resend the sticky message now")
                .addStringOption(o => o.setName("id").setDescription("Sticky message ID").setRequired(true).setAutocomplete(true))
        ),
    config: {
        category: "sticky-message",
        usage: "<subcommand> [options]",
        examples: [
            "/smedit title id:AbC123 title:New Title",
            "/smedit content id:AbC123 content:Updated content...",
            "/smedit color id:AbC123 color:#FF0000",
            "/smedit max-messages id:AbC123 count:5",
            "/smedit resend id:AbC123"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const subcommand = interaction.options.getSubcommand();
            const id = interaction.options.getString("id", true);
            const guildID = interaction.guild.id;

            const sticky = await StickyMessage.getStickyMessage(id);
            if (!sticky || sticky.guildID !== guildID) {
                return interaction.reply({
                    content: "❌ No sticky message found with that ID.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const fields: { name: string; value: string; inline?: boolean }[] = [];
            let replyContent = "";

            switch (subcommand) {
                case "title": {
                    const title = interaction.options.getString("title", true);
                    await StickyMessage.updateStickyMessage(id, { title });
                    replyContent = `✅ Title updated to \`${title}\`.`;
                    fields.push({ name: "Title", value: title });
                    break;
                }
                case "content": {
                    const content = interaction.options.getString("content", true);
                    await StickyMessage.updateStickyMessage(id, { content });
                    replyContent = "✅ Content updated.";
                    fields.push({ name: "Content", value: content.length > 100 ? content.substring(0, 97) + "..." : content });
                    break;
                }
                case "color": {
                    const color = interaction.options.getString("color", true);
                    const colorRegex = /^#?[0-9A-Fa-f]{6}$/;
                    if (!colorRegex.test(color)) {
                        return interaction.reply({ content: "❌ Invalid hex color.", flags: MessageFlags.Ephemeral });
                    }
                    const normalized = color.startsWith("#") ? color : `#${color}`;
                    try { new EmbedBuilder().setColor(normalized as ColorResolvable); }
                    catch { return interaction.reply({ content: "❌ Invalid color value.", flags: MessageFlags.Ephemeral }); }
                    await StickyMessage.updateStickyMessage(id, { color: normalized });
                    replyContent = `✅ Color updated to \`${normalized}\`.`;
                    fields.push({ name: "Color", value: normalized });
                    break;
                }
                case "thumbnail": {
                    const url = interaction.options.getString("url", true);
                    await StickyMessage.updateStickyMessage(id, { thumbnailUrl: url });
                    replyContent = url ? "✅ Thumbnail updated." : "✅ Thumbnail removed.";
                    break;
                }
                case "image": {
                    const url = interaction.options.getString("url", true);
                    await StickyMessage.updateStickyMessage(id, { imageUrl: url });
                    replyContent = url ? "✅ Image updated." : "✅ Image removed.";
                    break;
                }
                case "footer": {
                    const text = interaction.options.getString("text", true);
                    await StickyMessage.updateStickyMessage(id, { footer: { text, iconUrl: sticky.footer?.iconUrl || "" } });
                    replyContent = "✅ Footer updated.";
                    fields.push({ name: "Footer", value: text });
                    break;
                }
                case "max-messages": {
                    const count = interaction.options.getInteger("count", true);
                    await StickyMessage.updateStickyMessage(id, { maxMessageCount: count });
                    replyContent = count > 0 ? `✅ Will repost after **${count}** messages.` : "✅ Set to persistent mode (always at bottom).";
                    fields.push({ name: "Max Messages", value: count.toString(), inline: true });
                    break;
                }
                case "mode": {
                    const mode = interaction.options.getString("mode", true);
                    await StickyMessage.updateStickyMessage(id, { mode: mode as "message-count" | "persistent" });
                    replyContent = `✅ Mode set to **${mode === "persistent" ? "Persistent" : "Message Count"}**.`;
                    fields.push({ name: "Mode", value: mode === "persistent" ? "📌 Persistent" : "🔢 Message Count", inline: true });
                    break;
                }
                case "mention-role": {
                    const role = interaction.options.getRole("role");
                    await StickyMessage.updateStickyMessage(id, { mentionRoleID: role?.id || "" });
                    replyContent = role ? `✅ Will mention <@&${role.id}> on repost.` : "✅ Mention role removed.";
                    break;
                }
                case "resend": {
                    const newEmbedID = await StickyMessage.sendStickyEmbed(sticky, interaction.client as any);
                    if (newEmbedID) {
                        replyContent = "✅ Sticky message resent.";
                    } else {
                        replyContent = "❌ Failed to resend. The channel may no longer be accessible.";
                    }
                    break;
                }
                default:
                    return interaction.reply({ content: "❌ Invalid subcommand.", flags: MessageFlags.Ephemeral });
            }

            const embed = new EmbedBuilder()
                .setTitle("✏️ Sticky Message Updated")
                .setDescription(replyContent)
                .addFields([
                    { name: "ID", value: `\`${id}\``, inline: true },
                    { name: "Channel", value: `<#${sticky.channelID}>`, inline: true },
                    { name: "Status", value: sticky.enabled ? "🟢 Enabled" : "🔴 Disabled", inline: true },
                    ...fields
                ])
                .setColor("Aqua")
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            Logger.error(`Error in smedit command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while editing the sticky message.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    },

    async autocomplete(interaction: AutocompleteInteraction) {
        const stickyMessages = await StickyMessage.getStickyMessages(interaction.guildId!);
        const uniqueIDs = stickyMessages.map(sm => sm.uniqueID);
        const focused = interaction.options.getFocused();
        const choices = Utility.filterAutocompleteChoices(uniqueIDs, focused);
        await interaction.respond(choices);
    }
};
