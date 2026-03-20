import { BaseButton } from "../../../interfaces";
import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default <BaseButton>{
    customId: "guide_sticky_examples",
    async execute(interaction: ButtonInteraction) {
        const embed = new EmbedBuilder()
            .setTitle("📌 Sticky Message Examples")
            .setDescription("Practical examples for setting up sticky messages in different scenarios:")
            .addFields([
                {
                    name: "📜 Rules Channel Example",
                    value:
                        "**Step 1:** Create a message in #rules with your rules text\n" +
                        "**Step 2:** Right-click the message → Copy Message Link\n" +
                        "**Step 3:** Run the command:\n" +
                        "```\n" +
                        "/smadd\n" +
                        "  message: <paste_message_link_here>\n" +
                        "  title: 📜 Server Rules\n" +
                        "  color: #FF0000\n" +
                        "  maxmessagecount: 0\n" +
                        "```\n" +
                        "**Why 0?** Keeps rules always visible at the bottom after every message.",
                    inline: false
                },
                {
                    name: "📢 Announcements Channel",
                    value:
                        "**Step 1:** Post your announcement in #announcements\n" +
                        "**Step 2:** Copy the message URL\n" +
                        "**Step 3:**\n" +
                        "```\n" +
                        "/smadd\n" +
                        "  message: https://discord.com/channels/...\n" +
                        "  title: 📢 Important Information\n" +
                        "  color: #0099FF\n" +
                        "  maxmessagecount: 3\n" +
                        "```\n" +
                        "**Why 3?** Low activity channel, repost after a few messages.",
                    inline: false
                },
                {
                    name: "💬 Active Chat Channel",
                    value:
                        "```\n" +
                        "/smadd\n" +
                        "  message: 1234567890 (or full URL)\n" +
                        "  title: 💬 Welcome to General Chat!\n" +
                        "  color: #00FF00\n" +
                        "  maxmessagecount: 15\n" +
                        "```\n" +
                        "**Why 15?** High activity channel, don't spam the sticky too often.",
                    inline: false
                },
                {
                    name: "🎫 Support Channel",
                    value:
                        "```\n" +
                        "/smadd\n" +
                        "  message: 1234567890\n" +
                        "  title: 🎫 Need Help?\n" +
                        "  color: #FFD700\n" +
                        "  maxmessagecount: 5\n" +
                        "```\n" +
                        "**Why 5?** Medium activity, keeps help info visible without spam.",
                    inline: false
                },
                {
                    name: "💡 Pro Tips",
                    value:
                        "• **Message URL**: Right-click message → Copy Message Link\n" +
                        "• **Message ID**: Enable Developer Mode → Right-click message → Copy ID\n" +
                        "• **Threshold Guide:**\n" +
                        "  - High Activity (100+ msgs/hour): 15-20\n" +
                        "  - Medium Activity (20-100 msgs/hour): 5-10\n" +
                        "  - Low Activity (<20 msgs/hour): 2-5\n" +
                        "  - Critical Info: 0 (always visible)\n\n" +
                        "Use `/smedit` to adjust if needed!",
                    inline: false
                }
            ])
            .setColor("Green")
            .setFooter({ text: "💡 Tip: Monitor and adjust thresholds based on channel activity!" })
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
