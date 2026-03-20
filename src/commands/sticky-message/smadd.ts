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
        .setDescription("Add a sticky message to the bot")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addStringOption(option =>
            option
                .setName("message")
                .setDescription("The message ID or URL you want to make sticky")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("title")
                .setDescription("The title of the sticky message")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("color")
                .setDescription("The color of the sticky message")
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option
                .setName("maxmessagecount")
                .setDescription("The maximum number of messages before the sticky message is sent")
                .setRequired(false)
        )
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("The channel you want the sticky message to be sent to")
                .setRequired(false)
                .addChannelTypes(ChannelType.GuildText)
        ),
    config: {
        category: "sticky-message",
        usage: "<message ID> <channel> [options]",
        examples: ["123456789012345678", "123456789012345678 #channel"],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const options = interaction.options;
        const messageInput = options.getString("message", true);
        const color = options.getString("color") || "Aqua";
        const channel = options.getChannel("channel") as TextChannel || interaction.channel as TextChannel;

        if (!channel) {
            return interaction.reply({
                content: "Please provide a valid channel",
                flags: MessageFlags.Ephemeral
            });
        }

        // Parse message ID and channel ID from URL or ID
        let messageId: string;
        let messageChannelId: string | null = null;

        // Check if input is a message URL
        const urlMatch = messageInput.match(/discord\.com\/channels\/\d+\/(\d+)\/(\d+)/);
        if (urlMatch) {
            messageChannelId = urlMatch[1];
            messageId = urlMatch[2];
        } else {
            // Assume it's just a message ID
            messageId = messageInput;
        }

        // Defer reply since we might search multiple channels
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Try to fetch the message
        let messageExists = null;
        let messageChannel: TextChannel | null = null;

        if (messageChannelId) {
            // We have a channel ID from URL, try to fetch directly
            try {
                const fetchedChannel = await interaction.guild.channels.fetch(messageChannelId);
                if (fetchedChannel?.isTextBased() && fetchedChannel instanceof TextChannel) {
                    messageChannel = fetchedChannel;
                    if (!messageChannel) {
                        await interaction.editReply({
                            content: "❌ Could not find the specified channel from the message URL"
                        });
                        return;
                    }
                    messageExists = await messageChannel.messages.fetch(messageId).catch(() => null);
                }
            } catch {
                // Channel not accessible or doesn't exist
            }
        }

        // If we don't have the message yet, search all text channels
        if (!messageExists) {
            const textChannels = interaction.guild.channels.cache.filter(
                ch => ch.isTextBased() && ch.type === ChannelType.GuildText
            ) as Map<string, TextChannel>;

            for (const [_, ch] of textChannels) {
                try {
                    messageExists = await ch.messages.fetch(messageId).catch(() => null);
                    if (messageExists) {
                        messageChannel = ch;
                        break;
                    }
                } catch {
                    // Can't access this channel, continue
                    continue;
                }
            }
        }

        if (!messageExists || !messageChannel) {
            return interaction.editReply({
                content: "❌ Could not find the message. Make sure:\n" +
                    "• The message ID is correct\n" +
                    "• The message exists in this server\n" +
                    "• I have permission to view the channel\n\n" +
                    "💡 **Tip:** You can right-click a message and copy its link for easier use!"
            });
        }

        // Check if the message is already a sticky message
        const stickyMessageExists = await StickyMessage.getStickyMessageBy("messageID", messageId);

        if (stickyMessageExists) {
            return interaction.editReply({
                content: "⚠️ The message provided is already a sticky message"
            });
        }

        const customId = Utility.codeGen(6);

        // Add the sticky message to the database
        try {
            const embed = new EmbedBuilder()
                .setTitle(options.getString("title", true))
                .setDescription(messageExists.content)
                .setColor(color as ColorResolvable)
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setTimestamp();
    
            const embedMessage = await channel.send({ embeds: [embed] });

            await StickyMessage.addStickyMessage(
                interaction.guild.id,
                channel.id,
                messageId,
                messageChannel.id,
                customId,
                interaction.user.id,
                options.getString("title", true),
                messageExists.content,
                color,
                embedMessage.id,
                options.getInteger("maxmessagecount") || 0
            ).catch(() => {
                return interaction.editReply({
                    content: "❌ An error occurred while adding the sticky message"
                });
            });
        } catch (error) {
            Logger.error(`Error adding sticky message: ${error instanceof Error ? error.message : String(error)}`);
            return interaction.editReply({
                content: "❌ An error occurred while adding the sticky message"
            });
        }

        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("✅ Sticky Message Added")
                    .setDescription(`The sticky message has been successfully added to <#${channel.id}>`)
                    .addFields([
                        { name: "Source Message", value: `[Jump to message](https://discord.com/channels/${interaction.guild.id}/${messageChannel.id}/${messageId})`, inline: true },
                        { name: "Source Channel", value: `<#${messageChannel.id}>`, inline: true },
                        { name: "Sticky Channel", value: `<#${channel.id}>`, inline: true }
                    ])
                    .setColor("Green")
                    .setTimestamp()
            ]
        });
    }
}