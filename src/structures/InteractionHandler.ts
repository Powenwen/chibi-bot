import { readdirSync, statSync } from "fs";
import { join } from "path";
import ChibiClient from "./Client";
import Logger from "../features/Logger";
import { ErrorHandler } from "../utils/ErrorHandler";

/**
 * Represents an InteractionHandler class.
 */
export default class InteractionHandler {
    private readonly loadedComponents = {
        selectMenus: 0,
        modals: 0,
        buttons: 0
    };

    /**
     * Creates an instance of InteractionHandler.
     * @param {ChibiClient} client - The ChibiClient instance.
     */
    public constructor(private client: ChibiClient) { }
    
    private loadFilesFromDirectory(directory: string, callback: (file: string) => void): void {
        try {
            if (!statSync(directory).isDirectory()) {
                Logger.warn(`Directory ${directory} does not exist`);
                return;
            }

            const processFile = (fullPath: string, isFile: boolean) => {
                if (isFile && /\.(ts|js)$/.test(fullPath)) {
                    callback(fullPath);
                } else if (!isFile) {
                    this.loadFilesFromDirectory(fullPath, callback);
                }
            };

            readdirSync(directory, { withFileTypes: true })
                .forEach(file => processFile(
                    join(directory, file.name), 
                    file.isFile()
                ));
        } catch (error) {
            ErrorHandler.handle(error as Error, undefined, `loadFilesFromDirectory:${directory}`);
        }
    }

    private loadComponent<T extends { customId: string }>(
        filePath: string,
        collection: Map<string, T>,
        componentType: string
    ): boolean {
        try {
            delete require.cache[require.resolve(filePath)];
            const component = require(filePath).default as T;
            
            if (!component || !component.customId) {
                Logger.warn(`Invalid ${componentType} at ${filePath}: missing customId`);
                return false;
            }
            
            collection.set(component.customId, component);
            Logger.debug(`Loaded ${componentType}: ${component.customId} from ${filePath}`);
            return true;
        } catch (error) {
            Logger.error(`Failed to load ${componentType} from ${filePath}: ${error}`);
            return false;
        }
    }

    private loadComponentsForType<T extends { customId: string }>(
        directoryName: string,
        collection: Map<string, T>,
        componentType: string
    ): number {
        const componentsPath = join(__dirname, "..", "interactions", directoryName);
        let loaded = 0;
        const files: string[] = [];

        // Collect all files first
        this.loadFilesFromDirectory(componentsPath, (file) => {
            files.push(file);
        });

        // Load components synchronously
        for (const file of files) {
            if (this.loadComponent(file, collection, componentType)) {
                loaded++;
            }
        }

        Logger.success(`Loaded ${loaded} ${componentType}${loaded !== 1 ? 's' : ''}.`);
        return loaded;
    }

    /**
     * Loads select menus with enhanced error handling.
     */
    public loadSelectMenus(): void {
        this.loadedComponents.selectMenus = this.loadComponentsForType(
            "selectMenus", 
            this.client.selectMenus, 
            "select menu"
        );
    }

    /**
     * Loads modals with enhanced error handling.
     */
    public loadModals(): void {
        this.loadedComponents.modals = this.loadComponentsForType(
            "modals",
            this.client.modals,
            "modal"
        );
    }

    /**
     * Loads buttons with enhanced error handling.
     */
    public loadButtons(): void {
        this.loadedComponents.buttons = this.loadComponentsForType(
            "buttons",
            this.client.buttons,
            "button"
        );
    }

    /**
     * Gets statistics about loaded components
     */
    public getStats(): typeof this.loadedComponents {
        return { ...this.loadedComponents };
    }
}