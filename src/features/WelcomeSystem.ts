import { CommandInteraction, GuildMember } from "discord.js";
import WelcomeSystemModel from "../models/WelcomeSystemModel";
import { IWelcomeSystem } from "../shared/types";
import { ErrorHandler } from "../utils/ErrorHandler";
import Logger from "./Logger";

type WelcomeMessageField = "channelID" | "title" | "description" | "color" | "thumbnail" | "footer.text" | "footer.timestamp" | "footer.enabled";

export default class WelcomeSystem {
    private static readonly CACHE_TTL = 300; // 5 minutes
    private static cache = new Map<string, { data: IWelcomeSystem; expires: number }>();

    /**
     * Add a welcome message to the database with validation
     */
    public static async addWelcomeMessage(
        guildID: string,
        channelID: string
    ): Promise<boolean | null> {
        return ErrorHandler.handleAsyncOperation(async () => {
            // Check if welcome message already exists
            const existing = await WelcomeSystemModel.findOne({ guildID });
            if (existing) {
                Logger.warn(`Welcome message already exists for guild ${guildID}`);
                return false;
            }

            await WelcomeSystemModel.create({
                guildID,
                channelID,
                embed: {
                    title: "Welcome to {server}!",
                    description: "Welcome {user} to our amazing server! You are member #{memberCount}.",
                    color: "#0099ff",
                    thumbnail: true,
                    footer: {
                        enabled: true,
                        text: "Welcome System",
                        timestamp: true
                    }
                }
            });

            this.invalidateCache(guildID);
            Logger.info(`Welcome message created for guild ${guildID}`);
            return true;
        }, 'addWelcomeMessage') ?? false;
    }

    /**
     * Edits a welcome message in the database with validation
     */
    public static async editWelcomeMessage(
        field: WelcomeMessageField, 
        value: string | boolean, 
        guildID: string
    ): Promise<boolean | null> {
        return ErrorHandler.handleAsyncOperation(async () => {
            // Validate boolean fields
            if (field === "footer.enabled" || field === "footer.timestamp" || field === "thumbnail") {
                value = typeof value === 'string' ? value === "true" : value;
            }

            // Build the correct update query
            let updateQuery: any = {};
            if (field === "channelID") {
                updateQuery.channelID = value;
            } else {
                updateQuery[`embed.${field}`] = value;
            }

            const result = await WelcomeSystemModel.updateOne({ guildID }, updateQuery);
            
            if (result.matchedCount === 0) {
                Logger.warn(`No welcome message found for guild ${guildID}`);
                return false;
            }

            this.invalidateCache(guildID);
            return true;
        }, 'editWelcomeMessage') ?? false;
    }

    /**
     * Remove a welcome message from the database
     */
    public static async removeWelcomeMessage(guildID: string): Promise<void> {
        await WelcomeSystemModel.deleteOne({ guildID });
    }

    /**
     * Get all welcome messages
     */
    public static async getWelcomeMessages(): Promise<IWelcomeSystem[]> {
        return await WelcomeSystemModel.find();
    }

    /**
     * Get a welcome message by guild ID with caching
     */
    public static async getWelcomeMessage(guildID: string): Promise<IWelcomeSystem | null> {
        // Check cache first
        const cached = this.cache.get(guildID);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }

        // Get from database
        const result = await ErrorHandler.handleAsyncOperation(async () => {
            const welcomeMessage = await WelcomeSystemModel.findOne({ guildID });
            
            if (welcomeMessage) {
                // Transform the database document to match the shared interface
                const transformedMessage: IWelcomeSystem = {
                    guildID: welcomeMessage.guildID,
                    channelID: welcomeMessage.channelID,
                    embed: {
                        title: welcomeMessage.embed.title,
                        description: welcomeMessage.embed.description,
                        color: welcomeMessage.embed.color,
                        thumbnail: welcomeMessage.embed.thumbnail,
                        footer: {
                            enabled: welcomeMessage.embed.footer.enabled,
                            text: welcomeMessage.embed.footer.text,
                            timestamp: welcomeMessage.embed.footer.timestamp
                        }
                    }
                };

                // Cache the result
                this.cache.set(guildID, {
                    data: transformedMessage,
                    expires: Date.now() + (this.CACHE_TTL * 1000)
                });
                
                return transformedMessage;
            }
            
            return null;
        }, 'getWelcomeMessage');

        return result;
    }

    /**
     * Parse Welcome Description with enhanced placeholder support
     */
    public static parseWelcomeDescription(
        description: string, 
        target: CommandInteraction | GuildMember
    ): string {
        try {
            const replacements = this.getReplacements(target);
            
            let parsed = description;
            for (const [placeholder, value] of Object.entries(replacements)) {
                parsed = parsed.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
            }
            
            return parsed;
        } catch (error) {
            Logger.error(`Error parsing welcome description: ${error}`);
            return description; // Return original if parsing fails
        }
    }

    private static getReplacements(target: CommandInteraction | GuildMember): Record<string, string> {
        if (target instanceof CommandInteraction) {
            const member = target.member as GuildMember;
            return {
                user: target.user.toString(),
                server: target.guild!.name,
                memberCount: target.guild!.memberCount.toString(),
                username: target.user.username,
                dateJoined: member?.joinedAt?.toLocaleDateString() || "Unknown"
            };
        } else {
            return {
                user: target.toString(),
                server: target.guild.name,
                memberCount: target.guild.memberCount.toString(),
                username: target.user.username,
                dateJoined: target.joinedAt?.toLocaleDateString() || "Unknown"
            };
        }
    }

    private static invalidateCache(guildID: string): void {
        this.cache.delete(guildID);
    }
}