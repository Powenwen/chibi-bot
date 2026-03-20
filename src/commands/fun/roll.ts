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
        .setName("roll")
        .setDescription("Roll one or more dice with customizable sides")
        .addIntegerOption(option => 
            option.setName("sides")
                .setDescription("Number of sides on the dice (2-100, default: 6)")
                .setMinValue(2)
                .setMaxValue(100)
                .setRequired(false)
        )
        .addIntegerOption(option => 
            option.setName("count")
                .setDescription("Number of dice to roll (1-10, default: 1)")
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
        )
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "fun",
        usage: "/roll [sides] [count]",
        examples: [
            "/roll",
            "/roll 20",
            "/roll 12 3",
            "/roll 100 5"
        ],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const options = interaction.options;
        const sides = options.getInteger("sides") || 6;
        const count = options.getInteger("count") || 1;
        
        const rolls: number[] = [];
        for (let i = 0; i < count; i++) {
            rolls.push(Math.floor(Math.random() * sides) + 1);
        }
        
        const total = rolls.reduce((sum, roll) => sum + roll, 0);
        
        const embed = new EmbedBuilder()
            .setTitle(`🎲 Dice Roll`)
            .setDescription(`Rolling ${count} d${sides}...`)
            .addFields([
                {
                    name: "Results",
                    value: rolls.join(", ")
                },
                {
                    name: "Total",
                    value: total.toString()
                }
            ])
            .setColor("Random")
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed] });
    },
};
