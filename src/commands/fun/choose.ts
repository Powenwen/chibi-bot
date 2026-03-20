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
        .setName("choose")
        .setDescription("Let me help you make a decision by choosing from your options")
        .addStringOption(option =>
            option.setName("options")
                .setDescription("Enter your options separated by commas (e.g., pizza, burger, pasta)")
                .setRequired(true)
                .setMaxLength(500)
        )
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "fun",
        usage: "/choose <options>",
        examples: [
            "/choose pizza, burger, pasta",
            "/choose study, sleep, game",
            "/choose red, blue, green"
        ],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const optionsString = interaction.options.getString("options", true);
        
        // Split by comma and trim whitespace
        const options = optionsString
            .split(',')
            .map(opt => opt.trim())
            .filter(opt => opt.length > 0);

        if (options.length < 2) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Not Enough Options")
                .setDescription("Please provide at least 2 options separated by commas!\n\n**Example:** `/choose pizza, burger, pasta`")
                .setColor("Red")
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        if (options.length > 20) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Too Many Options")
                .setDescription("Please provide a maximum of 20 options!")
                .setColor("Red")
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const chosenOption = options[Math.floor(Math.random() * options.length)];

        const embed = new EmbedBuilder()
            .setTitle("🎯 Decision Made!")
            .setDescription(
                `**Your Options:**\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\n` +
                `**My Choice:** 🎲 **${chosenOption}**`
            )
            .setColor("Random")
            .setFooter({ text: "Need another choice? Run the command again!" })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
