import { BaseCommand } from "../../interfaces";
import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    AutocompleteInteraction,
    APIEmbedField,
    RestOrArray,
    InteractionContextType,
    ApplicationIntegrationType,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import Logger from "../../features/Logger";
import ChibiClient from "../../structures/Client";
import Utility from "../../structures/Utility";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Displays a list of commands or information about a specific command.")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addSubcommand(subcommand =>
            subcommand
                .setName("all")
                .setDescription("Displays a list of all commands.")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("command")
                .setDescription("Displays information about a specific command.")
                .addStringOption(option =>
                    option
                        .setName("command")
                        .setDescription("The command to display information about.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("category")
                .setDescription("Displays a list of commands in a specific category.")
                .addStringOption(option =>
                    option
                        .setName("category")
                        .setDescription("The category to display commands for.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),
    config: {
        category: "info",
        usage: "/help",
        examples: ["/help all", "/help command ban", "/help category moderation"],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const options = interaction.options;
        const client = interaction.client as ChibiClient;
        const subcommand = options.getSubcommand();

        if (subcommand === "all") {
            const commands = client.commands.map(command => command);
            let categories = [...new Set(commands.map(command => command.config.category))];
            
            // Filter out dev category for non-owners
            if (!client.config.owners.includes(interaction.user.id)) {
                categories = categories.filter(cat => cat !== "dev");
            }
            
            let fields: RestOrArray<APIEmbedField> = [];

            for (const category of categories) {
                const categoryCommands = commands.filter(command => command.config.category === category);
                
                // Skip dev commands for non-owners
                if (category === "dev" && !client.config.owners.includes(interaction.user.id)) {
                    continue;
                }
                
                fields.push({
                    name: `${category.replace(/-/g, ' ').split(' ').map(word => Utility.capitalize(word)).join(' ')} (${categoryCommands.length})`,
                    value: categoryCommands
                        .sort((a, b) => a.data.name.localeCompare(b.data.name))
                        .map(command => `\`${command.data.name}\``)
                        .join(", ") || "No commands available.",
                    inline: false
                });
            }

            if (fields.length > 25) {
                Logger.warn("Too many categories to display in one embed.");
                return interaction.reply({ content: "There are too many categories to display in one embed.", flags: MessageFlags.Ephemeral });
            }

            const embed = new EmbedBuilder()
                .setTitle("🔍 Need help? Here's a list of commands.")
                .setDescription("To get more information about a specific command, use `/help command <command>`.\nTo get a list of commands in a specific category, use `/help category <category>`.")
                .addFields(fields)
                .setColor("Aqua")
                .setFooter({ text: `Total commands: ${commands.filter(c => client.config.owners.includes(interaction.user.id) || c.config.category !== "dev").length}` })
                .setTimestamp();

            // Create action rows with category buttons
            const actionRows: ActionRowBuilder<ButtonBuilder>[] = [];
            const buttonsPerRow = 4;
            
            // Map categories to their emojis
            const categoryEmojis: Record<string, string> = {
                'moderation': '🛡️',
                'fun': '🎉',
                'utility': '🔧',
                'info': 'ℹ️',
                'admin': '⚙️',
                'role-management': '👥',
                'sticky-message': '📌',
                'auto-reaction': '⚡',
                'auto-responder': '💬',
                'suggestion-system': '💡',
                'welcome-system': '👋'
            };

            // Create buttons for each category
            const buttons: ButtonBuilder[] = [];
            for (const category of categories) {
                const button = new ButtonBuilder()
                    .setCustomId(`help_${category}`)
                    .setLabel(category.split('-').map(word => Utility.capitalize(word)).join(' '))
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(categoryEmojis[category] || '📝');
                
                buttons.push(button);
            }

            // Split buttons into rows of 4
            for (let i = 0; i < buttons.length; i += buttonsPerRow) {
                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(buttons.slice(i, i + buttonsPerRow));
                actionRows.push(row);
            }

            await interaction.reply({ embeds: [embed], components: actionRows });
        }

        if (subcommand === "command") {
            const commandName = options.getString("command");

            const command = client.commands.get(commandName as string);

            if (!command) {
                return interaction.reply({ content: "❌ That command does not exist.", flags: MessageFlags.Ephemeral });
            }

            if (command.config.category === "dev" && !client.config.owners.includes(interaction.user.id)) {
                return interaction.reply({ content: "❌ You do not have permission to view this command.", flags: MessageFlags.Ephemeral });
            }

            const embed = new EmbedBuilder()
                .setTitle(`📖 Command: ${command.data.name}`)
                .setDescription(command.data.description)
                .addFields([
                    {
                        name: "📂 Category",
                        value: `\`${command.config.category.replace(/-/g, ' ').split(' ').map(word => Utility.capitalize(word)).join(' ')}\``,
                        inline: true
                    },
                    {
                        name: "🔐 Permissions",
                        value: `${command.config.permissions.length ? command.config.permissions.map(permission => `\`${permission}\``).join(", ") : "No permissions required."}`,
                        inline: true
                    },
                    {
                        name: "💡 Usage",
                        value: `\`/${command.data.name} ${command.config.usage}\``,
                        inline: false
                    },
                    {
                        name: "📋 Examples",
                        value: `${command.config.examples.length ? command.config.examples.map(example => `\`${example}\``).join("\n") : "No examples provided."}`,
                        inline: false
                    }
                ])
                .setColor("Aqua")
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }

        if (subcommand === "category") {
            const category = Utility.capitalize(options.getString("category") as string);

            const commands = client.commands.filter(command => command.config.category === category.toLowerCase());

            if (!commands.size) {
                return interaction.reply({ content: "❌ That category does not exist or has no commands.", flags: MessageFlags.Ephemeral });
            }

            if (!client.config.owners.includes(interaction.user.id) && category.toLowerCase() === "dev") {
                return interaction.reply({ content: "❌ You do not have permission to view this category.", flags: MessageFlags.Ephemeral });
            }

            const embed = new EmbedBuilder()
                .setTitle(`📂 Category: ${category.replace(/-/g, ' ').split(' ').map(word => Utility.capitalize(word)).join(' ')}`)
                .setDescription(`Here are all the commands in the **${category.replace(/-/g, ' ').split(' ').map(word => Utility.capitalize(word)).join(' ')}** category.`)
                .addFields(commands.map(command => ({
                    name: `/${command.data.name}`,
                    value: `${command.data.description}`,
                    inline: true
                }))
                    .sort((a, b) => a.name.localeCompare(b.name))
                )
                .setColor("Aqua")
                .setFooter({ text: `${commands.size} commands in this category` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    },

    async autocomplete(interaction: AutocompleteInteraction) {
        const options = interaction.options;
        const subcommand = options.getSubcommand();
        const client = interaction.client as ChibiClient;

        if (subcommand === "command") {
            let commands = client.commands.map((c) => c.data.name);

            // Filter out dev commands if user is not a dev
            if (!client.config.owners.includes(interaction.user.id)) {
                commands = commands.filter(name =>
                    client.commands.get(name)?.config.category !== "dev"
                );
            }

            const focused = interaction.options.getFocused();
            const choices = Utility.filterAutocompleteChoices(commands, focused);

            await interaction.respond(choices);
        }

        if (subcommand === "category") {
            let categories = [...new Set(client.commands.map(command => command.config.category))];

            // Filter out dev category if user is not a dev
            if (!client.config.owners.includes(interaction.user.id)) {
                categories = categories.filter(c => c !== "dev");
            }

            const focused = interaction.options.getFocused();
            const choices = Utility.filterAutocompleteChoices(categories, focused);

            await interaction.respond(choices);
        }
    }
};