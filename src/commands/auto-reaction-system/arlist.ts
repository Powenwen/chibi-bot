import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import AutoReactionModel from "../../models/AutoReactionModel";
import { CacheManager } from "../../utils/CacheManager";
import { CacheKeys } from "../../constants/CacheKeys";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("arlist")
        .setDescription("List all auto-reactions configured in this server")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "auto-reaction",
        usage: "",
        examples: ["/arlist"],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const now = performance.now();

        if (!interaction.guild) return;
        await interaction.deferReply();

        const cacheManager = CacheManager.getInstance();
        const cacheKey = CacheKeys.autoReaction.list(interaction.guild.id);

        // Try cache first
        let autoReactions: any[] | null = await cacheManager.get<any[]>(cacheKey);

        if (!autoReactions) {
            autoReactions = await AutoReactionModel.find({ guildID: interaction.guild.id });

            if (!autoReactions || autoReactions.length === 0) {
                return interaction.followUp({
                    content: "📭 No auto-reactions configured in this server.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Cache for 5 minutes
            await cacheManager.set(cacheKey, autoReactions, 300);
        }

        const totalEmojis = autoReactions.reduce((sum: number, ar: any) => sum + (ar.emojis?.length ?? 0), 0);

        const embed = new EmbedBuilder()
            .setTitle("🎭 Auto-Reactions")
            .setDescription(
                `**${autoReactions.length} channel(s)** | **${totalEmojis} total emoji(s)**\n` +
                `Auto-reactions add emoji reactions to every message in configured channels.\n`
            )
            .setColor("Aqua")
            .setTimestamp();

        for (const autoReaction of autoReactions) {
            const emojiDisplay = autoReaction.emojis?.length > 0
                ? autoReaction.emojis.map((e: any) => e.raw || e.name || "❓").join(" ")
                : "No emojis";

            const details: string[] = [];
            details.push(`**Emojis:** ${emojiDisplay}`);
            details.push(`**Count:** ${autoReaction.emojis?.length ?? 0}`);
            details.push(`**Author:** <@${autoReaction.authorID || "Unknown"}>`);

            if (autoReaction.cooldown > 0) {
                details.push(`**Cooldown:** ${autoReaction.cooldown}s`);
            }
            if (autoReaction.ignoreBots !== undefined) {
                details.push(`**Ignore Bots:** ${autoReaction.ignoreBots ? "Yes" : "No"}`);
            }

            embed.addFields({
                name: `📍 <#${autoReaction.channelID}>`,
                value: details.join("\n"),
                inline: false
            });
        }

        const end = performance.now();
        const duration = (end - now).toFixed(2);

        embed.setFooter({ text: `Took ${duration}ms • Use /aradd to add, /ardelete to remove` });

        await interaction.followUp({ embeds: [embed] });
    }
}