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
        .setName("8ball")
        .setDescription("Ask the magic 8-ball a yes/no question and receive a mystical answer")
        .addStringOption(option => 
            option.setName("question")
                .setDescription("Your yes/no question for the magic 8-ball")
                .setRequired(true)
        )
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "fun",
        usage: "/8ball <question>",
        examples: [
            "/8ball Will I win the lottery?",
            "/8ball Is today going to be a good day?",
            "/8ball Should I study for my exam?"
        ],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const question = interaction.options.getString("question", true);
        
        const responses = [
            "It is certain.",
            "It is decidedly so.",
            "Without a doubt.",
            "Yes, definitely.",
            "You may rely on it.",
            "As I see it, yes.",
            "Most likely.",
            "Outlook good.",
            "Yes.",
            "Signs point to yes.",
            "Reply hazy, try again.",
            "Ask again later.",
            "Better not tell you now.",
            "Cannot predict now.",
            "Concentrate and ask again.",
            "Don't count on it.",
            "My reply is no.",
            "My sources say no.",
            "Outlook not so good.",
            "Very doubtful."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)] as string;
        
        const embed = new EmbedBuilder()
            .setTitle("🎱 Magic 8-Ball")
            .addFields([
                {
                    name: "Question",
                    value: question
                },
                {
                    name: "Answer",
                    value: randomResponse
                }
            ])
            .setColor("Random")
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed] });
    },
};
