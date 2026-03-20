import { BaseModal } from "../../../interfaces";
import { ModalSubmitInteraction, MessageFlags } from "discord.js";

/**
 * Example modal handler demonstrating wildcard pattern matching
 * 
 * This modal handler will match any modal with customId starting with "example_modal_"
 * Examples: example_modal_feedback, example_modal_report, example_modal_suggestion
 * 
 * To use exact matching instead, replace the wildcard with a specific ID:
 * customId: "example_modal_specific"
 */
export default <BaseModal>{
    customId: "example_modal_*", // Wildcard pattern matching
    async execute(interaction: ModalSubmitInteraction) {
        // Extract modal type from customId
        const parts = interaction.customId.split("_");
        const modalType = parts.slice(2).join("_"); // Gets "feedback", "report", etc.
        
        // Get field values from the modal
        // Note: Field IDs should be consistent across modal instances
        const textInput = interaction.fields.getTextInputValue("input_field");
        
        await interaction.reply({
            content: `✅ Modal submitted!\nType: ${modalType}\nInput: ${textInput}`,
            flags: MessageFlags.Ephemeral
        });
    }
};
