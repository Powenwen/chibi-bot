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
        .setName("rate")
        .setDescription("Rate anything on a scale from 1 to 10")
        .addStringOption(option =>
            option.setName("thing")
                .setDescription("What would you like me to rate?")
                .setRequired(true)
                .setMaxLength(100)
        )
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "fun",
        usage: "/rate <thing>",
        examples: [
            "/rate pizza",
            "/rate my profile picture",
            "/rate this server"
        ],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const thing = interaction.options.getString("thing", true);
        const rating = Math.floor(Math.random() * 10) + 1;

        // Generate a fun message based on the rating
        let message: string;
        let color: string;

        if (rating <= 3) {
            message = "Not great, to be honest... 😬";
            color = "Red";
        } else if (rating <= 5) {
            message = "It's okay, I guess... 😐";
            color = "Orange";
        } else if (rating <= 7) {
            message = "Pretty good! 👍";
            color = "Yellow";
        } else if (rating <= 9) {
            message = "Really awesome! 🌟";
            color = "Green";
        } else {
            message = "Absolutely perfect! 💯";
            color = "Gold";
        }

        // Create a visual rating bar
        const filledStars = "⭐".repeat(rating);
        const emptyStars = "☆".repeat(10 - rating);
        const ratingBar = filledStars + emptyStars;

        // Map color names to hex values for proper typing
        const colorMap: Record<string, number> = {
            "Red": 0xFF0000,
            "Orange": 0xFFA500,
            "Yellow": 0xFFFF00,
            "Green": 0x00FF00,
            "Gold": 0xFFD700
        };

        const embed = new EmbedBuilder()
            .setTitle("📊 Rating System")
            .setDescription(
                `**Rating for:** ${thing}\n\n` +
                `${ratingBar}\n\n` +
                `**Score:** ${rating}/10\n` +
                `${message}`
            )
            .setColor(colorMap[color] || 0x808080)
            .setFooter({ text: `Rated by ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
