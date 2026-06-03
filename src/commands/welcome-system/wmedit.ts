import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    ColorResolvable,
    ChannelType,
    ActionRowBuilder,
    ModalBuilder,
    ModalActionRowComponentBuilder,
    TextInputBuilder,
    TextInputStyle,
    Role
} from 'discord.js';
import { BaseCommand } from '../../interfaces';
import WelcomeSystem from '../../features/WelcomeSystem';
import Logger from '../../features/Logger';

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("wmedit")
        .setDescription("Edit the welcome message configuration")
        .addSubcommand(sc =>
            sc.setName("channel")
                .setDescription("Set the welcome channel")
                .addChannelOption(o => o.setName("channel").setDescription("The welcome channel").setRequired(true).addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(sc =>
            sc.setName("type")
                .setDescription("Set the welcome message type")
                .addStringOption(o => o.setName("type").setDescription("Message type").setRequired(true)
                    .addChoices(
                        { name: "Embed", value: "embed" },
                        { name: "Text", value: "text" },
                        { name: "Embed + Text", value: "both" }
                    )
                )
        )
        .addSubcommand(sc =>
            sc.setName("title")
                .setDescription("Set the embed title")
                .addStringOption(o => o.setName("title").setDescription("Embed title (max 256 chars)").setRequired(true).setMaxLength(256))
        )
        .addSubcommand(sc =>
            sc.setName("description")
                .setDescription("Set the embed description (opens a modal for long text)")
        )
        .addSubcommand(sc =>
            sc.setName("message")
                .setDescription("Set the plain text message (for text/both types)")
        )
        .addSubcommand(sc =>
            sc.setName("color")
                .setDescription("Set the embed color")
                .addStringOption(o => o.setName("color").setDescription("Hex color, e.g. #5865F2").setRequired(true).setMaxLength(7))
        )
        .addSubcommand(sc =>
            sc.setName("thumbnail")
                .setDescription("Configure the thumbnail")
                .addBooleanOption(o => o.setName("enabled").setDescription("Show thumbnail").setRequired(true))
                .addStringOption(o => o.setName("url").setDescription("Custom thumbnail URL (supports {userAvatar})").setRequired(false))
        )
        .addSubcommand(sc =>
            sc.setName("image")
                .setDescription("Configure the embed image")
                .addBooleanOption(o => o.setName("enabled").setDescription("Show image").setRequired(true))
                .addStringOption(o => o.setName("url").setDescription("Image URL").setRequired(false))
        )
        .addSubcommand(sc =>
            sc.setName("author")
                .setDescription("Configure the embed author")
                .addBooleanOption(o => o.setName("enabled").setDescription("Show author").setRequired(true))
                .addStringOption(o => o.setName("name").setDescription("Author name").setRequired(false).setMaxLength(256))
                .addStringOption(o => o.setName("icon-url").setDescription("Author icon URL").setRequired(false))
                .addStringOption(o => o.setName("url").setDescription("Author link URL").setRequired(false))
        )
        .addSubcommand(sc =>
            sc.setName("footer")
                .setDescription("Configure the embed footer")
                .addBooleanOption(o => o.setName("enabled").setDescription("Show footer").setRequired(true))
                .addStringOption(o => o.setName("text").setDescription("Footer text").setRequired(false).setMaxLength(2048))
                .addStringOption(o => o.setName("icon-url").setDescription("Footer icon URL").setRequired(false))
                .addBooleanOption(o => o.setName("timestamp").setDescription("Show timestamp in footer").setRequired(false))
        )
        .addSubcommand(sc =>
            sc.setName("embed-timestamp")
                .setDescription("Toggle the embed-level timestamp")
                .addBooleanOption(o => o.setName("enabled").setDescription("Show embed timestamp").setRequired(true))
        )
        .addSubcommand(sc =>
            sc.setName("add-field")
                .setDescription("Add a field to the embed")
                .addStringOption(o => o.setName("name").setDescription("Field name").setRequired(true).setMaxLength(256))
                .addStringOption(o => o.setName("value").setDescription("Field value").setRequired(true).setMaxLength(1024))
                .addBooleanOption(o => o.setName("inline").setDescription("Display inline").setRequired(false))
        )
        .addSubcommand(sc =>
            sc.setName("remove-field")
                .setDescription("Remove a field by its index")
                .addIntegerOption(o => o.setName("index").setDescription("Field number (1-based)").setRequired(true).setMinValue(1))
        )
        .addSubcommand(sc =>
            sc.setName("dm")
                .setDescription("Configure DM welcome message")
                .addBooleanOption(o => o.setName("enabled").setDescription("Send DM welcome").setRequired(true))
                .addStringOption(o => o.setName("message").setDescription("DM message (max 2000 chars)").setRequired(false).setMaxLength(2000))
        )
        .addSubcommand(sc =>
            sc.setName("roles")
                .setDescription("Configure auto-role assignment on join")
                .addBooleanOption(o => o.setName("enabled").setDescription("Enable auto-role").setRequired(true))
                .addStringOption(o => o.setName("action").setDescription("Add or remove a role")
                    .setRequired(true)
                    .addChoices(
                        { name: "Add Role", value: "add" },
                        { name: "Remove Role", value: "remove" },
                        { name: "Clear All", value: "clear" }
                    )
                )
                .addRoleOption(o => o.setName("role").setDescription("The role to add/remove").setRequired(false))
        )
        .addSubcommand(sc =>
            sc.setName("toggle")
                .setDescription("Enable or disable the welcome system")
                .addBooleanOption(o => o.setName("enabled").setDescription("Enable welcome system").setRequired(true))
        ),
    config: {
        category: "welcome-system",
        usage: "/wmedit <subcommand>",
        examples: [
            "/wmedit channel channel:#welcome",
            "/wmedit type type:Embed",
            "/wmedit title title:Welcome to {server}!",
            "/wmedit color color:#5865F2",
            "/wmedit thumbnail enabled:true",
            "/wmedit author enabled:true name:{username}",
            "/wmedit footer enabled:true text:Member #{memberCount}",
            "/wmedit add-field name:📊 Stats value:Member #{memberCount}",
            "/wmedit dm enabled:true message:Welcome to {server}!",
            "/wmedit roles enabled:true action:add role:@Member",
            "/wmedit toggle enabled:true"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const subcommand = interaction.options.getSubcommand();
            const guildID = interaction.guild.id;

            switch (subcommand) {
                case "channel": {
                    const channel = interaction.options.getChannel("channel", true);
                    if (channel.type !== ChannelType.GuildText) {
                        return interaction.reply({ content: "❌ The channel must be a text channel.", flags: MessageFlags.Ephemeral });
                    }
                    const ok = await WelcomeSystem.editWelcomeMessage("channelID", channel.id, guildID);
                    return interaction.reply({
                        content: ok ? `✅ Welcome channel set to <#${channel.id}>.` : "❌ No welcome config found. Use `/set-welcome-channel` first.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                case "type": {
                    const type = interaction.options.getString("type", true);
                    const ok = await WelcomeSystem.editWelcomeMessage("type", type, guildID);
                    const labels: Record<string, string> = { embed: "📋 Embed", text: "💬 Text", both: "📋💬 Embed + Text" };
                    return interaction.reply({
                        content: ok ? `✅ Welcome type set to **${labels[type] || type}**.` : "❌ No welcome config found.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                case "title": {
                    const title = interaction.options.getString("title", true);
                    if (title.length > 256) {
                        return interaction.reply({ content: "❌ Title cannot exceed 256 characters.", flags: MessageFlags.Ephemeral });
                    }
                    const ok = await WelcomeSystem.editWelcomeMessage("title", title, guildID);
                    return interaction.reply({
                        content: ok ? `✅ Welcome title set to \`${title}\`.` : "❌ No welcome config found.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                case "description": {
                    const modal = new ModalBuilder()
                        .setTitle("Edit Welcome Description")
                        .setCustomId("wm_edit_description");

                    const descInput = new TextInputBuilder()
                        .setCustomId("description")
                        .setLabel("Description (supports placeholders like {user})")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                        .setMaxLength(4096)
                        .setPlaceholder("Welcome {user} to {server}! You are member #{memberCount}.");

                    modal.addComponents(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(descInput));
                    await interaction.showModal(modal);
                    return;
                }

                case "message": {
                    const modal = new ModalBuilder()
                        .setTitle("Edit Welcome Text Message")
                        .setCustomId("wm_edit_message");

                    const msgInput = new TextInputBuilder()
                        .setCustomId("message")
                        .setLabel("Text message (supports placeholders)")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                        .setMaxLength(2000)
                        .setPlaceholder("Welcome {user} to {server}!");

                    modal.addComponents(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(msgInput));
                    await interaction.showModal(modal);
                    return;
                }

                case "color": {
                    const color = interaction.options.getString("color", true);
                    const colorRegex = /^#?[0-9A-Fa-f]{6}$/;
                    if (!colorRegex.test(color)) {
                        return interaction.reply({ content: "❌ Invalid color. Use a valid hex code (e.g., #5865F2).", flags: MessageFlags.Ephemeral });
                    }
                    const normalized = color.startsWith("#") ? color : `#${color}`;
                    try { new EmbedBuilder().setColor(normalized as ColorResolvable); }
                    catch { return interaction.reply({ content: "❌ Invalid color value.", flags: MessageFlags.Ephemeral }); }
                    const ok = await WelcomeSystem.editWelcomeMessage("color", normalized, guildID);
                    return interaction.reply({
                        content: ok ? `✅ Welcome color set to \`${normalized}\`.` : "❌ No welcome config found.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                case "thumbnail": {
                    const enabled = interaction.options.getBoolean("enabled", true);
                    const url = interaction.options.getString("url");
                    await WelcomeSystem.editWelcomeMessage("thumbnail", enabled, guildID);
                    if (url !== null) await WelcomeSystem.editWelcomeMessage("thumbnailUrl", url, guildID);
                    return interaction.reply({
                        content: `✅ Thumbnail ${enabled ? "enabled" : "disabled"}${url ? " with custom URL" : ""}.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                case "image": {
                    const enabled = interaction.options.getBoolean("enabled", true);
                    const url = interaction.options.getString("url");
                    await WelcomeSystem.editWelcomeMessage("image", enabled, guildID);
                    if (url !== null) await WelcomeSystem.editWelcomeMessage("imageUrl", url, guildID);
                    return interaction.reply({
                        content: `✅ Image ${enabled ? "enabled" : "disabled"}${url ? " with URL" : ""}.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                case "author": {
                    const enabled = interaction.options.getBoolean("enabled", true);
                    const name = interaction.options.getString("name");
                    const iconUrl = interaction.options.getString("icon-url");
                    const url = interaction.options.getString("url");
                    await WelcomeSystem.editWelcomeMessage("author.enabled", enabled, guildID);
                    if (name !== null) await WelcomeSystem.editWelcomeMessage("author.name", name, guildID);
                    if (iconUrl !== null) await WelcomeSystem.editWelcomeMessage("author.iconUrl", iconUrl, guildID);
                    if (url !== null) await WelcomeSystem.editWelcomeMessage("author.url", url, guildID);
                    return interaction.reply({
                        content: `✅ Author ${enabled ? "enabled" : "disabled"}${name ? ` with name "${name}"` : ""}.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                case "footer": {
                    const enabled = interaction.options.getBoolean("enabled", true);
                    const text = interaction.options.getString("text");
                    const iconUrl = interaction.options.getString("icon-url");
                    const timestamp = interaction.options.getBoolean("timestamp");
                    await WelcomeSystem.editWelcomeMessage("footer.enabled", enabled, guildID);
                    if (text !== null) {
                        if (text.length > 2048) return interaction.reply({ content: "❌ Footer text cannot exceed 2048 characters.", flags: MessageFlags.Ephemeral });
                        await WelcomeSystem.editWelcomeMessage("footer.text", text, guildID);
                    }
                    if (iconUrl !== null) await WelcomeSystem.editWelcomeMessage("footer.iconUrl", iconUrl, guildID);
                    if (timestamp !== null) await WelcomeSystem.editWelcomeMessage("footer.timestamp", timestamp, guildID);
                    return interaction.reply({ content: `✅ Footer ${enabled ? "enabled" : "disabled"}.`, flags: MessageFlags.Ephemeral });
                }

                case "embed-timestamp": {
                    const enabled = interaction.options.getBoolean("enabled", true);
                    const ok = await WelcomeSystem.editWelcomeMessage("embed.timestamp", enabled, guildID);
                    return interaction.reply({
                        content: ok ? `✅ Embed timestamp ${enabled ? "enabled" : "disabled"}.` : "❌ No welcome config found.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                case "add-field": {
                    const name = interaction.options.getString("name", true);
                    const value = interaction.options.getString("value", true);
                    const inline = interaction.options.getBoolean("inline") ?? false;
                    if (name.length > 256) return interaction.reply({ content: "❌ Field name cannot exceed 256 characters.", flags: MessageFlags.Ephemeral });
                    if (value.length > 1024) return interaction.reply({ content: "❌ Field value cannot exceed 1024 characters.", flags: MessageFlags.Ephemeral });
                    const ok = await WelcomeSystem.addField(guildID, name, value, inline);
                    return interaction.reply({
                        content: ok ? `✅ Field added: **${name}**` : "❌ Could not add field. Max 25 fields reached or no config found.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                case "remove-field": {
                    const index = interaction.options.getInteger("index", true) - 1;
                    const ok = await WelcomeSystem.removeField(guildID, index);
                    return interaction.reply({
                        content: ok ? `✅ Field #${index + 1} removed.` : "❌ Invalid field index or no config found.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                case "dm": {
                    const enabled = interaction.options.getBoolean("enabled", true);
                    const message = interaction.options.getString("message");
                    await WelcomeSystem.editWelcomeMessage("dmEnabled", enabled, guildID);
                    if (message !== null) {
                        if (message.length > 2000) return interaction.reply({ content: "❌ DM message cannot exceed 2000 characters.", flags: MessageFlags.Ephemeral });
                        await WelcomeSystem.editWelcomeMessage("dmMessage", message, guildID);
                    }
                    return interaction.reply({
                        content: `✅ DM welcome ${enabled ? "enabled" : "disabled"}${message ? " with custom message" : ""}.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                case "roles": {
                    const enabled = interaction.options.getBoolean("enabled", true);
                    const action = interaction.options.getString("action", true) as "add" | "remove" | "clear";
                    const role = interaction.options.getRole("role") as Role | null;
                    await WelcomeSystem.editWelcomeMessage("roleEnabled", enabled, guildID);
                    if (action === "clear") {
                        await WelcomeSystem.editWelcomeMessage("roleIDs", [], guildID);
                        return interaction.reply({ content: "✅ All auto-roles cleared.", flags: MessageFlags.Ephemeral });
                    }
                    if (!role) return interaction.reply({ content: "❌ Please specify a role for add/remove actions.", flags: MessageFlags.Ephemeral });
                    if (action === "add") {
                        const ok = await WelcomeSystem.addRole(guildID, role.id);
                        return interaction.reply({
                            content: ok ? `✅ Role <@&${role.id}> added to auto-assign list.` : "❌ Could not add role (already exists or no config).",
                            flags: MessageFlags.Ephemeral
                        });
                    } else {
                        const ok = await WelcomeSystem.removeRole(guildID, role.id);
                        return interaction.reply({
                            content: ok ? `✅ Role <@&${role.id}> removed from auto-assign list.` : "❌ Role not found in list.",
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }

                case "toggle": {
                    const enabled = interaction.options.getBoolean("enabled", true);
                    const ok = await WelcomeSystem.editWelcomeMessage("enabled", enabled, guildID);
                    return interaction.reply({
                        content: ok ? `✅ Welcome system ${enabled ? "🟢 enabled" : "🔴 disabled"}.` : "❌ No welcome config found.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                default:
                    return interaction.reply({ content: "❌ Invalid subcommand.", flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            Logger.error(`Error in wmedit command: ${error}`);
            await interaction.reply({
                content: "❌ An error occurred while editing the welcome message.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};
