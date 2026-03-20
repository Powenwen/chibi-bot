import { ButtonInteraction, MessageFlags } from "discord.js";
import { BaseButton } from "../../../interfaces";

export default <BaseButton>{
    customId: "ping",
    async execute(interaction: ButtonInteraction) {
        await interaction.reply({ content: "Pong!", flags: MessageFlags.Ephemeral });
    }
}