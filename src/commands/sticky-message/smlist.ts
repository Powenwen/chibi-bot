import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import StickyMessage from "../../features/StickyMessage";

const MODE_LABELS: Record<string, string> = {
    "message-count": "🔢 Message Count",
    "interval": "⏱️ Interval",
    "persistent": "📌 Persistent"
};

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("smlist")
        .setDescription("List all sticky messages in this server")
        .setContexts([InteractionContextType.Guild])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall]),
    config: {
        category: "sticky-message",
        usage: "",
        examples: ["/smlist"],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        await interaction.deferReply();

        const allMessages = await StickyMessage.getStickyMessages(interaction.guild.id);

        if (!allMessages.length) {
            return interaction.followUp({
                content: "📭 No sticky messages configured in this server.",
                flags: MessageFlags.Ephemeral
            });
        }

        const enabled = allMessages.filter(sm => sm.enabled);
        const disabled = allMessages.filter(sm => !sm.enabled);

        const embed = new EmbedBuilder()
            .setTitle("📌 Sticky Messages")
            .setDescription(
                `**${allMessages.length}** sticky message${allMessages.length !== 1 ? "s" : ""} in this server\n` +
                `🟢 **${enabled.length}** enabled | 🔴 **${disabled.length}** disabled\n`
            )
            .setColor("Aqua")
            .setTimestamp();

        for (const sm of allMessages) {
            const modeLabel = MODE_LABELS[sm.mode] || sm.mode;
            const details: string[] = [];
            details.push(`**Channel:** <#${sm.channelID}>`);
            details.push(`**Mode:** ${modeLabel}`);
            if (sm.mode === "message-count" && sm.maxMessageCount > 0) {
                details.push(`**Repost after:** ${sm.maxMessageCount} messages`);
            }
            if (sm.mentionRoleID) {
                details.push(`**Mention:** <@&${sm.mentionRoleID}>`);
            }
            if (sm.title) {
                details.push(`**Title:** ${sm.title}`);
            }
            details.push(`**Created:** ${sm.createdAt.toLocaleDateString()}`);

            embed.addFields({
                name: `${sm.enabled ? "🟢" : "🔴"} \`${sm.uniqueID}\``,
                value: details.join("\n"),
                inline: false
            });
        }

        embed.setFooter({ text: "Use /smadd to create, /smedit to modify, /smdelete to remove" });

        await interaction.followUp({ embeds: [embed] });
    }
};
