import StickyMessageModel from "../models/StickyMessageModel";
import { IStickyMessage } from "../models/StickyMessageModel";
import { ChannelType, ColorResolvable, EmbedBuilder, TextChannel } from "discord.js";
import ChibiClient from "../structures/Client";
import Logger from "./Logger";


export default class StickyMessage {

    /**
     * Add a sticky message to the database
     */
    public static async addStickyMessage(
        guildID: string,
        channelID: string,
        messageID: string,
        messageChannelID: string,
        uniqueID: string,
        authorID: string,
        title: string,
        content: string,
        color: string,
        embedID: string,
        maxMessageCount: number
    ): Promise<void> {
        try {
            await StickyMessageModel.create({
                guildID,
                channelID,
                messageID,
                messageChannelID,
                uniqueID,
                authorID,
                title,
                content,
                color,
                embedID,
                maxMessageCount,
                createdAt: new Date()
            });
        } catch (error) {
            console.error("Error creating sticky message:", error);
            try {
                await StickyMessageModel.deleteOne({ uniqueID });
            } catch (error) {
                console.error(`Failed to delete sticky message with uniqueID ${uniqueID}:`, error);
            }
        }
    }

    /**
     * Remove a sticky message from the database
     */
    public static async removeStickyMessage(uniqueID: string): Promise<void> {
        await StickyMessageModel.deleteOne({ uniqueID });
    }

    /**
     * Get all sticky messages for a guild
     */
    public static async getStickyMessages(guildID: string): Promise<IStickyMessage[]> {
        return await StickyMessageModel.find({ guildID });
    }

    /**
     * Get a sticky message by its unique ID
     */
    public static async getStickyMessage(uniqueID: string): Promise<IStickyMessage | null> {
        return await StickyMessageModel.findOne({ uniqueID });
    }

    /**
     * Update a sticky message
     */
    public static async updateStickyMessage(uniqueID: string, data: Partial<IStickyMessage>): Promise<void> {
        await StickyMessageModel.updateOne({ uniqueID }, data);
    }

    /**
     * Get a sticky message by a specific field
     * @param field The field to search by
     * @param value The value to search for
     * @returns The sticky message
     * @example
     * ```typescript
     * const stickyMessage = await StickyMessage.getStickyMessageBy("messageID", "1234567890");
     * ```
     */
    public static async getStickyMessageBy(field: keyof IStickyMessage, value: string): Promise<IStickyMessage | null> {
        return await StickyMessageModel.findOne({ [field]: value });
    }

