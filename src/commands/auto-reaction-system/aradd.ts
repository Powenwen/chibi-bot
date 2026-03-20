import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    ChannelType,
    EmbedBuilder,
    MessageFlags
} from "discord.js";
import { BaseCommand } from "../../interfaces";
import AutoReactionModel, { IEmojiReaction } from "../../models/AutoReactionModel";
import Logger from "../../features/Logger";
import { redis } from "../../features/RedisDB";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("aradd")
        .setDescription("Adds an auto reaction to the bot")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("The channel you want the auto reaction to be in")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption(option =>
            option
                .setName("emojis")
                .setDescription("The emojis you want to react with (separated by space)")
                .setRequired(true)
        )
    ,
    config: {
        category: "auto-reaction",
        usage: "<channel ID> <emojis>",
        examples: [
            "add-auto-reaction 123456789012345678 😄",
            "add-auto-reaction 123456789012345678 <:animatedemoji>",
            "add-auto-reaction 123456789012345678 😄 <:animatedemoji>"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const options = interaction.options;
            const channel = options.getChannel("channel", true, [ChannelType.GuildText]);
            const emojis = options.getString("emojis", true);

            if (!channel || !emojis) return;

            const emojisArray = emojis.split(" ").filter(emoji => emoji.trim());

            if (emojisArray.length === 0) {
                return interaction.reply({
                    content: "Please provide at least one valid emoji.",
                    flags: MessageFlags.Ephemeral
                });
            }

            if (emojisArray.length > 20) {
                return interaction.reply({
                    content: "You can only add up to 20 emojis per auto reaction.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Parse and validate emojis
            const parsedEmojis: IEmojiReaction[] = [];
            const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|<a?:.+?:\d{17,19}>)$/;
            
            for (const emoji of emojisArray) {
                const customEmojiMatch = emoji.match(/<(a?):(.+?):(\d{17,19})>/);
                
                if (customEmojiMatch) {
                    // Custom emoji
                    const animated = customEmojiMatch[1] === 'a';
                    const name = customEmojiMatch[2];
                    const emojiId = customEmojiMatch[3];
                    
                    if (!interaction.guild.emojis.cache.has(emojiId)) {
                        return interaction.reply({
                            content: `Custom emoji \`${emoji}\` is not from this server.`,
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    
                    parsedEmojis.push({
                        emojiID: emojiId,
                        name,
                        animated,
                        isUnicode: false,
                        raw: emoji
                    });
                } else if (emojiRegex.test(emoji)) {
                    // Unicode emoji
                    parsedEmojis.push({
                        name: emoji,
                        animated: false,
                        isUnicode: true,
                        raw: emoji
                    });
                } else {
                    return interaction.reply({
                        content: `Invalid emoji: \`${emoji}\``,
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            // Check if auto reaction already exists for this channel
            const existingAutoReaction = await AutoReactionModel.findOne({
                guildID: interaction.guild.id,
                channelID: channel.id
            });

            if (existingAutoReaction) {
                return interaction.reply({
                    content: "Auto reaction already exists in this channel. Please delete it first or use a different channel.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Create new auto reaction
            const newAutoReaction = new AutoReactionModel({
                guildID: interaction.guild.id,
                channelID: channel.id,
                emojis: parsedEmojis,
                authorID: interaction.user.id
            });

            await newAutoReaction.save();

            // Clear cache
            await redis.del(`guild:${interaction.guildId}`);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Auto Reaction Added")
                        .setDescription(`Auto reaction has been added to <#${channel.id}>`)
                        .addFields([
                            {
                                name: "Emojis",
                                value: parsedEmojis.map(e => e.raw).join(" ")
                            },
                            {
                                name: "Author",
                                value: `<@${interaction.user.id}>`,
                                inline: true
                            },
                            {
                                name: "Total Emojis",
                                value: `${parsedEmojis.length}`,
                                inline: true
                            }
                        ])
                        .setColor("Green")
                        .setTimestamp()
                ]
            });
        } catch (error) {
            Logger.error(`Error in aradd command: ${error}`);
            await interaction.reply({
                content: "An error occurred while adding the auto reaction.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};