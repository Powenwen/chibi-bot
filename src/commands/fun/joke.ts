import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import Logger from "../../features/Logger";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("joke")
        .setDescription("Get a random joke to brighten your day")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "fun",
        usage: "/joke",
        examples: ["/joke"],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            // eslint-disable-next-line no-undef
            const response = await fetch("https://official-joke-api.appspot.com/random_joke");

            if (!response.ok) {
                throw new Error(`Failed to fetch joke: ${response.status}`);
            }
            
            interface JokeResponse {
                type: string;
                setup: string;
                punchline: string;
                id: number;
            }

            const joke = await response.json() as JokeResponse;

            const embed = new EmbedBuilder()
                .setTitle("😂 Random Joke")
                .setDescription(`**${joke.setup}**\n\n${joke.punchline}`)
                .setColor("Random")
                .setTimestamp();

            await interaction.followUp({ embeds: [embed] });
        } catch (error) {
            Logger.error(`Error in joke command: ${error}`);

            const embed = new EmbedBuilder()
                .setTitle("😅 Joke Error")
                .setDescription("I couldn't think of a joke right now. Try again later!")
                .setColor("Red")
                .setTimestamp();

            await interaction.followUp({ embeds: [embed] });
        }
    },
};
