import { BaseEvent } from "../../interfaces";
import Logger from "../../features/Logger";
import ChibiClient from "../../structures/Client";
import { GuildMember, EmbedBuilder, ChannelType, ColorResolvable, ClientUser, TextChannel } from "discord.js";
import WelcomeSystem from "../../features/WelcomeSystem";
import RaidProtection from "../../features/RaidProtection";

export default <BaseEvent>{
    name: "guildMemberAdd",
    async execute(client: ChibiClient, member: GuildMember) {
        try {
            // Check for raid protection first
            const raidDetected = await RaidProtection.checkJoin(member);
            
            // If raid was detected and user was affected, don't send welcome message
            if (raidDetected) {
                Logger.info(`Raid protection triggered for ${member.user.tag} in ${member.guild.name}`);
                return;
            }

            // Continue with welcome message
            const welcomeMessage = await WelcomeSystem.getWelcomeMessage(member.guild.id);
            if (!welcomeMessage) return;

            const embed = new EmbedBuilder()
                .setTitle(welcomeMessage.embed.title)
                .setColor(welcomeMessage.embed.color as ColorResolvable);

            const description = WelcomeSystem.parseWelcomeDescription(welcomeMessage.embed.description, member);
            embed.setDescription(description);

            if (welcomeMessage.embed.thumbnail) {
                embed.setThumbnail((client.user as ClientUser).displayAvatarURL());
            }

            if (welcomeMessage.embed.footer.enabled) {
                embed.setFooter({
                    text: welcomeMessage.embed.footer.text
                });

                if (welcomeMessage.embed.footer.timestamp) {
                    embed.setTimestamp();
                }
            }

            const channel = member.guild.channels.cache.get(welcomeMessage.channelID);

            if (!channel || !channel.isTextBased() || channel.type !== ChannelType.GuildText) {
                Logger.warn(`Welcome channel not found or invalid type: ${welcomeMessage.channelID}`);
                return;
            }

            await (channel as TextChannel).send({ embeds: [embed] });
        } catch (error) {
            Logger.error(`Error in guildMemberAdd event: ${error}`);
        }
    }
}