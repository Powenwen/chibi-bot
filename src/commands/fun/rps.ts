import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    InteractionContextType, 
    ApplicationIntegrationType,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ComponentType,
    ButtonInteraction,
    ColorResolvable
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import Utility from "../../structures/Utility";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("rps")
        .setDescription("Play rock-paper-scissors against the bot")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "fun",
        usage: "/rps",
        examples: ["/rps"],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const userId = interaction.user.id;
        const gameId = Utility.uuid();
        
        const rockButton = new ButtonBuilder()
            .setCustomId(`rps_rock_${gameId}_${userId}`)
            .setLabel('Rock')
            .setEmoji('🪨')
            .setStyle(ButtonStyle.Primary);
            
        const paperButton = new ButtonBuilder()
            .setCustomId(`rps_paper_${gameId}_${userId}`)
            .setLabel('Paper')
            .setEmoji('📄')
            .setStyle(ButtonStyle.Primary);
            
        const scissorsButton = new ButtonBuilder()
            .setCustomId(`rps_scissors_${gameId}_${userId}`)
            .setLabel('Scissors')
            .setEmoji('✂️')
            .setStyle(ButtonStyle.Primary);
        
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(rockButton, paperButton, scissorsButton);
            
        const embed = new EmbedBuilder()
            .setTitle('Rock Paper Scissors')
            .setDescription('Choose your move!')
            .setColor('Blue')
            .setTimestamp();
            
        const response = await interaction.reply({ 
            embeds: [embed], 
            components: [row]
        });
        
        const filter = (i: ButtonInteraction) => {
            return i.customId.includes(gameId) && i.user.id === userId;
        };
        
        try {
            const buttonInteraction = await response.awaitMessageComponent({ 
                filter, 
                time: 30000,
                componentType: ComponentType.Button
            });
            
            const choices = ['rock', 'paper', 'scissors'];
            const botChoice = choices[Math.floor(Math.random() * choices.length)];
            const playerChoice = buttonInteraction.customId.split('_')[1];
            
            let resultMessage: string;
            let color: string;
            
            if (playerChoice === botChoice) {
                resultMessage = "It's a tie!";
                color = 'Grey';
            } else if (
                (playerChoice === 'rock' && botChoice === 'scissors') ||
                (playerChoice === 'paper' && botChoice === 'rock') ||
                (playerChoice === 'scissors' && botChoice === 'paper')
            ) {
                resultMessage = 'You win!';
                color = 'Green';
            } else {
                resultMessage = 'I win!';
                color = 'Red';
            }
            
            const resultEmbed = new EmbedBuilder()
                .setTitle('Rock Paper Scissors Result')
                .setDescription(resultMessage)
                .addFields([
                    {
                        name: 'Your choice',
                        value: playerChoice.charAt(0).toUpperCase() + playerChoice.slice(1),
                        inline: true
                    },
                    {
                        name: 'My choice',
                        value: botChoice.charAt(0).toUpperCase() + botChoice.slice(1),
                        inline: true
                    }
                ])
                .setColor(color as ColorResolvable)
                .setTimestamp();
                
            await buttonInteraction.update({ 
                embeds: [resultEmbed], 
                components: [] 
            });
            
        } catch (error) {
            const timeoutEmbed = new EmbedBuilder()
                .setTitle('Game Timed Out')
                .setDescription('You took too long to make a choice.')
                .setColor('Orange')
                .setTimestamp();
                
            await interaction.editReply({ 
                embeds: [timeoutEmbed], 
                components: [] 
            });
        }
    },
};
