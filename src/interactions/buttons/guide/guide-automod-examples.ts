import { BaseButton } from "../../../interfaces";
import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default <BaseButton>{
    customId: "guide_automod_examples",
    async execute(interaction: ButtonInteraction) {
        const embed = new EmbedBuilder()
            .setTitle("🛡️ Auto-Moderation Examples")
            .setDescription("Here are practical examples of setting up auto-moderation for different scenarios:")
            .addFields([
                {
                    name: "🏢 Professional Server Setup",
                    value:
                        "```\n" +
                        "/automod-config enable:true\n" +
                        "/automod-config spam-threshold:3\n" +
                        "/automod-config timeout-duration:300\n" +
                        "/automod-config delete-messages:true\n" +
                        "```\n" +
                        "**Why?** Strict settings to maintain professionalism. 5-minute timeouts discourage spam.",
                    inline: false
                },
                {
                    name: "🎮 Gaming Community Setup",
                    value:
                        "```\n" +
                        "/automod-config enable:true\n" +
                        "/automod-config spam-threshold:5\n" +
                        "/automod-config timeout-duration:60\n" +
                        "/automod-config allow-links:true\n" +
                        "```\n" +
                        "**Why?** More relaxed for active gaming discussions. 1-minute timeouts for quick corrections.",
                    inline: false
                },
                {
                    name: "📚 Educational Server Setup",
                    value:
                        "```\n" +
                        "/automod-config enable:true\n" +
                        "/automod-config spam-threshold:4\n" +
                        "/automod-config timeout-duration:120\n" +
                        "/automod-config word-filter:true\n" +
                        "```\n" +
                        "**Why?** Balanced approach with word filtering for appropriate discussions.",
                    inline: false
                },
                {
                    name: "🛡️ High Security Setup",
                    value:
                        "```\n" +
                        "/automod-config enable:true\n" +
                        "/automod-config spam-threshold:2\n" +
                        "/automod-config duplicate-threshold:2\n" +
                        "/automod-config timeout-duration:600\n" +
                        "/automod-config raid-protection:true\n" +
                        "```\n" +
                        "**Why?** Maximum protection for servers prone to raids or spam attacks.",
                    inline: false
                },
                {
                    name: "📊 Testing Your Settings",
                    value:
                        "1. Enable auto-mod in a test channel\n" +
                        "2. Send rapid messages to test spam detection\n" +
                        "3. Check `/automod-stats` to see results\n" +
                        "4. Adjust thresholds as needed\n" +
                        "5. Roll out to all channels when satisfied",
                    inline: false
                }
            ])
            .setColor("Red")
            .setFooter({ text: "💡 Tip: Start with default settings and adjust based on server activity!" })
            .setTimestamp();

        const buttons = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('guide_back_overview')
                    .setLabel('Back to Overview')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('◀️')
            );

        await interaction.update({
            embeds: [embed],
            components: [buttons]
        });
    }
};