    /**
     * Get all sticky messages by a specific field
     * @param field The field to search by
     * @param value The value to search for
     * @returns The sticky messages
     * @example
     * ```typescript
     * const stickyMessages = await StickyMessage.getStickyMessagesBy("guildID", "1234567890");
     * ```
    */
    public static async getStickyMessagesBy(field: keyof IStickyMessage, value: string): Promise<IStickyMessage[]> {
        return await StickyMessageModel.find({ [field]: value });
    }    /**
     * Check and resend sticky messages on bot startup
     * This ensures sticky messages are present even if the bot was offline
     * Only resends if the sticky message is not already the latest message
     */
    public static async checkAndResendStickyMessages(client: ChibiClient): Promise<void> {
        try {
            // Verify database connection before proceeding
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState !== 1) {
                throw new Error('Database not connected. Current state: ' + mongoose.connection.readyState);
            }

            Logger.info("Database connection verified, proceeding with sticky message check...");
            
            const allStickyMessages = await StickyMessageModel.find({}).maxTimeMS(30000); // 30 second timeout
            Logger.info(`Checking ${allStickyMessages.length} sticky messages on startup...`);

            // Initialize message count map if it doesn't exist
            if (!client.messageCountMap) {
                client.messageCountMap = new Map<string, number>();
            }

            for (const stickyMessage of allStickyMessages) {
                try {
                    const guild = client.guilds.cache.get(stickyMessage.guildID);
                    if (!guild) {
                        Logger.warn(`Guild ${stickyMessage.guildID} not found for sticky message ${stickyMessage.uniqueID}`);
                        continue;
                    }

                    const channel = guild.channels.cache.get(stickyMessage.channelID) as TextChannel;
                    if (!channel?.isTextBased() || channel.type !== ChannelType.GuildText) {
                        Logger.warn(`Channel ${stickyMessage.channelID} not found or not a text channel for sticky message ${stickyMessage.uniqueID}`);
                        continue;
                    }
                    
                    // Check if sticky message needs to be resent
                    const needsResend = await this.checkIfStickyMessageNeedsResend(channel, stickyMessage);
                    
                    if (needsResend) {
                        // Delete the existing sticky message if it exists
                        if (stickyMessage.embedID) {
                            try {
                                const existingMessage = await channel.messages.fetch(stickyMessage.embedID).catch(() => null);
                                if (existingMessage) {
                                    await existingMessage.delete().catch(err => 
                                        Logger.warn(`Could not delete existing sticky message ${stickyMessage.embedID}: ${err}`)
                                    );
                                }
                            } catch (error) {
                                Logger.warn(`Error fetching existing sticky message ${stickyMessage.embedID}: ${error}`);
                            }
                        }
                        
                        // Send a new sticky message
                        const embed = new EmbedBuilder()
                            .setTitle(stickyMessage.title)
                            .setDescription(stickyMessage.content)
                            .setColor(stickyMessage.color as ColorResolvable)
                            .setThumbnail(client.user?.displayAvatarURL() || null);

                        const sentMessage = await channel.send({ embeds: [embed] });
                        await stickyMessage.updateOne({ embedID: sentMessage.id });
                        Logger.success(`Resent sticky message ${stickyMessage.uniqueID} in channel ${channel.name} (${channel.id})`);
                    } else {
                        Logger.info(`Sticky message ${stickyMessage.uniqueID} is already at the bottom of channel ${channel.name}, skipping resend`);
                    }

                    // Reset message count for this channel
                    client.messageCountMap.set(channel.id, 0);

                } catch (error) {
                    Logger.error(`Error processing sticky message ${stickyMessage.uniqueID}: ${error}`);
                }
            }

            Logger.success("Completed sticky message startup check");
        } catch (error) {
            Logger.error(`Error during sticky message startup check: ${error}`);
            
            // Provide more specific error information
            if (error instanceof Error) {
                if (error.message.includes('buffering timed out')) {
                    Logger.error("MongoDB operation timed out. This usually indicates a connection issue.");
                    Logger.error("Please verify your MONGO_URI environment variable and ensure MongoDB is running.");
                } else if (error.message.includes('not connected')) {
                    Logger.error("Database connection not established. Retrying connection may be needed.");
                }
            }
            
            throw error; // Re-throw to allow caller to handle
        }
    }

    /**
     * Check if a sticky message needs to be resent
     * Returns true if the sticky message is not the latest message in the channel
     */
    private static async checkIfStickyMessageNeedsResend(channel: TextChannel, stickyMessage: IStickyMessage): Promise<boolean> {
        try {
            // If there's no embedID, we definitely need to send it
            if (!stickyMessage.embedID) {
                Logger.debug(`Sticky message ${stickyMessage.uniqueID} has no embedID, needs resend`);
                return true;
            }

            // Fetch recent messages from the channel (limit to 10 to avoid unnecessary API calls)
            const recentMessages = await channel.messages.fetch({ limit: 10 }).catch(() => null);
            if (!recentMessages || recentMessages.size === 0) {
                Logger.debug(`Could not fetch recent messages for channel ${channel.id}, assuming resend needed`);
                return true;
            }

            // Check if the sticky message exists in recent messages
            const stickyMessageExists = recentMessages.has(stickyMessage.embedID);
            if (!stickyMessageExists) {
                Logger.debug(`Sticky message ${stickyMessage.uniqueID} not found in recent messages, needs resend`);
                return true;
            }

            // Get the latest message in the channel
            const latestMessage = recentMessages.first();
            if (!latestMessage) {
                Logger.debug(`No latest message found in channel ${channel.id}, assuming resend needed`);
                return true;
            }

            // Check if the sticky message is the latest message
            const isStickyMessageLatest = latestMessage.id === stickyMessage.embedID;
            if (!isStickyMessageLatest) {
                Logger.debug(`Sticky message ${stickyMessage.uniqueID} is not the latest message, needs resend`);
                return true;
            }

            // Check how many non-bot messages have been sent since the sticky message
            const messagesAfterSticky = recentMessages.filter(msg => 
                msg.createdTimestamp > latestMessage.createdTimestamp && !msg.author.bot
            );

            // If there are messages after the sticky message, it needs to be resent
            if (messagesAfterSticky.size > 0) {
                Logger.debug(`Found ${messagesAfterSticky.size} messages after sticky message ${stickyMessage.uniqueID}, needs resend`);
                return true;
            }

            // Sticky message is at the bottom and no new messages after it
            return false;

        } catch (error) {
            Logger.warn(`Error checking if sticky message needs resend: ${error}`);
            // If we can't determine, err on the side of caution and resend
            return true;
        }
    }
}