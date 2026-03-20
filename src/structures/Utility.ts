import { ChannelType, TextChannel, Message } from "discord.js";
import ChibiClient from "./Client";
import Logger from "../features/Logger";
import { ErrorHandler } from "../utils/ErrorHandler";

/**
 * Utility class with various helper methods.
 */
export default class Utility {
    /**
     * Asynchronously sleeps for the specified number of milliseconds.
     * @param ms - The number of milliseconds to sleep.
     * @returns A Promise that resolves after the specified time.
     */
    public static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public static formatDuration(duration: number): string {
        const seconds = Math.floor((duration / 1000) % 60);
        const minutes = Math.floor((duration / 1000 / 60) % 60);
        const hours = Math.floor((duration / 1000 / 60 / 60) % 24);
        const days = Math.floor(duration / 1000 / 60 / 60 / 24);

        const parts: string[] = [];
        if (days) parts.push(`${days}d`);
        if (hours) parts.push(`${hours}h`);
        if (minutes) parts.push(`${minutes}m`);
        if (seconds) parts.push(`${seconds}s`);

        return parts.join(" ") || "0s";
    }

    public static parseDuration(duration: string): number | null {
        const regex = /^(\d+)([smhd])$/i;
        const match = duration.match(regex);

        if (!match) return null;

        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();

        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return null;
        }
    }

    /**
     * Capitalizes the first letter of a string.
     * @param str - The string to capitalize.
     * @returns The capitalized string.
     */
    public static capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Generates a UUID (Universally Unique Identifier) string.
     * @returns The generated UUID string.
     */
    public static uuid(): string {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0,
                v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * Generates a random code with the specified length.
     * @param length - The length of the code to generate.
     * @returns The generated code.
     * @example
     * Utility.codeGen(6);
        */
    public static codeGen(length: number): string {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        return Array.from({ length }, () => 
            characters.charAt(Math.floor(Math.random() * characters.length))
        ).join("");
    }

    /**
     * Validates and retrieves a TextChannel object based on the provided channel ID.
     * @param channelID - The ID of the channel to retrieve.
     * @param client - The ChibiClient instance.
     * @returns A Promise that resolves to a TextChannel object or null if not found.
     */
    public static async getChannel(channelID: string, client: ChibiClient): Promise<TextChannel | null> {
        try {
            const channel = client.channels.cache.get(channelID);
            
            if (!channel) {
                Logger.warn(`Channel ${channelID} not found in cache`);
                return null;
            }
            
            if (channel.type !== ChannelType.GuildText) {
                Logger.warn(`Channel ${channelID} is not a text channel`);
                return null;
            }
            
            return channel as TextChannel;
        } catch (error) {
            await ErrorHandler.handle(error as Error, undefined, 'getChannel');
            return null;
        }
    }

    /**
     * Safely retrieves a message object based on the provided channel and message IDs.
     * @param client - The ChibiClient instance.
     * @param channelID - The ID of the channel to retrieve the message from.
     * @param messageID - The ID of the message to retrieve.
     * @returns A Promise that resolves to a message object or null if not found.
     */
    public static async getMessage(client: ChibiClient, channelID: string, messageID: string): Promise<Message | null> {
        return ErrorHandler.handleAsyncOperation(async () => {
            const channel = await this.getChannel(channelID, client);
            if (!channel) return null;
            
            return await channel.messages.fetch(messageID);
        }, 'getMessage');
    }

    /**
     * Validates if a string is a valid Discord snowflake ID
     * @param id - The ID to validate
     * @returns boolean indicating if the ID is valid
     */
    public static isValidSnowflake(id: string): boolean {
        return /^\d{17,19}$/.test(id);
    }

    /**
     * Sanitizes user input to prevent potential security issues
     * @param input - The input to sanitize
     * @returns Sanitized string
     */
    public static sanitizeInput(input: string): string {
        return input
            .replace(/[<>]/g, '') // Remove potential HTML/mention injection
            .slice(0, 2000); // Discord message limit
    }

    /**
     * Formats a timestamp for consistent display
     * @param date - The date to format
     * @returns Formatted timestamp string
     */
    public static formatTimestamp(date: Date = new Date()): string {
        return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
    }

    /**
     * Filters and limits autocomplete choices for Discord interactions
     * @param choices - Array of choice strings
     * @param focused - The current focused/typed value
     * @param limit - Maximum number of choices (default: 25, Discord's limit)
     * @returns Filtered and limited array of autocomplete choices
     */
    public static filterAutocompleteChoices(
        choices: string[],
        focused: string,
        limit: number = 25
    ): { name: string; value: string }[] {
        const lowerFocused = focused.toLowerCase();
        
        // If no input, return first 25 sorted alphabetically
        if (!focused) {
            return choices
                .sort((a, b) => a.localeCompare(b))
                .slice(0, limit)
                .map(c => ({ name: c, value: c }));
        }
        
        // Prioritize exact matches, then starts with, then includes
        const exactMatch = choices.filter(c => c.toLowerCase() === lowerFocused);
        const startsWith = choices.filter(c => 
            c.toLowerCase().startsWith(lowerFocused) && c.toLowerCase() !== lowerFocused
        );
        const includes = choices.filter(c => 
            c.toLowerCase().includes(lowerFocused) && 
            !c.toLowerCase().startsWith(lowerFocused) &&
            c.toLowerCase() !== lowerFocused
        );
        
        // Combine and sort within each group
        const filtered = [
            ...exactMatch.sort((a, b) => a.localeCompare(b)),
            ...startsWith.sort((a, b) => a.localeCompare(b)),
            ...includes.sort((a, b) => a.localeCompare(b))
        ];
        
        // Limit to specified number
        return filtered
            .slice(0, limit)
            .map(c => ({ name: c, value: c }));
    }
}