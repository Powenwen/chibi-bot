import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    InteractionContextType, 
    ApplicationIntegrationType, 
    AttachmentBuilder 
} from "discord.js";
import { BaseCommand } from "../../interfaces";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("info")
        .setDescription("Display information about Chibi Bot, including version and features")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "info",
        usage: "/info",
        examples: ["/info"],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const attachment = new AttachmentBuilder("./assets/chibi.png");

        const embed = new EmbedBuilder()
            .setTitle("Chibi Bot")
            .setDescription("A robot given to the sisters by their father to help around the shop and do modeling.")
            .setColor("Aqua")
            .setThumbnail(`${interaction.client.user?.displayAvatarURL({ extension: "jpg" })}`)
            .addFields([
                {
                    name: "Version",
                    value: "3.3.0",
                    inline: true
                },
                {
                    name: "Developers",
                    value: "[Powenwen](https://github.com/Powenwen)",
                    inline: true
                },
                {
                    name: "Discord",
                    value: "[Join our server!](https://discord.gg/chibimation)",
                }
            ])
            .setImage("attachment://chibi.png");

        await interaction.followUp({ embeds: [embed], files: [attachment] });
    },
};