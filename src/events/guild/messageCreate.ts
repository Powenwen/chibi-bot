import { BaseEvent } from "../../interfaces";
import Logger from "../../features/Logger";
import { ChannelType, ClientUser, ColorResolvable, EmbedBuilder, Message } from "discord.js";
import ChibiClient from "../../structures/Client";
import StickyMessage from "../../features/StickyMessage";
import AutoReactionModel from "../../models/AutoReactionModel";
import AutoResponderModel from "../../models/AutoResponderModel";
import AutoModerationManager from "../../features/AutoModerationManager";
import { ErrorHandler } from "../../utils/ErrorHandler";
import { CacheManager } from "../../utils/CacheManager";
import { CacheKeys } from "../../constants/CacheKeys";

// Cooldown tracking for auto-responders (guildID:channelID -> last trigger timestamp)
const responderCooldowns = new Map<string, number>();

const processMessage = async (client: ChibiClient, message: Message) => {
    // Check for legacy commands first (dev commands only)
    const prefix = process.env.PREFIX || 'c!';
    if (message.content.startsWith(prefix)) {
        await client.getLegacyCommandHandler().handleMessage(message);
        return;
    }

    // Run auto-moderation checks using the centralized manager
    const moderationTriggered = await AutoModerationManager.processMessage(message);
    if (moderationTriggered) return;

    const guildId = message.guild!.id;
    const channelId = message.channel.id;
    const cacheManager = CacheManager.getInstance();

    // Fetch data with caching
    const [stickyMessage, autoReaction, autoResponders] = await Promise.all([
        StickyMessage.getStickyMessageByChannel(guildId, channelId),
        getCachedAutoReaction(cacheManager, guildId, channelId),
        getCachedAutoResponders(cacheManager, guildId, channelId)
    ]);

    await Promise.all([
        stickyMessage && handleStickyMessage(client, message, stickyMessage),
        autoReaction && handleAutoReaction(message, autoReaction),
        autoResponders.length > 0 && handleAutoResponders(message, autoResponders)
    ]);
};

/**
 * Fetches auto-reaction config with Redis caching.
 */
async function getCachedAutoReaction(cacheManager: CacheManager, guildId: string, channelId: string) {
    const key = CacheKeys.autoReaction.channel(guildId, channelId);
    const cached = await cacheManager.get<any>(key);
    if (cached) return cached;

    const result = await AutoReactionModel.findOne({ guildID: guildId, channelID: channelId });
    if (result) {
        await cacheManager.set(key, result, 300);
    }
    return result;
}

/**
 * Fetches auto-responder configs with Redis caching.
 */
async function getCachedAutoResponders(cacheManager: CacheManager, guildId: string, channelId: string) {
    const key = CacheKeys.autoResponder.channel(guildId, channelId);
    const cached = await cacheManager.get<any[]>(key);
    if (cached) return cached;

    const results = await AutoResponderModel.find({ guildID: guildId, channelID: channelId });
    if (results.length > 0) {
        await cacheManager.set(key, results, 300);
    }
    return results;
}

const handleStickyMessage = async (client: ChibiClient, message: Message, sticky: any) => {
    if (!sticky || !sticky.enabled) return;

    const messageCountMap = client.messageCountMap || new Map<string, number>();
    const channel = message.guild!.channels.cache.get(sticky.channelID);
    if (!channel?.isTextBased() || channel.type !== ChannelType.GuildText) return;

    const currentCount = (messageCountMap.get(channel.id) || 0) + 1;
    const shouldRepost = sticky.mode === "persistent" || sticky.maxMessageCount === 0 || currentCount >= sticky.maxMessageCount;

    if (shouldRepost) {
        // Delete previous sticky message if it exists
        if (sticky.embedID) {
            const oldMessage = await channel.messages.fetch(sticky.embedID).catch(() => null);
            await oldMessage?.delete().catch(() => null);
        }

        // Build and send new sticky embed
        const embed = StickyMessage.buildEmbed(sticky, client.user as ClientUser);
        const content = sticky.mentionRoleID ? `<@&${sticky.mentionRoleID}>` : undefined;
        const msg = await channel.send({ content, embeds: [embed] });
        await StickyMessage.updateStickyMessage(sticky.uniqueID, { embedID: msg.id });
        messageCountMap.set(channel.id, 0);
    } else {
        messageCountMap.set(channel.id, currentCount);
    }

    client.messageCountMap = messageCountMap;
};

const handleAutoReaction = async (message: Message, autoReaction: any) => {
    try {
        // Check ignoreBots setting
        if (autoReaction.ignoreBots !== false && message.author.bot) return;

        const emojis = autoReaction.emojis;
        if (!emojis || emojis.length === 0) return;

        for (const emoji of emojis) {
            try {
                let emojiToReact;

                if (typeof emoji === 'string') {
                    emojiToReact = emoji;
                } else if (emoji.raw) {
                    if (emoji.isUnicode) {
                        emojiToReact = emoji.raw;
                    } else {
                        const guildEmoji = message.guild!.emojis.cache.get(emoji.emojiID);
                        emojiToReact = guildEmoji || emoji.raw;
                    }
                }

                if (emojiToReact) {
                    await message.react(emojiToReact);
                    // Small delay between reactions to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 250));
                }
            } catch (error) {
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
        const useRegex = autoResponder.useRegex;
        const useEmbed = autoResponder.useEmbed;
        const embedTitle = autoResponder.embedTitle;
        const embedColor = autoResponder.embedColor || "#5865F2";
        const cooldown = autoResponder.cooldown || 0;
        const responseDelay = autoResponder.responseDelay || 0;
        const suppressMentions = autoResponder.suppressMentions !== false;

        // Check cooldown
        if (cooldown > 0) {
            const cooldownKey = `${message.guild!.id}:${message.channel.id}:${trigger}`;
            const lastTriggered = responderCooldowns.get(cooldownKey) || 0;
            const now = Date.now();
            if (now - lastTriggered < cooldown * 1000) {
                return; // Still on cooldown
            }
            responderCooldowns.set(cooldownKey, now);

            // Clean up old cooldown entries periodically
            if (responderCooldowns.size > 10000) {
                const cutoff = now - 3600000; // 1 hour
                for (const [key, time] of responderCooldowns) {
                    if (time < cutoff) responderCooldowns.delete(key);
                }
            }
        }

        let shouldRespond = false;

        if (useRegex) {
            // Regex matching mode
            try {
                const flags = caseSensitive ? 'g' : 'gi';
                const regex = new RegExp(trigger, flags);
                shouldRespond = regex.test(messageContent);
            } catch {
                Logger.warn(`Invalid regex pattern in auto-responder: ${trigger}`);
                return;
            }
        } else if (exactMatch) {
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

        if (!shouldRespond) return;

        // Apply response delay if configured
        if (responseDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, responseDelay));
        }

        // Build allowed mentions
        const allowedMentions = suppressMentions
            ? { parse: [] }
            : undefined;

        if (useEmbed) {
            const embed = new EmbedBuilder()
                .setDescription(response)
                .setColor(embedColor as ColorResolvable);

            if (embedTitle) {
                embed.setTitle(embedTitle);
            }

            await message.reply({ embeds: [embed], allowedMentions });
        } else {
            await message.reply({ content: response, allowedMentions });
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