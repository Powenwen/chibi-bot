/* eslint-disable no-undef */
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
import { redis } from "../../features/RedisDB";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("arlist")
        .setDescription("List all auto reactions from the bot")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ]),
    config: {
        category: "auto-reaction",
        usage: "",
        examples: [""],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const now = performance.now();

        if (!interaction.guild) return;
        await interaction.deferReply();

        const guild = await redis.get(`guild:${interaction.guildId}`);

        let autoReactions;

        const embed = new EmbedBuilder()
            .setTitle("Auto Reactions")
            .setDescription("Here is a list of all auto reactions in this server.\n")
            .setColor("Aqua")
            .setTimestamp();

        if (guild) {
            autoReactions = (JSON.parse(guild) as any).autoReactions;
        } else {
            autoReactions = await AutoReactionModel.find({ guildID: interaction.guildId });

            if (!autoReactions.length) {
                return interaction.followUp({
                    content: "There are no auto reactions in this server.",
                    flags: MessageFlags.Ephemeral
                });
            }

            await redis.set(`guild:${interaction.guildId}`, JSON.stringify({ autoReactions }), "EX", 60);
        }

        for (const autoReaction of autoReactions) {
            const emojiDisplay = autoReaction.emojis?.length > 0 
                ? (Array.isArray(autoReaction.emojis[0]) 
                    ? autoReaction.emojis.join(" ") // Old format: array of strings
                    : autoReaction.emojis.map((e: any) => e.raw || e.name || e).join(" ")) // New format: array of objects
                : "No emojis";
                
            embed.addFields(
                {
                    name: `Channel: <#${autoReaction.channelID}>`,
                    value: `Emojis: ${emojiDisplay}\nAuthor: <@${autoReaction.authorID || 'Unknown'}>`,
                    inline: false
                }
            );
        }

        const end = performance.now();
        const duration = (end - now).toFixed(2)

        embed.setFooter({ text: `Took ${duration}ms` });

        interaction.followUp({
            embeds: [embed]
        });
    }
}