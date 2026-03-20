import { Message, TextChannel, EmbedBuilder, ColorResolvable } from "discord.js";
import ChibiClient from "../../structures/Client";
import { BaseLegacyCommand } from "../../interfaces";

export default <BaseLegacyCommand>{
    name: "announce",
    aliases: ["ann"],
    config: {
        category: "dev",
        usage: "<channel> <messageID> [color|--raw]",
        examples: [
            "#general 1234567890123456789",
            "#announcements 1234567890123456789 #ff0000",
            "1234567890123456789 1234567890123456789 blue",
            "#general 1234567890123456789 --raw"
        ],
        permissions: ["Administrator"]
    },
    async execute(_client: ChibiClient, message: Message, args: string[]) {
        if (args.length < 2) {
            await message.reply({
                content: "❌ **Usage:** `c!announce <channel> <messageID> [color|--raw]`\n" +
                        "• **Channel:** Channel mention, ID, or name\n" +
                        "• **MessageID:** ID of the message to announce\n" +
                        "• **Color:** Optional embed color (hex, name, or default)\n" +
                        "• **--raw:** Send as raw message instead of embed\n\n" +
                        "**Examples:**\n" +
                        "• `c!announce #general 1234567890123456789`\n" +
                        "• `c!announce announcements 1234567890123456789 #ff0000`\n" +
                        "• `c!announce general 1234567890123456789 --raw`\n" +
                        "• `c!announce #general 1234567890123456789 blue`"
            });
            return;
        }

        let targetChannel: TextChannel | null = null;
        let messageID: string;
        let embedColor: ColorResolvable = "#5865F2"; // Discord blurple default
        let useRawMessage = false;

        // Parse arguments
        const channelArg = args[0];
        messageID = args[1];
        const colorArg = args[2];

        // Check for --raw flag
        if (colorArg === '--raw' || colorArg === 'raw') {
            useRawMessage = true;
        }

        // Parse channel argument
        if (channelArg.startsWith('<#') && channelArg.endsWith('>')) {
            // Channel mention format <#123456789>
            const channelId = channelArg.slice(2, -1);
            targetChannel = message.guild!.channels.cache.get(channelId) as TextChannel;
        } else if (/^\d+$/.test(channelArg)) {
            // Channel ID format
            targetChannel = message.guild!.channels.cache.get(channelArg) as TextChannel;
        } else {
            // Channel name format
            targetChannel = message.guild!.channels.cache.find(ch => 
                ch.name.toLowerCase() === channelArg.toLowerCase().replace('#', '')
            ) as TextChannel;
        }

        if (!targetChannel || !targetChannel.isTextBased()) {
            await message.reply("❌ Invalid channel! Please provide a valid channel mention, ID, or name.");
            return;
        }

        // Validate message ID format
        if (!/^\d{17,19}$/.test(messageID)) {
            await message.reply("❌ Invalid message ID! Please provide a valid Discord message ID (17-19 digits).");
            return;
        }

        // Parse color argument (only if not using raw mode)
        if (colorArg && !useRawMessage) {
            if (colorArg.startsWith('#')) {
                embedColor = colorArg as ColorResolvable;
            } else if (/^[0-9a-fA-F]{6}$/.test(colorArg)) {
                embedColor = `#${colorArg}` as ColorResolvable;
            } else {
                // Try to use it as a named color
                embedColor = colorArg as ColorResolvable;
            }
        }

        try {
            // Try to fetch the message from the current channel first
            let sourceMessage: Message | null = null;
            
            try {
                sourceMessage = await message.channel.messages.fetch(messageID);
            } catch {
                // If not found in current channel, search other channels in the guild
                const channels = message.guild!.channels.cache.filter(ch => ch.isTextBased()) as any;
                
                for (const [, channel] of channels) {
                    try {
                        sourceMessage = await channel.messages.fetch(messageID);
                        break;
                    } catch {
                        continue;
                    }
                }
            }

            if (!sourceMessage) {
                await message.reply("❌ Message not found! Make sure the message ID is correct and the bot has access to the channel containing the message.");
                return;
            }

            if (useRawMessage) {
                // Send raw message content
                let announcementContent = "";
                
                // Add announcement header with author info
                announcementContent += `📢 **Announcement** (Originally posted by ${sourceMessage.author.tag})\n`;
                // announcementContent += `Source: <#${sourceMessage.channel.id}> | [Jump to Original](${sourceMessage.url})\n`;
                announcementContent += "─────────────────────────────────────\n";
                
                // Add the original message content
                if (sourceMessage.content) {
                    announcementContent += sourceMessage.content;
                } else if (sourceMessage.embeds.length > 0) {
                    // If no text content but has embeds, try to extract embed content
                    const originalEmbed = sourceMessage.embeds[0];
                    if (originalEmbed.title) {
                        announcementContent += `**${originalEmbed.title}**\n`;
                    }
                    if (originalEmbed.description) {
                        announcementContent += originalEmbed.description;
                    }
                } else {
                    announcementContent += "*[Original message contained media or other content]*";
                }

                // Handle attachments
                if (sourceMessage.attachments.size > 0) {
                    announcementContent += "\n\n📎 **Attachments:**\n";
                    sourceMessage.attachments.forEach(attachment => {
                        announcementContent += `• [${attachment.name}](${attachment.url})\n`;
                    });
                }

                // Send the raw announcement
                await targetChannel.send({
                    content: announcementContent,
                    // Forward any embeds from the original message
                    embeds: sourceMessage.embeds.length > 0 ? sourceMessage.embeds : undefined,
                    // Forward any files if they're still accessible
                    files: sourceMessage.attachments.size > 0 ? 
                        Array.from(sourceMessage.attachments.values()).map(att => att.url) : undefined
                });

                // Send confirmation to the command user
                await message.reply(`✅ Successfully announced raw message to ${targetChannel}!`);

            } else {
                // Create announcement embed (original behavior)
                const embed = new EmbedBuilder()
                    .setColor(embedColor)
                    .setTimestamp()
                    .setFooter({ 
                        text: `Announced by ${message.author.tag}`, 
                        iconURL: message.author.displayAvatarURL() 
                    });

                // Add message content
                if (sourceMessage.content) {
                    embed.setDescription(sourceMessage.content);
                }

                // Add author information
                embed.setAuthor({
                    name: sourceMessage.author.tag,
                    iconURL: sourceMessage.author.displayAvatarURL()
                });

                // Add original message link
                embed.addFields({
                    name: "📎 Original Message",
                    value: `[Jump to Message](${sourceMessage.url})`,
                    inline: true
                });

                // Add channel information
                embed.addFields({
                    name: "📍 Source Channel",
                    value: `<#${sourceMessage.channel.id}>`,
                    inline: true
                });

                // Handle attachments
                if (sourceMessage.attachments.size > 0) {
                    const attachment = sourceMessage.attachments.first();
                    if (attachment && attachment.contentType?.startsWith('image/')) {
                        embed.setImage(attachment.url);
                    } else if (attachment) {
                        embed.addFields({
                            name: "📎 Attachment",
                            value: `[${attachment.name}](${attachment.url})`,
                            inline: false
                        });
                    }
                }

                // Handle embeds from original message
                if (sourceMessage.embeds.length > 0) {
                    const originalEmbed = sourceMessage.embeds[0];
                    if (originalEmbed.title || originalEmbed.description) {
                        embed.addFields({
                            name: "📋 Original Embed Content",
                            value: `**Title:** ${originalEmbed.title || "None"}\n**Description:** ${originalEmbed.description?.slice(0, 200) || "None"}${originalEmbed.description && originalEmbed.description.length > 200 ? "..." : ""}`,
                            inline: false
                        });
                    }
                }

                // Send the announcement
                await targetChannel.send({ 
                    content: "📢 **Announcement**",
                    embeds: [embed] 
                });

                // Send confirmation to the command user
                await message.reply(`✅ Successfully announced message to ${targetChannel}!`);
            }

            // Delete the original command message for cleaner output
            await message.delete().catch(() => null);

        } catch (error) {
            console.error("Error in announce command:", error);
            await message.reply("❌ An error occurred while trying to announce the message. Please check the message ID and try again.");
        }
    }
};