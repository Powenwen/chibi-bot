import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    TextChannel,
    MessageFlags,
    GuildMember
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import StickyMessage from "../../features/StickyMessage";
import Utility from "../../structures/Utility";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("smdelete")
        .setDescription("Delete a sticky message from the bot")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addStringOption(option =>
            option
                .setName("id")
                .setDescription("The ID of the sticky message")
                .setRequired(true)
                .setAutocomplete(true)
            ),
    config: {
        category: "sticky-message",
        usage: "<id>",
        examples: [
            "/delete-sticky-message hfV76d",
            "/delete-sticky-message AbC21r"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;
        const id = interaction.options.getString("id", true);

        if (id === "none") {
            return interaction.reply({
                content: "You do not have permission to use this command!",
                flags: MessageFlags.Ephemeral
            });
        }

        const stickyMessage = await StickyMessage.getStickyMessageBy("uniqueID", id);
        if (!stickyMessage) {
            return interaction.reply({
                content: "I couldn't find a sticky message with that ID.",
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("Sticky Message Deleted")
            .setDescription(`The sticky message with ID \`${id}\` has been deleted.`)
            .setColor("Red")
            .setTimestamp();

        await (interaction.guild.channels.cache.get(stickyMessage.channelID) as TextChannel).messages.fetch(stickyMessage.embedID).then(message => message.delete().catch(() => null));

        await stickyMessage.deleteOne();

        interaction.reply({
            embeds: [embed]
        });
    },

    async autocomplete(interaction: AutocompleteInteraction) {
        // Check permissions first
        if (!(interaction.member as GuildMember).permissions.has("Administrator")) {
            return interaction.respond([{ 
                name: "You do not have permission to use this command!", 
                value: "none" 
            }]);
        }

        const stickyMessages = await StickyMessage.getStickyMessages(interaction.guildId!);
        
        // Get all unique IDs
        const uniqueIDs = stickyMessages.map(sm => sm.uniqueID);
        const focused = interaction.options.getFocused();

        // Use utility function to filter and limit choices
        const choices = Utility.filterAutocompleteChoices(uniqueIDs, focused);

        await interaction.respond(choices);
    }
}