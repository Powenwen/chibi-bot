import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    ChannelType,
    TextChannel,
    EmbedBuilder,
    ColorResolvable,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import StickyMessage from "../../features/StickyMessage";
import Utility from "../../structures/Utility";
import Logger from "../../features/Logger";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("smadd")
        .setDescription("Create a new sticky message that stays at the bottom of a channel")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("The channel for the sticky message")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption(option =>
            option.setName("title")
                .setDescription("The title of the sticky message")
                .setRequired(true)
                .setMaxLength(256)
        )
        .addStringOption(option =>
            option.setName("content")
                .setDescription("The main content/description (max 4096 chars)")
                .setRequired(true)
                .setMaxLength(4096)
        )
        .addStringOption(option =>
            option.setName("color")
                .setDescription("Hex color for the embed (default: #5865F2)")
                .setRequired(false)
                .setMaxLength(7)
        )
        .addStringOption(option =>
            option.setName("thumbnail")
                .setDescription("Thumbnail URL")
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("image")
                .setDescription("Image URL")
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("footer")
                .setDescription("Footer text")
                .setRequired(false)
                .setMaxLength(2048)
        )
        .addIntegerOption(option =>
            option.setName("max-messages")
                .setDescription("Repost after N messages (0 = persistent, default: 0)")
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(1000)
        )
        .addStringOption(option =>
            option.setName("mode")
                .setDescription("How the sticky message behaves")
                .setRequired(false)
                .addChoices(
                    { name: "Message Count (repost after N messages)", value: "message-count" },
                    { name: "Persistent (always at bottom)", value: "persistent" }
                )
        )
        .addRoleOption(option =>
            option.setName("mention-role")
                .setDescription("Role to ping when the sticky is reposted")
                .setRequired(false)
        ),
    config: {
        category: "sticky-message",
        usage: "<channel> <title> <content> [color] [thumbnail] [image] [footer] [max-messages] [mode] [mention-role]",
        examples: [
            "/smadd channel:#rules title:📜 Server Content:Please read our rules... color:#FF0000",
            "/smadd channel:#info title:ℹ️ Info content:Welcome! max-messages:10 mode:message-count",
            "/smadd channel:#announcements title:📢 Announcements content:Stay tuned! mention-role:@Members"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const channel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]) as TextChannel;
            const title = interaction.options.getString("title", true);
            const content = interaction.options.getString("content", true);
            const color = interaction.options.getString("color") || "#5865F2";
            const thumbnail = interaction.options.getString("thumbnail");
            const image = interaction.options.getString("image");
            const footer = interaction.options.getString("footer");
            const maxMessages = interaction.options.getInteger("max-messages") ?? 0;
            const mode = interaction.options.getString("mode") ?? "message-count";
            const mentionRole = interaction.options.getRole("mention-role");

            // Validate color
            const colorRegex = /^#?[0-9A-Fa-f]{6}$/;
            if (!colorRegex.test(color)) {
                return interaction.reply({
                    content: "❌ Invalid color. Use a valid hex code (e.g., #5865F2).",
                    flags: MessageFlags.Ephemeral
                });
            }
            const normalizedColor = color.startsWith("#") ? color : `#${color}`;

            // Check if a sticky already exists in this channel
            const existing = await StickyMessage.getStickyMessageByChannel(interaction.guild.id, channel.id);
            if (existing) {
                return interaction.reply({
                    content: `⚠️ A sticky message already exists in <#${channel.id}> (ID: \`${existing.uniqueID}\`). Use \`/smedit\` to modify it or \`/smdelete\` to remove it first.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const uniqueID = Utility.codeGen(6);

            // Build the embed
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(content)
                .setColor(normalizedColor as ColorResolvable);

            if (thumbnail) embed.setThumbnail(thumbnail);
            if (image) embed.setImage(image);
            if (footer) embed.setFooter({ text: footer });

            const sentMessage = await channel.send({ embeds: [embed] });

            // Save to database
            await StickyMessage.addStickyMessage({
                guildID: interaction.guild.id,
                channelID: channel.id,
                messageID: sentMessage.id,
                messageChannelID: channel.id,
                uniqueID,
                authorID: interaction.user.id,
                title,
                content,
                color: normalizedColor,
                thumbnailUrl: thumbnail || "",
                imageUrl: image || "",
                footer: { text: footer || "", iconUrl: "" },
                author: { name: "", iconUrl: "", url: "" },
                fields: [],
                timestamp: false,
                embedID: sentMessage.id,
                maxMessageCount: maxMessages,
                mode: mode as "message-count" | "interval" | "persistent",
                intervalSeconds: 0,
                enabled: true,
                mentionRoleID: mentionRole?.id || ""
            });

            const infoEmbed = new EmbedBuilder()
                .setTitle("✅ Sticky Message Created")
                .setDescription(`Sticky message posted in <#${channel.id}>`)
                .addFields([
                    { name: "ID", value: `\`${uniqueID}\``, inline: true },
                    { name: "Channel", value: `<#${channel.id}>`, inline: true },
                    { name: "Mode", value: mode === "persistent" ? "📌 Persistent" : `🔢 After ${maxMessages || 0} messages`, inline: true },
                    { name: "Title", value: title, inline: false }
                ])
                .setColor("Green")
                .setTimestamp();

            infoEmbed.setFooter({ text: `Use /smedit to modify, /smdelete ${uniqueID} to remove` });

            await interaction.editReply({ embeds: [infoEmbed] });
        } catch (error) {
            Logger.error(`Error in smadd command: ${error}`);
            await interaction.editReply({
                content: "❌ An error occurred while creating the sticky message."
            }).catch(() => {
                interaction.reply({
                    content: "❌ An error occurred while creating the sticky message.",
                    flags: MessageFlags.Ephemeral
                }).catch(() => null);
            });
        }
    }
};
