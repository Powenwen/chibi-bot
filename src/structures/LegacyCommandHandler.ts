import { Collection, Message } from "discord.js";
import { readdirSync, statSync } from "fs";
import { join, extname } from "path";
import ChibiClient from "./Client";
import type { BaseLegacyCommand } from "../interfaces";
import { owners } from "../config/config";

export default class LegacyCommandHandler {
    public commands: Collection<string, BaseLegacyCommand> = new Collection();
    public aliases: Collection<string, string> = new Collection();
    private commandPaths: Map<string, string> = new Map();

    constructor(private client: ChibiClient) {}

    /**
     * Load all legacy commands from the commands directory
     * @param commandsPath Path to the commands directory
     */
    public async loadCommands(commandsPath: string): Promise<void> {
        await this.scanDirectory(commandsPath);
        console.log(`✅ Loaded ${this.commands.size} legacy commands`);
    }

    /**
     * Recursively scan directory for legacy command files
     * @param directory Directory to scan
     */
    private async scanDirectory(directory: string): Promise<void> {
        const items = readdirSync(directory);

        for (const item of items) {
            const fullPath = join(directory, item);
            const stat = statSync(fullPath);

            if (stat.isDirectory()) {
                await this.scanDirectory(fullPath);
            } else if (stat.isFile() && extname(item) === '.ts') {
                await this.loadCommand(fullPath);
            }
        }
    }

    /**
     * Load a single legacy command file
     * @param filePath Path to the command file
     */
    private async loadCommand(filePath: string): Promise<void> {
        try {
            // Use require() like the CommandHandler does, but clear cache first for reloading
            delete require.cache[require.resolve(filePath)];
            const command: BaseLegacyCommand = require(filePath).default;

            if (!command || !command.name || !command.execute) {
                return; // Skip non-legacy command files
            }

            // Validate command structure
            if (typeof command.execute !== 'function') {
                console.warn(`⚠️ Legacy command ${command.name} has invalid execute function`);
                return;
            }

            // Store command and its file path for reloading
            this.commands.set(command.name.toLowerCase(), command);
            this.commandPaths.set(command.name.toLowerCase(), filePath);

            // Store aliases
            if (command.aliases && Array.isArray(command.aliases)) {
                for (const alias of command.aliases) {
                    this.aliases.set(alias.toLowerCase(), command.name.toLowerCase());
                }
            }

            console.log(`📋 Loaded legacy command: ${command.name}`);
        } catch (error) {
            console.error(`❌ Failed to load command from ${filePath}:`, error);
        }
    }

    /**
     * Process a message and execute legacy command if applicable
     * @param message The message to process
     */
    public async handleMessage(message: Message): Promise<void> {
        try {
            // Check if message starts with prefix or message is sent from a bot
            const prefix = process.env.PREFIX || 'c!';
            if (!message.content.startsWith(prefix) || message.author.bot) {
                return;
            }

            // Parse command and arguments
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift()?.toLowerCase();

            if (!commandName) {
                return;
            }

            // Find command (check both direct name and aliases)
            let command = this.commands.get(commandName);
            if (!command) {
                const aliasCommand = this.aliases.get(commandName);
                if (aliasCommand) {
                    command = this.commands.get(aliasCommand);
                }
            }

            if (!command) {
                return; // Command not found
            }

            // Ignore if a non-developer is trying to run a dev command
            if ((command.config.category === "dev") && !owners.includes(message.author.id)) return;

            // Check permissions if specified
            if (command.config.permissions && command.config.permissions.length > 0) {
                if (!message.member) {
                    await message.reply("❌ This command can only be used in a server.");
                    return;
                }

                const hasPermission = command.config.permissions.some(permission => {
                    if (permission === "Administrator") {
                        return message.member!.permissions.has("Administrator");
                    }
                    return message.member!.permissions.has(permission as any);
                });

                if (!hasPermission) {
                    await message.reply("❌ You don't have permission to use this command.");
                    return;
                }
            }

            // Execute command
            await command.execute(this.client, message, args);

        } catch (error) {
            console.error('Error executing legacy command:', error);
            
            try {
                await message.reply("❌ An error occurred while executing this command.");
            } catch (replyError) {
                console.error('Failed to send error message:', replyError);
            }
        }
    }

