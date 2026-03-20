import { BaseEvent } from "../../interfaces";
import ChibiClient from "../../structures/Client";
import {
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    StringSelectMenuInteraction,
    ModalSubmitInteraction,
    ButtonInteraction,
    GuildMember,
    MessageFlags,
    Interaction,
    InteractionReplyOptions
} from "discord.js";
import Logger from "../../features/Logger";
import { ErrorHandler } from "../../utils/ErrorHandler";

export default <BaseEvent>{
    name: "interactionCreate",
    async execute(client: ChibiClient, interaction: Interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                await handleChatInputCommand(client, interaction);
            } else if (interaction.isAutocomplete()) {
                await handleAutocomplete(client, interaction);
            } else if (interaction.isStringSelectMenu()) {
                await handleStringSelectMenu(client, interaction);
            } else if (interaction.isModalSubmit()) {
                await handleModalSubmit(client, interaction);
            } else if (interaction.isButton()) {
                await handleButton(client, interaction);
            }
        } catch (error) {
            await ErrorHandler.handle(error as Error, interaction, 'interactionCreate');
        }
    }
};

async function handleChatInputCommand(client: ChibiClient, interaction: ChatInputCommandInteraction): Promise<void> {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // Permission checks
    if (command.config.category === "dev" && !client.config.owners.includes(interaction.user.id)) {
        await safeReply(interaction, {
            content: "You do not have permission to use this command!", 
            flags: MessageFlags.Ephemeral 
        });
        return;
    }

    if (command.config.permissions.length && interaction.member instanceof GuildMember) {
        const memberPermissions = interaction.member.permissions;
        const hasPermission = command.config.permissions.some(permission => 
            memberPermissions.has(permission as any)
        );

        if (!hasPermission) {
            await safeReply(interaction, { 
                content: "You do not have permission to use this command!", 
                flags: MessageFlags.Ephemeral 
            });
            return;
        }
    }

    try {
        await command.execute(interaction);
        Logger.info(`Command ${interaction.commandName} executed by ${interaction.user.tag}`);
    } catch (error) {
        await ErrorHandler.handle(error as Error, interaction as Interaction, `command:${interaction.commandName}`);
        await safeReply(interaction, { 
            content: "There was an error while executing this command!", 
            flags: MessageFlags.Ephemeral 
        });
    }
}

async function handleAutocomplete(client: ChibiClient, interaction: AutocompleteInteraction): Promise<void> {
    const command = client.commands.get(interaction.commandName);
    if (!command?.autocomplete) return;

    try {
        await command.autocomplete(interaction);
    } catch (error) {
        Logger.error(`Autocomplete error for ${interaction.commandName}: ${error}`);
    }
}

async function handleStringSelectMenu(client: ChibiClient, interaction: StringSelectMenuInteraction): Promise<void> {
    // Try exact match first
    let selectMenu = client.selectMenus.get(interaction.customId);
    
    // If no exact match, try wildcard matching
    if (!selectMenu) {
        selectMenu = findComponentWithWildcard(client.selectMenus, interaction.customId);
    }
    
    if (!selectMenu) {
        Logger.warn(`No select menu handler found for customId: ${interaction.customId}`);
        return;
    }

    try {
        await selectMenu.execute(interaction);
        Logger.debug(`Select menu ${interaction.customId} executed successfully`);
    } catch (error) {
        await ErrorHandler.handle(error as Error, interaction, `selectMenu:${interaction.customId}`);
        await safeReply(interaction, { 
            content: "There was an error while processing this selection!", 
            flags: MessageFlags.Ephemeral 
        });
    }
}

async function handleModalSubmit(client: ChibiClient, interaction: ModalSubmitInteraction): Promise<void> {
    // Try exact match first
    let modal = client.modals.get(interaction.customId);
    
    // If no exact match, try wildcard matching
    if (!modal) {
        modal = findComponentWithWildcard(client.modals, interaction.customId);
    }
    
    if (!modal) {
        Logger.warn(`No modal handler found for customId: ${interaction.customId}`);
        return;
    }

    try {
        await modal.execute(interaction);
        Logger.debug(`Modal ${interaction.customId} executed successfully`);
    } catch (error) {
        await ErrorHandler.handle(error as Error, interaction, `modal:${interaction.customId}`);
        await safeReply(interaction, { 
            content: "There was an error while processing this modal!", 
            flags: MessageFlags.Ephemeral 
        });
    }
}

async function handleButton(client: ChibiClient, interaction: ButtonInteraction): Promise<void> {
    // Try exact match first
    let button = client.buttons.get(interaction.customId);
    
    // If no exact match, try wildcard matching
    if (!button) {
        button = findComponentWithWildcard(client.buttons, interaction.customId);
    }
    
    if (!button) {
        Logger.warn(`No button handler found for customId: ${interaction.customId}`);
        return;
    }

    try {
        await button.execute(interaction);
        Logger.debug(`Button ${interaction.customId} executed successfully`);
    } catch (error) {
        await ErrorHandler.handle(error as Error, interaction, `button:${interaction.customId}`);
        await safeReply(interaction, { 
            content: "There was an error while processing this button!", 
            flags: MessageFlags.Ephemeral 
        });
    }
}

/**
 * Helper function to find components with wildcard matching
 * Supports patterns like "help_*" to match "help_moderation", "help_fun", etc.
 */
function findComponentWithWildcard<T>(collection: Map<string, T>, customId: string): T | undefined {
    // Try to find a wildcard pattern that matches
    for (const [key, value] of collection.entries()) {
        // Check if the key contains a wildcard
        if (key.includes('*')) {
            // Convert wildcard pattern to regex
            const pattern = key
                .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
                .replace(/\*/g, '.*'); // Replace * with .*
            const regex = new RegExp(`^${pattern}$`);
            
            if (regex.test(customId)) {
                return value;
            }
        }
    }
    
    return undefined;
}

async function safeReply(interaction: ChatInputCommandInteraction | StringSelectMenuInteraction | ModalSubmitInteraction | ButtonInteraction, options: InteractionReplyOptions): Promise<void> {
    try {
        if (!interaction.isRepliable()) {
            Logger.warn('Attempted to reply to non-repliable interaction');
            return;
        }

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(options);
        } else {
            await interaction.reply(options);
        }
    } catch (error) {
        Logger.error(`Failed to reply to interaction: ${error}`);
    }
}