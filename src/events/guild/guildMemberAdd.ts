import { BaseEvent } from "../../interfaces";
import Logger from "../../features/Logger";
import ChibiClient from "../../structures/Client";
import { GuildMember, ClientUser } from "discord.js";
import WelcomeSystem from "../../features/WelcomeSystem";
import RaidProtection from "../../features/RaidProtection";

export default <BaseEvent>{
    name: "guildMemberAdd",
    async execute(client: ChibiClient, member: GuildMember) {
        try {
            // Check for raid protection first
            const raidDetected = await RaidProtection.checkJoin(member);

            if (raidDetected) {
                Logger.info(`Raid protection triggered for ${member.user.tag} in ${member.guild.name}`);
                return;
            }

            // Get welcome config
            const config = await WelcomeSystem.getWelcomeMessage(member.guild.id);
            if (!config) return;

            // Send the full welcome (embed/text, DM, and auto-roles)
            await WelcomeSystem.sendWelcome(member, config, client.user as ClientUser);
        } catch (error) {
            Logger.error(`Error in guildMemberAdd event: ${error}`);
        }
    }
}