    /**
     * Get command by name or alias
     * @param name Command name or alias
     */
    public getCommand(name: string): BaseLegacyCommand | undefined {
        const lowerName = name.toLowerCase();
        let command = this.commands.get(lowerName);
        
        if (!command) {
            const aliasCommand = this.aliases.get(lowerName);
            if (aliasCommand) {
                command = this.commands.get(aliasCommand);
            }
        }

        return command;
    }

    /**
     * Get all loaded commands
     */
    public getAllCommands(): BaseLegacyCommand[] {
        return Array.from(this.commands.values());
    }

    /**
     * Reload a specific command
     * @param commandName Name of the command to reload
     */
    public async reloadCommand(commandName: string): Promise<{ success: boolean; message: string; }> {
        const command = this.getCommand(commandName);
        if (!command) {
            return { 
                success: false, 
                message: `Command '${commandName}' not found.` 
            };
        }

        const commandKey = command.name.toLowerCase();
        const filePath = this.commandPaths.get(commandKey);
        
        if (!filePath) {
            return { 
                success: false, 
                message: `File path for command '${command.name}' not found.` 
            };
        }

        try {
            // Remove from collections first
            this.commands.delete(commandKey);
            this.commandPaths.delete(commandKey);
            
            // Remove aliases
            if (command.aliases) {
                for (const alias of command.aliases) {
                    this.aliases.delete(alias.toLowerCase());
                }
            }

            // Reload the command file (cache clearing is handled in loadCommand)
            await this.loadCommand(filePath);
            
            // Check if command was successfully reloaded
            if (this.commands.has(commandKey)) {
                const reloadedCommand = this.commands.get(commandKey)!;
                const aliasInfo = reloadedCommand.aliases ? ` (aliases: ${reloadedCommand.aliases.join(', ')})` : '';
                return { 
                    success: true, 
                    message: `Successfully reloaded command '${reloadedCommand.name}'${aliasInfo}.` 
                };
            } else {
                return { 
                    success: false, 
                    message: `Failed to reload command '${command.name}' - command not found after reload.` 
                };
            }

        } catch (error) {
            // If reload failed, try to restore the original command
            try {
                this.commands.set(commandKey, command);
                this.commandPaths.set(commandKey, filePath);
                if (command.aliases) {
                    for (const alias of command.aliases) {
                        this.aliases.set(alias.toLowerCase(), commandKey);
                    }
                }
            } catch (restoreError) {
                console.error(`Failed to restore command after failed reload: ${restoreError}`);
            }

            return { 
                success: false, 
                message: `Failed to reload command '${command.name}': ${error}` 
            };
        }
    }

    /**
     * Reload all commands
     */
    public async reloadAllCommands(): Promise<{ success: boolean; results: Array<{ command: string; success: boolean; message: string; }>; }> {
        const commands = Array.from(this.commands.keys());
        const results: Array<{ command: string; success: boolean; message: string; }> = [];
        let successCount = 0;

        for (const commandName of commands) {
            const result = await this.reloadCommand(commandName);
            results.push({
                command: commandName,
                success: result.success,
                message: result.message
            });
            
            if (result.success) {
                successCount++;
            }
        }

        return {
            success: successCount === commands.length,
            results
        };
    }

    /**
     * Get command file path
     * @param commandName Name of the command
     */
    public getCommandPath(commandName: string): string | undefined {
        const command = this.getCommand(commandName);
        if (!command) {
            return undefined;
        }
        return this.commandPaths.get(command.name.toLowerCase());
    }

    /**
     * Check if command exists and can be reloaded
     * @param commandName Name of the command
     */
    public canReload(commandName: string): boolean {
        const command = this.getCommand(commandName);
        if (!command) {
            return false;
        }
        
        const filePath = this.commandPaths.get(command.name.toLowerCase());
        return !!filePath;
    }
}