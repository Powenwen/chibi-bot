import { BaseButton } from "../../../interfaces";
import { ButtonInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import ChibiClient from "../../../structures/Client";
import Utility from "../../../structures/Utility";

export default <BaseButton>{
    customId: "help_*", // Wildcard to match any help_category button
    async execute(interaction: ButtonInteraction) {
        const client = interaction.client as ChibiClient;
        
        // Extract category from customId (e.g., help_moderation -> moderation)
        const parts = interaction.customId.split("_");
        if (parts.length < 2) {
            return interaction.reply({ 
                content: "❌ Invalid button ID format.", 
                flags: MessageFlags.Ephemeral 
            });
        }
        
        const categoryName = parts.slice(1).join("_"); // Support categories with underscores
        
        const commands = client.commands.filter(command => command.config.category === categoryName);
        
        if (!commands.size) {
            return interaction.reply({ 
                content: `❌ No commands found in the **${categoryName}** category.`, 
                flags: MessageFlags.Ephemeral 
            });
        }

        // Check permissions for dev category
        if (categoryName === "dev" && !client.config.owners.includes(interaction.user.id)) {
            return interaction.reply({ 
                content: "❌ You do not have permission to view this category.", 
                flags: MessageFlags.Ephemeral 
            });
        }

        // Format category name with proper capitalization
        const formattedCategory = categoryName
            .split('-')
            .map(word => Utility.capitalize(word))
            .join(' ');

        const embed = new EmbedBuilder()
            .setTitle(`📂 ${formattedCategory} Commands`)
            .setDescription(`Here are all the **${formattedCategory}** commands:`)
            .addFields(commands.map(command => ({
                name: `/${command.data.name}`,
                value: command.data.description || "No description provided.",
                inline: true
            }))
                .sort((a, b) => a.name.localeCompare(b.name))
            )
            .setColor("Aqua")
            .setFooter({ text: `${commands.size} command${commands.size !== 1 ? 's' : ''} in this category` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
};