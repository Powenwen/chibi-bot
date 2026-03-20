import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    ButtonBuilder, 
    ActionRowBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    InteractionContextType, 
    ApplicationIntegrationType 
} from "discord.js";
import { BaseCommand } from "../../interfaces";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check the bot's latency and API response time")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "info",
        usage: "/ping",
        examples: ["/ping"],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const botPing = Date.now() - interaction.createdTimestamp;
        const apiPing = Math.round(interaction.client.ws.ping);

        const embed = new EmbedBuilder()
            .setTitle("Pong!")
            .setDescription(`Bot Ping: ${botPing}ms\nAPI Ping: ${apiPing}ms`)
            .setColor("Aqua");

        const button = new ButtonBuilder()
            .setCustomId("ping")
            .setLabel("Ping")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("🏓");

        const actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(button);

        await interaction.reply({ embeds: [embed], components: [actionRow] });
    },
};