import { 
    ChatInputCommandInteraction, 
    AutocompleteInteraction, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    InteractionContextType, 
    ApplicationIntegrationType, 
    MessageFlags 
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import StickyMessage from "../../features/StickyMessage";
import Utility from "../../structures/Utility";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("smedit")
        .setDescription("Edit a sticky message from the bot")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addSubcommand(subcommand =>
            subcommand
                .setName("title")
                .setDescription("Edit the title of the sticky message")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("The ID of the sticky message")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName("title")
                        .setDescription("The new title of the sticky message")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("color")
                .setDescription("Edit the color of the sticky message")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("The ID of the sticky message")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName("color")
                        .setDescription("The new color of the sticky message")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("maxmessagecount")
                .setDescription("Edit the maximum message count of the sticky message")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("The ID of the sticky message")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName("maxmessagecount")
                        .setDescription("The new maximum message count of the sticky message")
                        .setRequired(true)
                )
        ),
    config: {
        category: "sticky-message",
        usage: "<subcommand> [options]",
        examples: ["title 123456789012345678 New Title", "color 123456789012345678 Red", "maxmessagecount 123456789012345678 5"],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const options = interaction.options;
        const subcommand = options.getSubcommand(true);

        switch (subcommand) {
            case "title":
                const titleID = options.getString("id", true);
                const title = options.getString("title", true);

                const titleStickyMessage = await StickyMessage.getStickyMessageBy("uniqueID", titleID);
                if (!titleStickyMessage) {
                    return interaction.reply({
                        content: "I couldn't find a sticky message with that ID.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                await StickyMessage.updateStickyMessage(titleID, { title });

                const titleEmbed = new EmbedBuilder()
                    .setTitle("Sticky Message Title Edited")
                    .setDescription(`The title of the sticky message with ID \`${titleID}\` has been edited to \`${title}\`.`)
                    .setColor("Aqua")
                    .setTimestamp();

                interaction.reply({
                    embeds: [titleEmbed]
                });
                break;
            case "color":
                const colorID = options.getString("id", true);
                const color = options.getString("color", true);

                const colorStickyMessage = await StickyMessage.getStickyMessageBy("uniqueID", colorID);
                if (!colorStickyMessage) {
                    return interaction.reply({
                        content: "I couldn't find a sticky message with that ID.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                await StickyMessage.updateStickyMessage(colorID, { color });

                const colorEmbed = new EmbedBuilder()
                    .setTitle("Sticky Message Color Edited")
                    .setDescription(`The color of the sticky message with ID \`${colorID}\` has been edited to \`${color}\`.`)
                    .setColor("Aqua")
                    .setTimestamp();

                interaction.reply({
                    embeds: [colorEmbed]
                });
                break;
            case "maxmessagecount":
                const maxMessageCountID = options.getString("id", true);
                const maxMessageCount = options.getInteger("maxmessagecount", true);

                const maxMessageCountStickyMessage = await StickyMessage.getStickyMessageBy("uniqueID", maxMessageCountID);
                if (!maxMessageCountStickyMessage) {
                    return interaction.reply({
                        content: "I couldn't find a sticky message with that ID.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                await StickyMessage.updateStickyMessage(maxMessageCountID, { maxMessageCount });

                const maxMessageCountEmbed = new EmbedBuilder()
                    .setTitle("Sticky Message Max Message Count Edited")
                    .setDescription(`The maximum message count of the sticky message with ID \`${maxMessageCountID}\` has been edited to \`${maxMessageCount}\`.`)
                    .setColor("Aqua")
                    .setTimestamp();

                interaction.reply({
                    embeds: [maxMessageCountEmbed]
                });
                break;

            default:
                break;
        }
    },

    async autocomplete(interaction: AutocompleteInteraction) {
        const options = interaction.options;
        options.getSubcommand(true);
        const stickyMessages = await StickyMessage.getStickyMessages(interaction.guildId!);
        
        // Get all unique IDs
        const uniqueIDs = stickyMessages.map(sm => sm.uniqueID);
        const focused = options.getFocused();

        // Use utility function to filter and limit choices
        const choices = Utility.filterAutocompleteChoices(uniqueIDs, focused);

        await interaction.respond(choices);
    }
}