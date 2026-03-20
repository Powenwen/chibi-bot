import { BaseEvent } from "../../interfaces";
import Logger from "../../features/Logger";
import { ChannelType, ClientUser, ColorResolvable, EmbedBuilder, Message } from "discord.js";
import ChibiClient from "../../structures/Client";
import StickyMessageModel from "../../models/StickyMessageModel";
import AutoReactionModel from "../../models/AutoReactionModel";
import AutoResponderModel from "../../models/AutoResponderModel";
import AutoModerationManager from "../../features/AutoModerationManager";
import { ErrorHandler } from "../../utils/ErrorHandler";

const processMessage = async (client: ChibiClient, message: Message) => {
    // Check for legacy commands first (dev commands only)
    const prefix = process.env.PREFIX || 'c!';
    if (message.content.startsWith(prefix)) {
        await client.getLegacyCommandHandler().handleMessage(message);
        return; // Don't process further if it's a command
    }

    // Run auto-moderation checks using the centralized manager
    const moderationTriggered = await AutoModerationManager.processMessage(message);

    // If auto-moderation was triggered and deleted the message, don't proceed
    if (moderationTriggered) {
        return;
    }

    // Continue with regular message handling
    const [stickyMessage, autoReaction, autoResponders] = await Promise.all([
        StickyMessageModel.findOne({ guildID: message.guild!.id, channelID: message.channel.id }),
        AutoReactionModel.findOne({ guildID: message.guild!.id, channelID: message.channel.id }),
        AutoResponderModel.find({ guildID: message.guild!.id, channelID: message.channel.id })
    ]);

    await Promise.all([
        stickyMessage && handleStickyMessage(client, message, stickyMessage),
        autoReaction && handleAutoReaction(message, autoReaction),
        autoResponders.length > 0 && handleAutoResponders(message, autoResponders)
    ]);
};

const handleStickyMessage = async (client: ChibiClient, message: Message, stickyMessage: any) => {
    const messageCountMap = client.messageCountMap || new Map<string, number>();
    const embed = new EmbedBuilder()
        .setTitle(stickyMessage.title)
        .setDescription(stickyMessage.content)
        .setColor(stickyMessage.color as ColorResolvable)
        .setThumbnail((client.user as ClientUser).displayAvatarURL());

    const channel = message.guild!.channels.cache.get(stickyMessage.channelID);
    if (!channel?.isTextBased() || channel.type !== ChannelType.GuildText) return;

    const currentCount = (messageCountMap.get(channel.id) || 0) + 1;

    if (stickyMessage.maxMessageCount === 0 || currentCount >= stickyMessage.maxMessageCount) {
        // Delete previous sticky message if it exists
        if (stickyMessage.embedID) {
            const oldMessage = await channel.messages.fetch(stickyMessage.embedID).catch(() => null);
            await oldMessage?.delete().catch(() => null);
        }

        const msg = await channel.send({ embeds: [embed] });
        await stickyMessage.updateOne({ embedID: msg.id });
        messageCountMap.set(channel.id, 0);
    } else {
        messageCountMap.set(channel.id, currentCount);
    }

    client.messageCountMap = messageCountMap;
};

const handleAutoReaction = async (message: Message, autoReaction: any) => {
    try {
        const emojis = autoReaction.emojis;
        
        // Handle both old format (string array) and new format (emoji objects)
        for (const emoji of emojis) {
            try {
                let emojiToReact;
                
                if (typeof emoji === 'string') {
                    // Old format: direct string
                    emojiToReact = emoji;
                } else if (emoji.raw) {
                    // New format: emoji object with raw property
                    if (emoji.isUnicode) {
                        emojiToReact = emoji.raw;
                    } else {
                        // Custom emoji - check if it exists in the guild
                        const guildEmoji = message.guild!.emojis.cache.get(emoji.emojiID);
                        emojiToReact = guildEmoji || emoji.raw;
                    }
                }
                
                if (emojiToReact) {
                    await message.react(emojiToReact);
                    // Small delay between reactions to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                // Log but don't fail the entire process for one emoji
                Logger.debug(`Failed to react with emoji in ${message.guild!.id}: ${error}`);
            }
        }
    } catch (error) {
        Logger.error(`Error in auto reaction handler: ${error}`);
    }
};

const handleAutoResponder = async (message: Message, autoResponder: any) => {
    try {
        const messageContent = message.content;
        const trigger = autoResponder.trigger;
        const response = autoResponder.response;
        const caseSensitive = autoResponder.caseSensitive;
        const exactMatch = autoResponder.exactMatch;
        const useEmbed = autoResponder.useEmbed;
        const embedTitle = autoResponder.embedTitle;
        const embedColor = autoResponder.embedColor || "#5865F2";

        let shouldRespond = false;

        if (exactMatch) {
            // Exact match mode
            if (caseSensitive) {
                shouldRespond = messageContent === trigger;
            } else {
                shouldRespond = messageContent.toLowerCase() === trigger.toLowerCase();
            }
        } else {
            // Contains mode
            if (caseSensitive) {
                shouldRespond = messageContent.includes(trigger);
            } else {
                shouldRespond = messageContent.toLowerCase().includes(trigger.toLowerCase());
            }
        }

        if (shouldRespond) {
            if (useEmbed) {
                // Send as embed
                const embed = new EmbedBuilder()
                    .setDescription(response)
                    .setColor(embedColor as ColorResolvable);
                
                if (embedTitle) {
                    embed.setTitle(embedTitle);
                }
                
                await message.reply({ embeds: [embed] });
            } else {
                // Send as plain text
                await message.reply(response);
            }
        }
    } catch (error) {
        Logger.error(`Error in auto responder handler: ${error}`);
    }
};

const handleAutoResponders = async (message: Message, autoResponders: any[]) => {
    try {
        // Process all auto responders for this channel
        for (const autoResponder of autoResponders) {
            await handleAutoResponder(message, autoResponder);
        }
    } catch (error) {
        Logger.error(`Error in auto responders handler: ${error}`);
    }
};

export default <BaseEvent>{
    name: "messageCreate",
    async execute(client: ChibiClient, message: Message) {
        if (!message.guild || 
            !message.channel.isTextBased() || 
            message.channel.type !== ChannelType.GuildText || 
            message.author.bot) return;

        await ErrorHandler.handleAsyncOperation(
            () => processMessage(client, message),
            'message-processing',
            undefined
        );
    }
};