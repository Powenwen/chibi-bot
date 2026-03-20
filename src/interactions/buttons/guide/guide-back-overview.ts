import { BaseButton } from "../../../interfaces";
import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";

export default <BaseButton>{
    customId: "guide_back_overview",
    async execute(interaction: ButtonInteraction) {
        const embed = new EmbedBuilder()
            .setTitle("🤖 Welcome to Chibi Bot Setup Guide!")
            .setDescription(
                "I'm here to help you set up and use all of Chibi Bot's features. Use `/guide <system>` to learn about a specific system!\n\n" +
                "**Available Systems:**"
            )
            .addFields([
                {
                    name: "🛡️ Auto-Moderation",
                    value: "Automatically moderate spam, bad words, links, and more to keep your server safe.",
                    inline: true
                },
                {
                    name: "💬 Auto-Responder",
                    value: "Set up automatic responses to specific triggers in your channels.",
                    inline: true
                },
                {
                    name: "⚡ Auto-Reaction",
                    value: "Automatically react to messages in specific channels with emojis.",
                    inline: true
                },
                {
                    name: "📌 Sticky Messages",
                    value: "Keep important messages pinned at the bottom of your channels.",
                    inline: true
                },
                {
                    name: "👋 Welcome System",
                    value: "Greet new members with customizable welcome messages.",
                    inline: true
                },
                {
                    name: "💡 Suggestion System",
                    value: "Let your members suggest ideas and vote on them.",
                    inline: true
                },
                {
                    name: "⚖️ Moderation Tools",
                    value: "Powerful moderation commands to manage your server.",
                    inline: true
                },
                {
                    name: "👥 Role Management",
                    value: "Easily manage member roles with simple commands.",
                    inline: true
                }
            ])
            .setColor("Blurple")
            .setFooter({ text: "💡 Tip: Use the dropdown menu below to explore each system!" })
            .setTimestamp();

        const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('guide_select_system')
                    .setPlaceholder('📚 Choose a system to learn about')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Auto-Moderation')
                            .setDescription('Protect your server with automated moderation')
                            .setValue('auto-moderation')
                            .setEmoji('🛡️'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Auto-Responder')
                            .setDescription('Automatically respond to messages')
                            .setValue('auto-responder')
                            .setEmoji('💬'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Auto-Reaction')
                            .setDescription('Automatically add reactions to messages')
                            .setValue('auto-reaction')
                            .setEmoji('⚡'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Sticky Messages')
                            .setDescription('Keep important messages at the bottom')
                            .setValue('sticky-messages')
                            .setEmoji('📌'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Welcome System')
                            .setDescription('Greet new members automatically')
                            .setValue('welcome-system')
                            .setEmoji('👋'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Suggestion System')
                            .setDescription('Let members suggest ideas')
                            .setValue('suggestion-system')
                            .setEmoji('💡'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Moderation')
                            .setDescription('Manage your server effectively')
                            .setValue('moderation')
                            .setEmoji('⚖️'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Role Management')
                            .setDescription('Manage member roles')
                            .setValue('role-management')
                            .setEmoji('👥')
                    )
            );

        await interaction.update({
            embeds: [embed],
            components: [selectMenu]
        });
    }
};
