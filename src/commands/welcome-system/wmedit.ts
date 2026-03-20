import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    ColorResolvable,
    ChannelType,

    ActionRowBuilder,
    ModalBuilder,
    ModalActionRowComponentBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import { BaseCommand } from '../../interfaces';
import WelcomeSystem from '../../features/WelcomeSystem';
import Logger from '../../features/Logger';

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("wmedit")
        .setDescription("Edit the welcome message for the server")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("channel")
                .setDescription("Edit the welcome channel")
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("The channel to send the welcome message to")
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("title")
                .setDescription("Edit the welcome title")
                .addStringOption((option) =>
                    option
                        .setName("title")
                        .setDescription("The title of the welcome message")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("description")
                .setDescription("Edit the welcome description")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("color")
                .setDescription("Edit the welcome color")
                .addStringOption((option) =>
                    option
                        .setName("color")
                        .setDescription("The color of the welcome message")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("thumbnail")
                .setDescription("Edit the welcome thumbnail")
                .addBooleanOption((option) =>
                    option
                        .setName("thumbnail")
                        .setDescription("Whether to show the welcome thumbnail")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("footer")
                .setDescription("Edit the welcome footer")
                .addBooleanOption((option) =>
                    option
                        .setName("enabled")
                        .setDescription("Whether to show the welcome footer")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("text")
                        .setDescription("The text of the welcome footer")
                        .setRequired(false)
                )
                .addBooleanOption((option) =>
                    option
                        .setName("timestamp")
                        .setDescription("Whether to show the timestamp in the welcome footer")
                        .setRequired(false)
                )
        ),
    config: {
        category: "welcome-system",
        usage: "/wmedit <subcommand>",
        examples: [
            "/wmedit channel #welcome",
            "/wmedit title Welcome!",
            "/wmedit description Welcome {user} to the server!",
            "/wmedit color Aqua",
            "/wmedit thumbnail true",
            "/wmedit footer true Welcome! false"
        ],
        permissions: ["Administrator"]
    },
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        try {
            const subcommand = interaction.options.getSubcommand();
            const guildID = interaction.guild.id;

            switch (subcommand) {
                case "channel": {
                    const channel = interaction.options.getChannel("channel", true);
                    if (channel.type !== ChannelType.GuildText) {
                        await interaction.reply({
                            content: "The channel must be a text channel.",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    await WelcomeSystem.editWelcomeMessage("channelID", channel.id, guildID);
                    await interaction.reply({
                        content: `The welcome channel has been set to <#${channel.id}>.`,
                        flags: MessageFlags.Ephemeral
                    });
                    break;
                }
                case "title": {
                    const title = interaction.options.getString("title", true);
                    if (title.length > 256) {
                        await interaction.reply({
                            content: "The title cannot be longer than 256 characters.",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }
                    await WelcomeSystem.editWelcomeMessage("title", title, guildID);
                    await interaction.reply({
                        content: `The welcome title has been set to \`${title}\`.`,
                        flags: MessageFlags.Ephemeral
                    });
                    break;
                }
                case "description": {
                    const modal = new ModalBuilder()
                        .setTitle("Edit Welcome Description")
                        .setCustomId("edit_description");

                    const descriptionInput = new TextInputBuilder()
                        .setPlaceholder("Enter the welcome description.")
                        .setCustomId("description")
                        .setRequired(true)
                        .setStyle(TextInputStyle.Paragraph)
                        .setLabel("Description");

                    const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>()
                        .addComponents(descriptionInput);

                    modal.addComponents(actionRow);

                    await interaction.showModal(modal);
                    break;
                }
                case "color": {
                    const color = interaction.options.getString("color", true);
                    try {
                        // Test if color is valid
                        new EmbedBuilder().setColor(color as ColorResolvable);
                        await WelcomeSystem.editWelcomeMessage("color", color, guildID);
                        await interaction.reply({
                            content: `The welcome color has been set to \`${color}\`.`,
                            flags: MessageFlags.Ephemeral
                        });
                    } catch (error) {
                        Logger.error(`Error setting welcome color: ${error instanceof Error ? error.message : String(error)}`);
                        await interaction.reply({
                            content: "Invalid color. Please use a valid color name or hex code.",
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    break;
                }
                case "thumbnail": {
                    const thumbnail = interaction.options.getBoolean("thumbnail", true);
                    await WelcomeSystem.editWelcomeMessage("thumbnail", thumbnail, guildID);
                    await interaction.reply({
                        content: `The welcome thumbnail has been set to \`${thumbnail}\`.`,
                        flags: MessageFlags.Ephemeral
                    });
                    break;
                }
                case "footer": {
                    const enabled = interaction.options.getBoolean("enabled", true);
                    const text = interaction.options.getString("text");
                    const timestamp = interaction.options.getBoolean("timestamp");

                    if (enabled === true) {
                        if (!text) {
                            await interaction.reply({
                                content: "Please provide the text for the welcome footer.",
                                flags: MessageFlags.Ephemeral
                            });
                            return;
                        }

                        if (text.length > 2048) {
                            await interaction.reply({
                                content: "The footer text cannot be longer than 2048 characters.",
                                flags: MessageFlags.Ephemeral
                            });
                            return;
                        }

                        await Promise.all([
                            WelcomeSystem.editWelcomeMessage("footer.enabled", enabled, guildID),
                            WelcomeSystem.editWelcomeMessage("footer.text", text, guildID),
                            timestamp ? WelcomeSystem.editWelcomeMessage("footer.timestamp", timestamp, guildID) : Promise.resolve()
                        ]);

                        const embed = new EmbedBuilder()
                            .setDescription("Welcome footer properties have been set.")
                            .addFields([
                                {
                                    name: "Enabled",
                                    value: `${enabled}`,
                                    inline: true
                                },
                                {
                                    name: "Text",
                                    value: text,
                                    inline: true
                                },
                                {
                                    name: "Timestamp",
                                    value: `${timestamp ?? false}`,
                                    inline: true
                                }
                            ])
                            .setColor("Green");

                        await interaction.reply({
                            embeds: [embed],
                            flags: MessageFlags.Ephemeral
                        });
                    } else {
                        await WelcomeSystem.editWelcomeMessage("footer.enabled", enabled, guildID);
                        await interaction.reply({
                            content: `The welcome footer has been set to \`${enabled}\`.`,
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    break;
                }

                default:
                    await interaction.reply({
                        content: "Invalid subcommand.",
                        flags: MessageFlags.Ephemeral
                    });
                    break;
            }
        } catch (error) {
            Logger.error(`Error in wmedit command: ${error}`);
            await interaction.reply({
                content: "An error occurred while editing the welcome message.",
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
}