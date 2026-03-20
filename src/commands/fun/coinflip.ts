import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    InteractionContextType, 
    ApplicationIntegrationType 
} from "discord.js";
import { BaseCommand } from "../../interfaces";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("coinflip")
        .setDescription("Flip a virtual coin and get heads or tails")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "fun",
        usage: "/coinflip",
        examples: ["/coinflip"],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const result = Math.random() < 0.5 ? "Heads" : "Tails";
        const emoji = result === "Heads" ? "🪙" : "💿";
        
        const embed = new EmbedBuilder()
            .setTitle(`${emoji} Coin Flip`)
            .setDescription(`The coin landed on: **${result}**!`)
            .setColor("Gold")
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed] });
    },
};
