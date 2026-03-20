import { BaseButton } from "../../../interfaces";
import { ButtonInteraction, MessageFlags } from "discord.js";

/**
 * Example button handler demonstrating wildcard pattern matching
 * 
 * This button handler will match any button with customId starting with "example_"
 * Examples: example_test, example_action, example_anything
 * 
 * To use exact matching instead, replace the wildcard with a specific ID:
 * customId: "example_specific_button"
 */
export default <BaseButton>{
    customId: "example_*", // Wildcard pattern matching
    async execute(interaction: ButtonInteraction) {
        // Extract data from customId if needed
        const parts = interaction.customId.split("_");
        const action = parts[1]; // Gets "test", "action", etc.
        
        await interaction.reply({
            content: `✅ Button clicked! Action: ${action}`,
            flags: MessageFlags.Ephemeral
        });
    }
};
