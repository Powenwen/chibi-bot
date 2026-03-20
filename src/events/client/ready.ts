import { BaseEvent } from "../../interfaces";
import Logger from "../../features/Logger";
import ChibiClient from "../../structures/Client";
import StickyMessage from "../../features/StickyMessage";
import DuplicateFilter from "../../features/DuplicateFilter";
import RaidProtection from "../../features/RaidProtection";
import { ErrorHandler } from "../../utils/ErrorHandler";
import mongoose from "mongoose";

const waitForDatabase = async (maxRetries = 10, delayMs = 2000): Promise<boolean> => {
    for (let i = 0; i < maxRetries; i++) {
        if (mongoose.connection.readyState === 1) {
            Logger.success("Database connection confirmed ready.");
            return true;
        }
        
        Logger.info(`Waiting for database connection... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    Logger.error("Database connection timeout after maximum retries.");
    return false;
};

const initializeStickyMessages = async (client: ChibiClient) => {
    const isDbReady = await waitForDatabase();
    if (!isDbReady) {
        Logger.error("Skipping sticky message check due to database connection issues.");
        return;
    }

    await ErrorHandler.handleAsyncOperation(
        () => StickyMessage.checkAndResendStickyMessages(client),
        'sticky-messages-initialization'
    );
};

const setupCleanupTasks = () => {
    setInterval(() => {
        ErrorHandler.handleAsyncOperation(async () => {
            DuplicateFilter.cleanupHistory();
            RaidProtection.cleanupHistory();
            Logger.debug("Moderation system memory cleanup completed");
        }, 'moderation-cleanup');
    }, 5 * 60 * 1000); // Clean up every 5 minutes
};

export default <BaseEvent>{
    name: "clientReady",
    once: true,
    async execute(client: ChibiClient) {
        Logger.info(`Logged in as ${client.user?.tag}`);
        Logger.success(`Number of commands: ${client.commands.size}`);
        Logger.success(`Number of application commands: ${client.application?.commands.cache.size}`);

        // Initialize sticky messages after delay
        setTimeout(() => initializeStickyMessages(client), 5000);
        
        // Set up cleanup tasks
        setupCleanupTasks();
    }
};
