import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import Logger from "../../features/Logger";

interface MemeResponse {
    postLink: string;
    subreddit: string;
    title: string;
    url: string;
    nsfw: boolean;
    spoiler: boolean;
    author: string;
    ups: number;
}

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("meme")
        .setDescription("Get a random meme to make you laugh")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "fun",
        usage: "/meme",
        examples: ["/meme"],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            // eslint-disable-next-line no-undef
            const response = await fetch("https://meme-api.com/gimme");

            if (!response.ok) {
                Logger.error(`Failed to fetch meme: ${response.status}`);
            }

            let meme = await response.json() as MemeResponse;

            // If NSFW meme found, retry
            while (meme.nsfw || meme.spoiler) {
                const retryResponse = await fetch("https://meme-api.com/gimme");

                if (!retryResponse.ok) {
                    Logger.error(`Failed to fetch meme on retry: ${retryResponse.status}`);
                }

                meme = await retryResponse.json() as MemeResponse;
            }

            const embed = new EmbedBuilder()
                .setTitle(meme.title)
                .setURL(meme.postLink)
                .setImage(meme.url)
                .setColor("Random")
                .setFooter({ 
                    text: `👍 ${meme.ups} upvotes • r/${meme.subreddit} • Posted by u/${meme.author}` 
                })
                .setTimestamp();

            await interaction.followUp({ embeds: [embed] });
        } catch (error) {
            Logger.error(`Error in meme command: ${error}`);

            const embed = new EmbedBuilder()
                .setTitle("😅 Meme Error")
                .setDescription("I couldn't fetch a meme right now. Try again later!")
                .setColor("Red")
                .setTimestamp();

            await interaction.followUp({ embeds: [embed] });
        }
    },
};
