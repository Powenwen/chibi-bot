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
import { CacheManager } from "../../utils/CacheManager";
import { CacheKeys } from "../../constants/CacheKeys";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("aresplist")
        .setDescription("List all auto-responders configured in this server")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "auto-responder",
        usage: "",
        examples: ["/aresplist"],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const now = performance.now();

        if (!interaction.guild) return;
        await interaction.deferReply();

        const cacheManager = CacheManager.getInstance();
        const cacheKey = CacheKeys.autoResponder.list(interaction.guild.id);

        // Try cache first
        let autoResponders: any[] | null = await cacheManager.get<any[]>(cacheKey);

        if (!autoResponders) {
            autoResponders = await AutoResponderModel.find({ guildID: interaction.guild.id });

            if (!autoResponders.length) {
                return interaction.followUp({
                    content: "📭 No auto-responders configured in this server.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Cache for 5 minutes
            await cacheManager.set(cacheKey, autoResponders, 300);
        }

        // Group by channel
        const channelGroups = new Map<string, any[]>();
        for (const ar of autoResponders) {
            if (!channelGroups.has(ar.channelID)) {
                channelGroups.set(ar.channelID, []);
            }
            channelGroups.get(ar.channelID)!.push(ar);
        }

        const embeds: EmbedBuilder[] = [];
        let currentEmbed = new EmbedBuilder()
            .setTitle("🤖 Auto-Responders")
            .setDescription(
                `**${autoResponders.length} responder(s)** across **${channelGroups.size} channel(s)**\n` +
                `Auto-responders reply automatically when a message matches a trigger.\n`
            )
            .setColor("Aqua")
            .setTimestamp();

        let fieldCount = 0;

        for (const [channelID, responders] of channelGroups) {
            if (fieldCount >= 24) {
                embeds.push(currentEmbed);
                currentEmbed = new EmbedBuilder()
                    .setTitle("🤖 Auto-Responders (continued)")
                    .setColor("Aqua")
                    .setTimestamp();
                fieldCount = 0;
            }

            let triggersText = "";
            for (let i = 0; i < responders.length; i++) {
                const r = responders[i];
                const responsePreview = r.response.length > 100
                    ? r.response.substring(0, 97) + "..."
                    : r.response;

                const tags: string[] = [];
                if (r.caseSensitive) tags.push("CS");
                if (r.exactMatch) tags.push("EM");
                if (r.useRegex) tags.push("Regex");
                if (r.useEmbed) tags.push("Embed");
                if (r.cooldown > 0) tags.push(`CD:${r.cooldown}s`);

                const tagsText = tags.length > 0 ? ` [${tags.join(", ")}]` : "";

                triggersText += `**${i + 1}.** \`${r.trigger}\`${tagsText}\n`;
                triggersText += `└ → ${responsePreview}\n`;

                if (r.useEmbed && r.embedTitle) {
                    triggersText += `└ Title: ${r.embedTitle}\n`;
                }
                triggersText += `└ By: <@${r.authorID || "Unknown"}>\n`;

                if (i < responders.length - 1) triggersText += "\n";
            }

            currentEmbed.addFields({
                name: `📍 <#${channelID}> (${responders.length})`,
                value: triggersText.length > 1024 ? triggersText.substring(0, 1021) + "..." : triggersText,
                inline: false
            });

            fieldCount++;
        }

        embeds.push(currentEmbed);

        const end = performance.now();
        const duration = (end - now).toFixed(2);
        embeds[embeds.length - 1].setFooter({ text: `Took ${duration}ms • Use /arespadd to add, /arespdelete to remove` });

        if (embeds.length === 1) {
            await interaction.followUp({ embeds: [embeds[0]] });
        } else {
            for (const embed of embeds) {
                await interaction.followUp({ embeds: [embed] });
            }
        }
    }
};
