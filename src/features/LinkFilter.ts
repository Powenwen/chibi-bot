import { Message, GuildMember, TextChannel } from "discord.js";
import ModerationSystem from "./ModerationSystem";
import Logger from "./Logger";

export default class LinkFilter {
    
    static async checkMessage(message: Message): Promise<boolean> {
        if (!message.guild || !message.member) return false;

        const settings = await ModerationSystem.getAutoModSettings(message.guild.id);
        if (!settings || !settings.enabled || !settings.linkFilter.enabled) return false;

        // Check if user has bypass permissions
        if (this.hasBypassPermissions(message.member, settings)) return false;

        // Check if message contains links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = message.content.match(urlRegex);
        
        if (!urls || urls.length === 0) return false;

        // Check if any URL is not in allowed domains
        const hasDisallowedLink = urls.some(url => {
            try {
                const domain = new URL(url).hostname.toLowerCase();
                return !settings.linkFilter.allowedDomains.some(allowed => 
                    domain.includes(allowed.toLowerCase())
                );
            } catch (error) {
                // Invalid URL, consider it disallowed
                return true;
            }
        });

        if (hasDisallowedLink) {
            await this.handleDisallowedLink(message, settings);
            return true;
        }

        return false;
    }

    private static hasBypassPermissions(member: GuildMember, settings: any): boolean {
        // Check if user has admin/mod permissions
        if (member.permissions.has("Administrator") || member.permissions.has("ManageMessages")) {
            return true;
        }

        // Check if user has bypass roles
        return settings.linkFilter.bypassRoles.some((roleId: string) => member.roles.cache.has(roleId));
    }

    private static async handleDisallowedLink(message: Message, settings: any): Promise<void> {
        try {
            // Always delete the message first
            await message.delete().catch(() => null);

            const action = settings.linkFilter.action;
            
            switch (action) {
                case "delete":
                    // Message already deleted, just log
                    Logger.info(`Deleted disallowed link from ${message.author.tag} in ${message.guild?.name}`);
                    break;
                    
                case "warn":
                    await this.warnUser(message);
                    break;
                    
                case "mute":
                    await this.muteUser(message);
                    break;
            }

            // Send temporary warning message
            const channel = message.channel as TextChannel;
            const warningMessage = await channel.send({
                content: `${message.author}, links from that domain are not allowed in this server.`
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
            Logger.error(`Failed to handle disallowed link: ${error}`);
        }
    }

    private static async warnUser(message: Message): Promise<void> {
        if (!message.guild) return;
        
        await ModerationSystem.createCase(
            message.guild,
            message.author,
            message.client.user!,
            "warn",
            "Posted disallowed link"
        );
    }

    private static async muteUser(message: Message): Promise<void> {
        if (!message.guild || !message.member) return;
        
        const muteTime = 5 * 60 * 1000; // 5 minutes
        
        try {
            await message.member.timeout(muteTime, "Posted disallowed link");
            
            await ModerationSystem.createCase(
                message.guild,
                message.author,
                message.client.user!,
                "timeout",
                "Posted disallowed link",
                muteTime
            );
        } catch (error) {
            Logger.error(`Failed to mute user for disallowed link: ${error}`);
        }
    }
}
