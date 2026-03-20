import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import AutoResponderModel from "../../models/AutoResponderModel";
import { redis } from "../../features/RedisDB";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("aresplist")
        .setDescription("List all auto responders from the bot")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "auto-responder",
        usage: "",
        examples: [""],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const now = performance.now();

        if (!interaction.guild) return;
        await interaction.deferReply();

        const guild = await redis.get(`autoresponder:${interaction.guildId}`);

        let autoResponders: any[];

        if (guild) {
            autoResponders = (JSON.parse(guild) as any).autoResponders;
        } else {
            autoResponders = await AutoResponderModel.find({ guildID: interaction.guildId });

            if (!autoResponders.length) {
                return interaction.followUp({
                    content: "There are no auto responders in this server.",
                    flags: MessageFlags.Ephemeral
                });
            }

            await redis.set(`autoresponder:${interaction.guildId}`, JSON.stringify({ autoResponders }), "EX", 60);
        }

        // Group auto responders by channel
        const channelGroups = new Map<string, any[]>();
        
        for (const autoResponder of autoResponders) {
            if (!channelGroups.has(autoResponder.channelID)) {
                channelGroups.set(autoResponder.channelID, []);
            }
            channelGroups.get(autoResponder.channelID)!.push(autoResponder);
        }

        const embeds: EmbedBuilder[] = [];
        let currentEmbed = new EmbedBuilder()
            .setTitle("Auto Responders")
            .setDescription(`Here are all auto responders in this server, grouped by channel.\n**Total:** ${autoResponders.length} responder(s) across ${channelGroups.size} channel(s)\n`)
            .setColor("Aqua")
            .setTimestamp();

        let fieldCount = 0;

        // Iterate through each channel group
        for (const [channelID, responders] of channelGroups) {
            // If we're approaching the field limit, create a new embed
            if (fieldCount >= 24) {
                embeds.push(currentEmbed);
                currentEmbed = new EmbedBuilder()
                    .setTitle("Auto Responders (continued)")
                    .setColor("Aqua")
                    .setTimestamp();
                fieldCount = 0;
            }

            // Build the triggers list for this channel
            let triggersText = "";
            for (let i = 0; i < responders.length; i++) {
                const responder = responders[i];
                const responsePreview = responder.response.length > 100 
                    ? responder.response.substring(0, 97) + "..." 
                    : responder.response;
                
                const options = [];
                if (responder.caseSensitive) options.push("CS");
                if (responder.exactMatch) options.push("EM");
                if (responder.useEmbed) options.push("Embed");
                const optionsText = options.length > 0 ? ` [${options.join(", ")}]` : "";
                
                triggersText += `**${i + 1}.** Trigger: \`${responder.trigger}\`${optionsText}\n`;
                triggersText += `└ Response: ${responsePreview}\n`;
                
                if (responder.useEmbed && responder.embedTitle) {
                    triggersText += `└ Title: ${responder.embedTitle}\n`;
                }
                if (responder.useEmbed) {
                    triggersText += `└ Color: ${responder.embedColor || "#5865F2"}\n`;
                }
                
                triggersText += `└ Author: <@${responder.authorID || 'Unknown'}>\n`;
                
                // Add spacing between items
                if (i < responders.length - 1) {
                    triggersText += "\n";
                }
            }

            // Add field for this channel
            currentEmbed.addFields({
                name: `📍 <#${channelID}> (${responders.length} responder${responders.length !== 1 ? 's' : ''})`,
                value: triggersText.length > 1024 ? triggersText.substring(0, 1021) + "..." : triggersText,
                inline: false
            });

            fieldCount++;
        }

        // Add the last embed
        embeds.push(currentEmbed);

        const end = performance.now();
        const duration = (end - now).toFixed(2);

        // Add footer to the last embed
        embeds[embeds.length - 1].setFooter({ text: `Took ${duration}ms` });

        // Send all embeds
        if (embeds.length === 1) {
            await interaction.followUp({ embeds: [embeds[0]] });
        } else {
            // If multiple embeds, send them all
            for (const embed of embeds) {
                await interaction.followUp({ embeds: [embed] });
            }
        }
    }
};
