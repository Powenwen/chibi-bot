import { MessageFlags, ModalSubmitInteraction, EmbedBuilder } from "discord.js";
import { BaseModal } from "../../../interfaces";
import WelcomeSystem from "../../../features/WelcomeSystem";

export default <BaseModal>{
    customId: "edit_description",
    async execute(interaction: ModalSubmitInteraction) {
        if (!interaction.guild) return;

        const description = interaction.fields.getTextInputValue("description");

        if (!description) {
            await interaction.reply({ content: "You must provide a description.", flags: MessageFlags.Ephemeral });
            return;
        }

        if (description.length > 4096) {
            await interaction.reply({ content: "The description must be less than or equal to 2048 characters.", flags: MessageFlags.Ephemeral });
            return;
        }

        const guildID = interaction.guild.id;

        await WelcomeSystem.editWelcomeMessage("description", description, guildID);

        const embed = new EmbedBuilder()
            .setTitle("Welcome Message Description Updated")
            .setDescription(`The welcome message description has been updated to:\n\`\`\`${description}\`\`\``)
            .setColor("Green");

        await interaction.reply({ content: "Successfully updated the welcome message description.", embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}