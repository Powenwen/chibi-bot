import StickyMessageModel, { IStickyMessage } from "../models/StickyMessageModel";
import {
    ChannelType,
    ColorResolvable,
    EmbedBuilder,
    TextChannel,
    ClientUser
} from "discord.js";
import ChibiClient from "../structures/Client";
import Logger from "./Logger";
import { CacheManager } from "../utils/CacheManager";
import { CacheKeys } from "../constants/CacheKeys";

export default class StickyMessage {
    /**
     * Creates a new sticky message in the database.
     */
    public static async addStickyMessage(data: Partial<IStickyMessage>): Promise<IStickyMessage | null> {
        try {
            const sticky = await StickyMessageModel.create(data);
            await this.invalidateCache(data.guildID!);
            return sticky;
        } catch (error) {
            Logger.error(`Error creating sticky message: ${error}`);
            return null;
        }
    }

    /**
     * Removes a sticky message by its unique ID.
     */
    public static async removeStickyMessage(uniqueID: string): Promise<void> {
        const sticky = await StickyMessageModel.findOne({ uniqueID });
        if (sticky) {
            await StickyMessageModel.deleteOne({ uniqueID });
            await this.invalidateCache(sticky.guildID);
        }
    }

    /**
     * Gets all sticky messages for a guild.
     */
    public static async getStickyMessages(guildID: string): Promise<IStickyMessage[]> {
        return await StickyMessageModel.find({ guildID });
    }

    /**
     * Gets enabled sticky messages for a guild.
     */
    public static async getEnabledStickyMessages(guildID: string): Promise<IStickyMessage[]> {
        return await StickyMessageModel.find({ guildID, enabled: true });
    }

    /**
     * Gets a sticky message by its unique ID.
     */
    public static async getStickyMessage(uniqueID: string): Promise<IStickyMessage | null> {
        return await StickyMessageModel.findOne({ uniqueID });
    }

    /**
     * Gets a sticky message by channel ID.
     */
    public static async getStickyMessageByChannel(guildID: string, channelID: string): Promise<IStickyMessage | null> {
        return await StickyMessageModel.findOne({ guildID, channelID });
    }

    /**
     * Updates a sticky message.
     */
    public static async updateStickyMessage(uniqueID: string, data: Partial<IStickyMessage>): Promise<void> {
        const sticky = await StickyMessageModel.findOneAndUpdate({ uniqueID }, data);
        if (sticky) {
            await this.invalidateCache(sticky.guildID);
        }
    }

    /**
     * Toggles a sticky message on/off.
     */
    public static async toggleStickyMessage(uniqueID: string, enabled: boolean): Promise<IStickyMessage | null> {
        const sticky = await StickyMessageModel.findOneAndUpdate(
            { uniqueID },
            { enabled },
            { new: true }
        );
        if (sticky) {
            await this.invalidateCache(sticky.guildID);
        }
        return sticky;
    }

    /**
     * Moves a sticky message to a different channel.
     */
    public static async moveStickyMessage(uniqueID: string, newChannelID: string): Promise<IStickyMessage | null> {
        const sticky = await StickyMessageModel.findOneAndUpdate(
            { uniqueID },
            { channelID: newChannelID },
            { new: true }
        );
        if (sticky) {
            await this.invalidateCache(sticky.guildID);
        }
        return sticky;
    }

    /**
     * Builds a full embed from a sticky message config.
     */
    public static buildEmbed(config: IStickyMessage, clientUser: ClientUser): EmbedBuilder {
        const embed = new EmbedBuilder();

        if (config.title) embed.setTitle(config.title);
        if (config.content) embed.setDescription(config.content);
        if (config.description) embed.setDescription(config.description);
        embed.setColor((config.color || "#5865F2") as ColorResolvable);

        // Author
        if (config.author?.name) {
            const authorData: { name: string; iconURL?: string; url?: string } = {
                name: config.author.name
            };
            if (config.author.iconUrl) authorData.iconURL = config.author.iconUrl;
            if (config.author.url) authorData.url = config.author.url;
            embed.setAuthor(authorData);
        }

        // Thumbnail
        if (config.thumbnailUrl) {
            embed.setThumbnail(config.thumbnailUrl);
        }

        // Image
        if (config.imageUrl) {
            embed.setImage(config.imageUrl);
        }

        // Fields
        if (config.fields && config.fields.length > 0) {
            for (const field of config.fields) {
                embed.addFields({
                    name: field.name,
                    value: field.value,
                    inline: field.inline
                });
            }
        }

        // Footer
        if (config.footer?.text || config.footer?.iconUrl) {
            embed.setFooter({
                text: config.footer.text || "",
                iconURL: config.footer.iconUrl || undefined
            });
        }

        // Timestamp
        if (config.timestamp) {
            embed.setTimestamp();
        }

        return embed;
    }

