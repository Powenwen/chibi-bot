import { BaseButton } from "../../../interfaces";
import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default <BaseButton>{
    customId: "guide_autoresponder_examples",
    async execute(interaction: ButtonInteraction) {
        const embed = new EmbedBuilder()
            .setTitle("💬 Auto-Responder Examples")
            .setDescription("Practical examples to help you set up auto-responders effectively:")
            .addFields([
                {
                    name: "👋 Simple Greeting",
                    value:
                        "```\n" +
                        "/arespadd\n" +
                        "  channel: #general\n" +
                        "  trigger: hello\n" +
                        "  response: Hi there! Welcome to our server! 👋\n" +
                        "```\n" +
                        "**Result:** Bot replies with a friendly greeting when someone says \"hello\"",
                    inline: false
                },
                {
                    name: "📋 FAQ Response (Plain Text)",
                    value:
                        "```\n" +
                        "/arespadd\n" +
                        "  channel: #support\n" +
                        "  trigger: how to verify\n" +
                        "  response: To verify, click the ✅ reaction in #verify!\n" +
                        "  case-sensitive: false\n" +
                        "  exact-match: false\n" +
                        "```\n" +
                        "**Result:** Answers verification questions automatically",
                    inline: false
                },
                {
                    name: "🎨 Styled Embed Response",
                    value:
                        "```\n" +
                        "/arespadd\n" +
                        "  channel: #announcements\n" +
                        "  trigger: server info\n" +
                        "  response: We're a friendly gaming community!\n" +
                        "  use-embed: true\n" +
                        "  embed-title: 🎮 Server Information\n" +
                        "  embed-color: #0099FF\n" +
                        "```\n" +
                        "**Result:** Beautiful blue embed with title for important info",
                    inline: false
                },
                {
                    name: "⚠️ Rules Reminder",
                    value:
                        "```\n" +
                        "/arespadd\n" +
                        "  channel: #chat\n" +
                        "  trigger: rules\n" +
                        "  response: Please read our rules in #rules before posting!\n" +
                        "  use-embed: true\n" +
                        "  embed-title: 📜 Server Rules\n" +
                        "  embed-color: FF0000\n" +
                        "```\n" +
                        "**Result:** Eye-catching red embed for rule references",
                    inline: false
                },
                {
                    name: "🎯 Exact Match Example",
                    value:
                        "```\n" +
                        "/arespadd\n" +
                        "  channel: #bot-commands\n" +
                        "  trigger: !help\n" +
                        "  response: Use /help to see all commands!\n" +
                        "  exact-match: true\n" +
                        "```\n" +
                        "**Result:** Only triggers on exactly \"!help\", not \"!help me\" or \"I need !help\"",
                    inline: false
                },
                {
                    name: "💡 Pro Tips",
                    value:
                        "• Use embeds for important information\n" +
                        "• Keep triggers simple and common\n" +
                        "• Use exact-match for command-like triggers\n" +
                        "• Test responses before deploying\n" +
                        "• Use `/aresplist` to review all responders",
                    inline: false
                }
            ])
            .setColor("Purple")
            .setFooter({ text: "💡 Tip: Combine multiple responders for comprehensive FAQ coverage!" })
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
