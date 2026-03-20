import { Message, GuildMember, TextChannel } from "discord.js";
import ModerationSystem from "./ModerationSystem";
import Logger from "./Logger";
import AutoModerationLogger from "./AutoModerationLogger";

export default class WordFilter {
    
    static async checkMessage(message: Message): Promise<boolean> {
        if (!message.guild || !message.member) return false;

        const settings = await ModerationSystem.getAutoModSettings(message.guild.id);
        if (!settings || !settings.enabled || !settings.wordFilter.enabled) return false;

        // Check if user has bypass permissions
        if (this.hasBypassPermissions(message.member)) return false;

        const content = message.content.toLowerCase();
        
        // Check if message contains filtered words
        const containsFilteredWord = settings.wordFilter.words.some(word => {
            // Check if word is in whitelist
            if (settings.wordFilter.whitelist.includes(word)) return false;
            
            // Simple word boundary check
            const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
            return regex.test(content);
        });

        if (containsFilteredWord) {
            await this.handleFilteredWord(message, settings);
            return true;
        }

        return false;
    }

    private static hasBypassPermissions(member: GuildMember): boolean {
        return member.permissions.has("Administrator") || member.permissions.has("ManageMessages");
    }

    private static async handleFilteredWord(message: Message, settings: any): Promise<void> {
        try {
            // Always delete the message first
            await message.delete().catch(() => null);

            const action = settings.wordFilter.action;
            
            // Log the auto-moderation action
            await AutoModerationLogger.logAction(
                message.guild!,
                message.author,
                message,
                'wordFilter',
                action,
                'Message contained prohibited words'
            );
            
            switch (action) {
                case "delete":
                    // Message already deleted, just log
                    Logger.info(`Deleted filtered word message from ${message.author.tag} in ${message.guild?.name}`);
                    break;
                    
                case "warn":
                    await this.warnUser(message);
                    break;
                    
                case "mute":
                    await this.muteUser(message);
                    break;
                    
                case "kick":
                    await this.kickUser(message);
                    break;
            }

            // Send temporary warning message
            const channel = message.channel as TextChannel;
            const warningMessage = await channel.send({
                content: `${message.author}, your message contained prohibited content and has been removed.`
            }).catch(() => null);

            // Delete warning after 5 seconds
            if (warningMessage) {
                setTimeout(async () => {
                    try {
                        await warningMessage.delete();
                    } catch (error) {
                        // Message may already be deleted
                    }
                }, 5000);
            }

        } catch (error) {
            Logger.error(`Failed to handle filtered word: ${error}`);
        }
    }

    private static async warnUser(message: Message): Promise<void> {
        if (!message.guild) return;
        
        await ModerationSystem.createCase(
            message.guild,
            message.author,
            message.client.user!,
            "warn",
            "Used prohibited words in message"
        );
    }

    private static async muteUser(message: Message): Promise<void> {
        if (!message.guild || !message.member) return;
        
        const muteTime = 5 * 60 * 1000; // 5 minutes
        
        try {
            await message.member.timeout(muteTime, "Used prohibited words");
            
            await ModerationSystem.createCase(
                message.guild,
                message.author,
                message.client.user!,
                "timeout",
                "Used prohibited words in message",
                muteTime
            );
        } catch (error) {
            Logger.error(`Failed to mute user for filtered word: ${error}`);
        }
    }

    private static async kickUser(message: Message): Promise<void> {
        if (!message.guild || !message.member) return;
        
        try {
            await message.member.kick("Used prohibited words");
            
            await ModerationSystem.createCase(
                message.guild,
                message.author,
                message.client.user!,
                "kick",
                "Used prohibited words in message"
            );
        } catch (error) {
            Logger.error(`Failed to kick user for filtered word: ${error}`);
        }
    }
}