    /**
     * Sends or resends a sticky message embed in its channel.
     */
    public static async sendStickyEmbed(
        config: IStickyMessage,
        client: ChibiClient
    ): Promise<string | null> {
        try {
            const guild = client.guilds.cache.get(config.guildID);
            if (!guild) return null;

            const channel = guild.channels.cache.get(config.channelID) as TextChannel;
            if (!channel?.isTextBased() || channel.type !== ChannelType.GuildText) return null;

            // Delete old embed if it exists
            if (config.embedID) {
                try {
                    const oldMsg = await channel.messages.fetch(config.embedID).catch(() => null);
                    if (oldMsg) await oldMsg.delete().catch(() => null);
                } catch {
                    // Old message already deleted
                }
            }

            // Build and send new embed
            const embed = this.buildEmbed(config, client.user as ClientUser);
            const content = config.mentionRoleID ? `<@&${config.mentionRoleID}>` : undefined;
            const sentMessage = await channel.send({ content, embeds: [embed] });

            // Update embedID in database
            await StickyMessageModel.updateOne({ uniqueID: config.uniqueID }, { embedID: sentMessage.id });

            return sentMessage.id;
        } catch (error) {
            Logger.error(`Error sending sticky embed for ${config.uniqueID}: ${error}`);
            return null;
        }
    }

    /**
     * Checks and resends sticky messages on bot startup.
     */
    public static async checkAndResendStickyMessages(client: ChibiClient): Promise<void> {
        try {
            const allStickyMessages = await StickyMessageModel.find({ enabled: true });
            Logger.info(`Checking ${allStickyMessages.length} enabled sticky messages on startup...`);

            if (!client.messageCountMap) {
                client.messageCountMap = new Map<string, number>();
            }

            for (const sticky of allStickyMessages) {
                try {
                    const guild = client.guilds.cache.get(sticky.guildID);
                    if (!guild) continue;

                    const channel = guild.channels.cache.get(sticky.channelID) as TextChannel;
                    if (!channel?.isTextBased() || channel.type !== ChannelType.GuildText) continue;

                    // Check if resend is needed
                    const needsResend = await this.checkIfNeedsResend(channel, sticky);

                    if (needsResend) {
                        await this.sendStickyEmbed(sticky, client);
                        Logger.info(`Resent sticky message ${sticky.uniqueID} in #${channel.name}`);
                    }

                    // Reset message count
                    client.messageCountMap.set(channel.id, 0);
                } catch (error) {
                    Logger.error(`Error processing sticky message ${sticky.uniqueID}: ${error}`);
                }
            }

            Logger.success("Completed sticky message startup check");
        } catch (error) {
            Logger.error(`Error during sticky message startup check: ${error}`);
        }
    }

    /**
     * Checks if a sticky message needs to be resent (not the latest message).
     */
    private static async checkIfNeedsResend(channel: TextChannel, sticky: IStickyMessage): Promise<boolean> {
        if (!sticky.embedID) return true;

        try {
            const recentMessages = await channel.messages.fetch({ limit: 5 }).catch(() => null);
            if (!recentMessages || recentMessages.size === 0) return true;
            return !recentMessages.has(sticky.embedID);
        } catch {
            return true;
        }
    }

    private static async invalidateCache(guildID: string): Promise<void> {
        const cacheManager = CacheManager.getInstance();
        await cacheManager.delete(CacheKeys.stickyMessage.all(guildID));
    }
}
