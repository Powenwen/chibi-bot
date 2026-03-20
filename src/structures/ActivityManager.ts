import Logger from '../features/Logger';
import ChibiClient from './Client';

/**
 * Manages the bot's Discord presence and activity rotation.
 */
export class ActivityManager {
    private client: ChibiClient;
    private activityInterval?: NodeJS.Timeout;
    private currentActivityIndex: number = 0;
    private activities: { name: string; type: number }[] = [
        { name: "over Chibimation Server!", type: 3 }, // Watching
        { name: "with the Chibimation Sisters!", type: 0 } // Playing
    ];

    /**
     * @param client The main ChibiClient instance.
     */
    constructor(client: ChibiClient) {
        this.client = client;
    }

    /**
     * Starts the automatic rotation of the bot's activities.
     */
    public startRotation(): void {
        if (this.activityInterval) {
            clearInterval(this.activityInterval);
        }

        this.update();

        this.activityInterval = setInterval(() => {
            this.update();
        }, 30000); // 30 seconds

        Logger.info("Activity rotation started (30-second intervals)");
    }

    /**
     * Stops the automatic rotation of the bot's activities.
     */
    public stopRotation(): void {
        if (this.activityInterval) {
            clearInterval(this.activityInterval);
            this.activityInterval = undefined;
            Logger.info("Activity rotation stopped");
        }
    }

    /**
     * Updates the bot's presence to the next activity in the list.
     */
    private update(): void {
        if (!this.client.user || this.activities.length === 0) return;

        const activity = this.activities[this.currentActivityIndex];
        if (!activity) return;

        this.client.user.setPresence({
            status: "online",
            activities: [
                {
                    name: activity.name,
                    type: activity.type
                }
            ]
        });

        this.currentActivityIndex = (this.currentActivityIndex + 1) % this.activities.length;
    }

    /**
     * Sets a custom, one-time activity for the bot, stopping any rotation.
     * @param name The name of the activity.
     * @param type The type of the activity (e.g., 0 for Playing).
     */
    public setCustom(name: string, type: number): void {
        if (!this.client.user) {
            Logger.error("Cannot set activity: client user is not available");
            return;
        }

        this.stopRotation();

        this.client.user.setPresence({
            status: "online",
            activities: [
                {
                    name,
                    type
                }
            ]
        });

        Logger.info(`Custom activity set: ${name} (type: ${type})`);
    }

    /**
     * Adds a new activity to the rotation list.
     * @param name The name of the activity.
     * @param type The type of the activity.
     */
    public add(name: string, type: number): void {
        this.activities.push({ name, type });
        Logger.info(`Activity added: ${name} (type: ${type}). Total activities: ${this.activities.length}`);
    }

    /**
     * Removes an activity from the rotation list by its index.
     * @param index The index of the activity to remove.
     * @returns True if an activity was removed, otherwise false.
     */
    public remove(index: number): boolean {
        if (index < 0 || index >= this.activities.length) {
            return false;
        }

        const removed = this.activities.splice(index, 1)[0];
        if (removed) {
            Logger.info(`Activity removed: ${removed.name}. Total activities: ${this.activities.length}`);
        }

        if (this.currentActivityIndex >= this.activities.length) {
            this.currentActivityIndex = 0;
        }

        return true;
    }

    /**
     * Gets a copy of the current list of activities.
     * @returns An array of activity objects.
     */
    public get(): { name: string; type: number }[] {
        return [...this.activities];
    }
}
