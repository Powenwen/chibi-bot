import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import StickyMessage from "../../features/StickyMessage";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("smlist")
        .setDescription("List all sticky messages from the bot")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "sticky-message",
        usage: "",
        examples: [""],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const stickyMessages = await StickyMessage.getStickyMessages(interaction.guildId!);

        if (!stickyMessages.length) {
            return interaction.followUp({
                content: "There are no sticky messages in this server.",
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("Sticky Messages")
            .setDescription("Here is a list of all sticky messages in this server.")
            .setColor("Aqua")
            .setTimestamp();

        for (const stickyMessage of stickyMessages) {
            embed.addFields(
                {
                    name: `ID: ${stickyMessage.uniqueID}`,
                    value: `Channel: <#${stickyMessage.channelID}>\nMessage: [Jump to message](https://discord.com/channels/${interaction.guildId}/${stickyMessage.messageChannelID}/${stickyMessage.embedID})`,
                }
            );
        }

        interaction.followUp({
            embeds: [embed]
        });
    }
}