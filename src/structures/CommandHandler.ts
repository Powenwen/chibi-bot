import { readdirSync } from "fs";
import { join } from "path";
import { BaseCommand } from "../interfaces";
import ChibiClient from "./Client";

import { REST, Routes, RESTGetAPIApplicationCommandsResult } from "discord.js";
import Logger from "../features/Logger";

/**
 * Represents a command handler that loads and registers commands for a Discord bot.
 */
export default class CommandHandler {
    /**
     * Creates a new instance of the CommandHandler class.
     * @param client The Discord bot client.
     */
    constructor(private client: ChibiClient) {}

    /**
     * Loads all the commands from the command folders and adds them to the client's command collection.
     */
    public loadCommands(): void {
        const commandFolders = readdirSync(join(__dirname, "..", "commands"));
        for (const folder of commandFolders) {
            const commandFiles = readdirSync(join(__dirname, "..", "commands", folder)).filter(file => file.endsWith(".ts"));
            for (const file of commandFiles) {
                const command = require(join(__dirname, "..", "commands", folder, file)).default as BaseCommand;
                this.client.commands.set(command.data.name, command);
            }
        }

        Logger.success("Commands loaded.");
    }

    /**
     * Checks if the commands need to be registered by comparing current commands with registered commands.
     * @returns A promise that resolves to true if commands need registration, false otherwise.
     */
    public async needsRegistration(type: "global" | "guild" = "global", guildId?: string): Promise<boolean> {
        if (!process.env.TOKEN) throw new Error("No token provided.");
        if (!process.env.CLIENT_ID) throw new Error("No client ID provided.");
        
        try {
            const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
            const clientId = process.env.CLIENT_ID;
            
            // Fetch existing commands
            let existingCommands: RESTGetAPIApplicationCommandsResult;
            
            if (type === "global") {
                existingCommands = await rest.get(
                    Routes.applicationCommands(clientId)
                ) as RESTGetAPIApplicationCommandsResult;
            } else {
                if (!guildId) throw new Error("Guild ID is required for guild command registration");
                existingCommands = await rest.get(
                    Routes.applicationGuildCommands(clientId, guildId)
                ) as RESTGetAPIApplicationCommandsResult;
            }
            
            // If no commands exist, registration is needed
            if (!existingCommands || existingCommands.length === 0) {
                return true;
            }
            
            // Compare existing commands with current commands
            const currentCommands = this.client.commands.map(cmd => cmd.data.toJSON());
            
            // Check if counts match
            if (currentCommands.length !== existingCommands.length) {
                return true;
            }
            
            // Check for command differences (simple name check)
            const existingCommandNames = new Set(existingCommands.map(cmd => cmd.name));
            for (const command of currentCommands) {
                if (!existingCommandNames.has(command.name)) {
                    return true;
                }
            }
            
            // For a more thorough check, you could also compare options and parameters
            // but that would be more complex and may cause unnecessary re-registrations
            
            return false;
        } catch (error) {
            Logger.error(`Error checking command registration status: ${error}`);
            // If there's an error, assume registration is needed
            return true;
        }
    }

    /**
     * Registers the application commands with Discord.
     * @param type The type of registration: "global" or "guild"
     * @param guildId The ID of the guild to register commands for (if type is "guild")
     * @param clearFirst Whether to clear existing commands before registering new ones
     * @throws An error if no token or client ID is provided.
     */
    public async registerCommands(
        type: "global" | "guild" = "global", 
        guildId?: string, 
        clearFirst: boolean = false
    ): Promise<void> {
        if (!process.env.TOKEN) throw new Error("No token provided.");
        if (!process.env.CLIENT_ID) throw new Error("No client ID provided.");

        const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
        const clientId = process.env.CLIENT_ID;
        const commands = this.client.commands.map(command => command.data.toJSON());
        
        try {
            if (type === "global") {
                Logger.info("Started registering global application commands.");
                
                // Clear existing commands if requested
                if (clearFirst) {
                    Logger.info("Clearing existing global commands...");
                    await rest.put(Routes.applicationCommands(clientId), { body: [] });
                    Logger.info("Existing global commands cleared.");
                }
                
                // Register new commands globally
                await rest.put(Routes.applicationCommands(clientId), { body: commands });
                Logger.success("Successfully registered global application commands.");
            } else if (type === "guild") {
                if (!guildId) throw new Error("No guild ID provided for guild command registration.");
                
                Logger.info(`Started registering application commands for guild ${guildId}.`);
                
                // Clear existing commands if requested
                if (clearFirst) {
                    Logger.info(`Clearing existing commands for guild ${guildId}...`);
                    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
                    Logger.info(`Existing commands for guild ${guildId} cleared.`);
                }
                
                // Register new commands for the guild
                await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
                Logger.success(`Successfully registered application commands for guild ${guildId}.`);
            }
        } catch (error) {
            Logger.error(`Failed to register application commands: ${error}`);
            throw error; // Re-throw to allow calling code to handle it
        }
    }
}