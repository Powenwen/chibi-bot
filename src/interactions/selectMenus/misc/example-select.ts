import { BaseSelectMenu } from "../../../interfaces";
import { StringSelectMenuInteraction, MessageFlags } from "discord.js";

/**
 * Example select menu handler demonstrating wildcard pattern matching
 * 
 * This select menu handler will match any select menu with customId starting with "example_select_"
 * Examples: example_select_role, example_select_channel, example_select_option
 * 
 * To use exact matching instead, replace the wildcard with a specific ID:
 * customId: "example_select_specific"
 */
export default <BaseSelectMenu>{
    customId: "example_select_*", // Wildcard pattern matching
    async execute(interaction: StringSelectMenuInteraction) {
        // Extract select menu type from customId
        const parts = interaction.customId.split("_");
        const selectType = parts.slice(2).join("_"); // Gets "role", "channel", etc.
        
        // Get selected values
        const selectedValues = interaction.values;
        
        await interaction.reply({
            content: `✅ Selection made!\nType: ${selectType}\nSelected: ${selectedValues.join(", ")}`,
            flags: MessageFlags.Ephemeral
        });
    }
};
