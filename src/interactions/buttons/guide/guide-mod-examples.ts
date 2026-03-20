import { BaseButton } from "../../../interfaces";
import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default <BaseButton>{
    customId: "guide_mod_examples",
    async execute(interaction: ButtonInteraction) {
        const embed = new EmbedBuilder()
            .setTitle("⚖️ Moderation Examples")
            .setDescription("Practical examples for effective server moderation:")
            .addFields([
                {
                    name: "⚠️ Issuing Warnings",
                    value:
                        "```\n" +
                        "/warn user:@BadUser reason:Spam in #general\n" +
                        "```\n" +
                        "**When to use:** First offense, minor violations\n" +
                        "**Effect:** Logged warning, user notified\n" +
                        "**Best practice:** Always explain what rule was broken",
                    inline: false
                },
                {
                    name: "🔇 Timeout (Mute)",
                    value:
                        "```\n" +
                        "/mute user:@Spammer duration:1h reason:Excessive spam\n" +
                        "```\n" +
                        "**When to use:** Repeated offense, needs cooling down\n" +
                        "**Durations:** 5m (light), 1h (medium), 1d (serious)\n" +
                        "**Best practice:** Use timeout before kicks/bans",
                    inline: false
                },
                {
                    name: "🗑️ Message Cleanup",
                    value:
                        "```\n" +
                        "# Delete last 50 messages\n" +
                        "/clear amount:50\n\n" +
                        "# Delete specific user's messages\n" +
                        "/clear amount:20 user:@Spammer\n\n" +
                        "# Delete messages containing text\n" +
                        "/clear amount:100 contains:discord.gg\n" +
                        "```\n" +
                        "**When to use:** Cleaning spam, raids, inappropriate content",
                    inline: false
                },
                {
                    name: "👢 Kicks and Bans",
                    value:
                        "```\n" +
                        "# Kick (can rejoin)\n" +
                        "/kick user:@Troublemaker reason:Repeated violations\n\n" +
                        "# Ban (permanent removal)\n" +
                        "/ban user:@Raider reason:Raiding attempt\n" +
                        "```\n" +
                        "**When to use:** Serious violations, safety threats\n" +
                        "**Best practice:** Document everything, be clear about reason",
                    inline: false
                },
                {
                    name: "📊 Reviewing Mod Logs",
                    value:
                        "```\n" +
                        "# Check user's history\n" +
                        "/modlogs user:@Someone\n\n" +
                        "# View all warnings\n" +
                        "/modlogs type:warn\n\n" +
                        "# Check specific mod's actions\n" +
                        "/modlogs moderator:@ModName\n" +
                        "```\n" +
                        "**Why:** Track patterns, ensure consistency, review team actions",
                    inline: false
                },
                {
                    name: "🎯 Progressive Discipline Example",
                    value:
                        "**1st Offense:** `/warn` + verbal warning\n" +
                        "**2nd Offense:** `/mute duration:30m` + clear explanation\n" +
                        "**3rd Offense:** `/mute duration:6h` + final warning\n" +
                        "**4th Offense:** `/kick` + explanation of consequence\n" +
                        "**5th Offense:** `/ban` if they return and continue\n\n" +
                        "Adjust based on severity of violations!",
                    inline: false
                }
            ])
            .setColor("Red")
            .setFooter({ text: "💡 Tip: Document everything and be consistent with enforcement!" })
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
