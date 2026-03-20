import { BaseCommand } from "../../interfaces";
import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from "discord.js";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("guide")
        .setDescription("Interactive guide to help you set up and use Chibi Bot's features")
        .setContexts([
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall
        ])
        .addSubcommand(subcommand =>
            subcommand
                .setName("overview")
                .setDescription("Get an overview of all available systems")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("auto-moderation")
                .setDescription("Learn how to set up auto-moderation")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("auto-responder")
                .setDescription("Learn how to set up auto-responders")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("auto-reaction")
                .setDescription("Learn how to set up auto-reactions")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("sticky-messages")
                .setDescription("Learn how to set up sticky messages")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("welcome-system")
                .setDescription("Learn how to set up the welcome system")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("suggestion-system")
                .setDescription("Learn how to set up the suggestion system")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("moderation")
                .setDescription("Learn how to use moderation commands")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("role-management")
                .setDescription("Learn how to manage roles")
        ),
    config: {
        category: "info",
        usage: "<system>",
        examples: [
            "/guide overview",
            "/guide auto-moderation",
            "/guide auto-responder",
            "/guide welcome-system"
        ],
        permissions: []
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();

        // Main menu select
        const createMainMenu = () => {
            return new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('guide_select_system')
                        .setPlaceholder('📚 Choose a system to learn about')
                        .addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Auto-Moderation')
                                .setDescription('Protect your server with automated moderation')
                                .setValue('auto-moderation')
                                .setEmoji('🛡️'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Auto-Responder')
                                .setDescription('Automatically respond to messages')
                                .setValue('auto-responder')
                                .setEmoji('💬'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Auto-Reaction')
                                .setDescription('Automatically add reactions to messages')
                                .setValue('auto-reaction')
                                .setEmoji('⚡'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Sticky Messages')
                                .setDescription('Keep important messages at the bottom')
                                .setValue('sticky-messages')
                                .setEmoji('📌'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Welcome System')
                                .setDescription('Greet new members automatically')
                                .setValue('welcome-system')
                                .setEmoji('👋'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Suggestion System')
                                .setDescription('Let members suggest ideas')
                                .setValue('suggestion-system')
                                .setEmoji('💡'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Moderation')
                                .setDescription('Manage your server effectively')
                                .setValue('moderation')
                                .setEmoji('⚖️'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Role Management')
                                .setDescription('Manage member roles')
                                .setValue('role-management')
                                .setEmoji('👥')
                        )
                );
        };

        switch (subcommand) {
            case "overview":
                await handleOverview(interaction, createMainMenu());
                break;
            case "auto-moderation":
                await handleAutoModeration(interaction);
                break;
            case "auto-responder":
                await handleAutoResponder(interaction);
                break;
            case "auto-reaction":
                await handleAutoReaction(interaction);
                break;
            case "sticky-messages":
                await handleStickyMessages(interaction);
                break;
            case "welcome-system":
                await handleWelcomeSystem(interaction);
                break;
            case "suggestion-system":
                await handleSuggestionSystem(interaction);
                break;
            case "moderation":
                await handleModeration(interaction);
                break;
            case "role-management":
                await handleRoleManagement(interaction);
                break;
        }
    }
};

async function handleOverview(interaction: ChatInputCommandInteraction, selectMenu: ActionRowBuilder<StringSelectMenuBuilder>) {
    const embed = new EmbedBuilder()
        .setTitle("🤖 Welcome to Chibi Bot Setup Guide!")
        .setDescription(
            "I'm here to help you set up and use all of Chibi Bot's features. Select a system below to get started!\n\n" +
            "**Available Systems:**"
        )
        .addFields([
            {
                name: "🛡️ Auto-Moderation",
                value: "Automatically moderate spam, bad words, links, and more to keep your server safe.",
                inline: true
            },
            {
                name: "💬 Auto-Responder",
                value: "Set up automatic responses to specific triggers in your channels.",
                inline: true
            },
            {
                name: "⚡ Auto-Reaction",
                value: "Automatically react to messages in specific channels with emojis.",
                inline: true
            },
            {
                name: "📌 Sticky Messages",
                value: "Keep important messages pinned at the bottom of your channels.",
                inline: true
            },
            {
                name: "👋 Welcome System",
                value: "Greet new members with customizable welcome messages.",
                inline: true
            },
            {
                name: "💡 Suggestion System",
                value: "Let your members suggest ideas and vote on them.",
                inline: true
            },
            {
                name: "⚖️ Moderation Tools",
                value: "Powerful moderation commands to manage your server.",
                inline: true
            },
            {
                name: "👥 Role Management",
                value: "Easily manage member roles with simple commands.",
                inline: true
            }
        ])
        .setColor("Blurple")
        .setFooter({ text: "💡 Tip: Use the dropdown menu below to explore each system!" })
        .setTimestamp();

    await interaction.reply({
        embeds: [embed],
        components: [selectMenu]
    });
}

async function handleAutoModeration(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
        .setTitle("🛡️ Auto-Moderation System Guide")
        .setDescription(
            "The auto-moderation system helps protect your server automatically. Here's everything you need to know:"
        )
        .addFields([
            {
                name: "📋 What It Does",
                value: 
                    "• **Anti-Spam**: Prevents message flooding\n" +
                    "• **Word Filter**: Blocks inappropriate words\n" +
                    "• **Link Filter**: Controls link sharing\n" +
                    "• **Duplicate Filter**: Stops repeated messages\n" +
                    "• **Raid Protection**: Defends against mass joins",
                inline: false
            },
            {
                name: "⚙️ Setup Commands",
                value:
                    "`/automod-config` - View current settings\n" +
                    "`/automod-config enable:true` - Enable auto-mod\n" +
                    "`/automod-config spam-threshold:5` - Set spam limit\n" +
                    "`/automod-config timeout-duration:60` - Set timeout (seconds)",
                inline: false
            },
            {
                name: "📊 Monitoring",
                value:
                    "`/automod-stats` - View moderation statistics\n" +
                    "`/automod-cleanup` - Clean up logged violations\n" +
                    "`/modlogs` - View all moderation logs",
                inline: false
            },
            {
                name: "💡 Best Practices",
                value:
                    "• Start with default settings and adjust as needed\n" +
                    "• Monitor stats regularly to see what's being caught\n" +
                    "• Use role exemptions for trusted members\n" +
                    "• Adjust thresholds based on your server's activity",
                inline: false
            },
            {
                name: "🔧 Common Settings",
                value:
                    "**Small Server**: spam-threshold:3, timeout:30s\n" +
                    "**Medium Server**: spam-threshold:5, timeout:60s\n" +
                    "**Large Server**: spam-threshold:7, timeout:120s",
                inline: false
            }
        ])
        .setColor("Red")
        .setFooter({ text: "💡 Tip: Test settings in a private channel first!" })
        .setTimestamp();

    const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('guide_automod_examples')
                .setLabel('View Examples')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝'),
            new ButtonBuilder()
                .setCustomId('guide_back_overview')
                .setLabel('Back to Overview')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('◀️')
        );

    await interaction.reply({
        embeds: [embed],
        components: [buttons]
    });
}

async function handleAutoResponder(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
        .setTitle("💬 Auto-Responder System Guide")
        .setDescription(
            "Set up automatic responses to messages in your channels. Perfect for FAQs, greetings, and more!"
        )
        .addFields([
            {
                name: "✨ Features",
                value:
                    "• **Plain Text Responses**: Simple text replies\n" +
                    "• **Embed Responses**: Styled embeds with colors and titles\n" +
                    "• **Case Sensitivity**: Choose exact or flexible matching\n" +
                    "• **Exact Match**: Match full message or just contains trigger\n" +
                    "• **Channel-Specific**: Different responses per channel",
                inline: false
            },
            {
                name: "➕ Adding Auto-Responders",
                value:
                    "**Basic Response:**\n" +
                    "`/arespadd channel:#general trigger:hello response:Hi there!`\n\n" +
                    "**Embed Response:**\n" +
                    "`/arespadd channel:#support trigger:help response:Need assistance? use-embed:true embed-title:Support embed-color:#FF5733`",
                inline: false
            },
            {
                name: "📝 Options Explained",
                value:
                    "• `case-sensitive` - Require exact capitalization\n" +
                    "• `exact-match` - Match entire message only\n" +
                    "• `use-embed` - Send as styled embed\n" +
                    "• `embed-title` - Title for the embed\n" +
                    "• `embed-color` - Hex color (#FF0000 or FF0000)",
                inline: false
            },
            {
                name: "📋 Managing Responders",
                value:
                    "`/aresplist` - View all auto-responders (grouped by channel)\n" +
                    "`/arespdelete channel:#general trigger:hello` - Remove a responder",
                inline: false
            },
            {
                name: "💡 Use Cases",
                value:
                    "• **FAQ Responses**: Auto-answer common questions\n" +
                    "• **Greetings**: Welcome messages when someone says hi\n" +
                    "• **Rules Reminder**: Quick rule references\n" +
                    "• **Support Info**: Instant help information",
                inline: false
            },
            {
                name: "🎨 Embed Colors",
                value:
                    "Red: `#FF0000` | Green: `#00FF00` | Blue: `#0099FF`\n" +
                    "Purple: `#9B59B6` | Orange: `#FF5733` | Yellow: `#FFD700`",
                inline: false
            }
        ])
        .setColor("Purple")
        .setFooter({ text: "💡 Tip: Use embeds for important announcements!" })
        .setTimestamp();

    const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('guide_autoresponder_examples')
                .setLabel('View Examples')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝'),
            new ButtonBuilder()
                .setCustomId('guide_back_overview')
                .setLabel('Back to Overview')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('◀️')
        );

    await interaction.reply({
        embeds: [embed],
        components: [buttons]
    });
}

async function handleAutoReaction(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
        .setTitle("⚡ Auto-Reaction System Guide")
        .setDescription(
            "Automatically add emoji reactions to messages in specific channels. Great for engagement and fun!"
        )
        .addFields([
            {
                name: "🎯 What It Does",
                value:
                    "Automatically reacts to every message in a configured channel with your chosen emojis. " +
                    "Perfect for suggestion channels, voting channels, or just adding flair to your server!",
                inline: false
            },
            {
                name: "➕ Setting Up",
                value:
                    "`/aradd channel:#suggestions emoji:👍 emoji:👎`\n" +
                    "Add up to multiple emojis per channel. Both Unicode and custom emojis are supported!",
                inline: false
            },
            {
                name: "📋 Managing Reactions",
                value:
                    "`/arlist` - View all auto-reaction channels\n" +
                    "`/ardelete channel:#suggestions` - Remove auto-reactions from a channel",
                inline: false
            },
            {
                name: "😀 Emoji Types Supported",
                value:
                    "• **Unicode Emojis**: 👍 👎 ❤️ 🎉 ⭐ 🔥 💯\n" +
                    "• **Custom Server Emojis**: :custom_emoji:\n" +
                    "• **Animated Emojis**: :animated_emoji:",
                inline: false
            },
            {
                name: "💡 Popular Use Cases",
                value:
                    "• **Suggestions**: 👍 👎 for voting\n" +
                    "• **Polls**: ❤️ 🔥 💯 for reactions\n" +
                    "• **Announcements**: 🎉 ⭐ for celebration\n" +
                    "• **Feedback**: ✅ ❌ for yes/no responses",
                inline: false
            },
            {
                name: "⚠️ Important Notes",
                value:
                    "• Bot needs permission to add reactions in the channel\n" +
                    "• Reactions are added in the order you specify\n" +
                    "• Custom emojis must be from the same server\n" +
                    "• Maximum recommended: 5-6 emojis per channel",
                inline: false
            }
        ])
        .setColor("Gold")
        .setFooter({ text: "💡 Tip: Keep it simple - too many reactions can be overwhelming!" })
        .setTimestamp();

    const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('guide_back_overview')
                .setLabel('Back to Overview')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('◀️')
        );

    await interaction.reply({
        embeds: [embed],
        components: [buttons]
    });
}

async function handleStickyMessages(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
        .setTitle("📌 Sticky Messages System Guide")
        .setDescription(
            "Keep important messages always visible at the bottom of your channels!"
        )
        .addFields([
            {
                name: "🎯 What Are Sticky Messages?",
                value:
                    "Sticky messages automatically repost themselves to stay at the bottom of a channel. " +
                    "Perfect for rules, announcements, or important information that members should always see!\n\n" +
                    "**Important:** You need an existing message to make sticky. Create the message first, then use its ID or URL.",
                inline: false
            },
            {
                name: "➕ Creating a Sticky Message",
                value:
                    "**Step 1:** Create a message with your content\n" +
                    "**Step 2:** Right-click the message and copy its link (or ID)\n" +
                    "**Step 3:** Use the command:\n\n" +
                    "`/smadd message:<message_url_or_id> title:Rules color:#FF0000 maxmessagecount:5`\n\n" +
                    "The message will repost after the specified number of messages.",
                inline: false
            },
            {
                name: "📝 Parameters Explained",
                value:
                    "• `message` - Message URL or ID to make sticky\n" +
                    "• `title` - Title for the sticky embed\n" +
                    "• `color` - Hex color for the embed (optional)\n" +
                    "• `maxmessagecount` - Messages before reposting (0 = every message)\n" +
                    "• `channel` - Where to post (defaults to current channel)\n\n" +
                    "💡 **Tip:** Right-click any message → Copy Link for easy use!",
                inline: false
            },
            {
                name: "✏️ Managing Sticky Messages",
                value:
                    "`/smlist` - View all sticky messages in the server\n" +
                    "`/smedit` - Update title, color, or message threshold\n" +
                    "`/smdelete` - Remove a sticky message permanently",
                inline: false
            },
            {
                name: "💡 Best Practices",
                value:
                    "• **High Activity Channels**: Set maxmessagecount to 10-20\n" +
                    "• **Low Activity Channels**: Set maxmessagecount to 3-5\n" +
                    "• **Rules Channels**: Use 0 for always visible\n" +
                    "• Keep the original message content concise\n" +
                    "• Use eye-catching colors for the sticky embed",
                inline: false
            },
            {
                name: "🎨 Recommended Colors",
                value:
                    "Rules: `#FF0000` (Red) | Announcements: `#0099FF` (Blue)\n" +
                    "Events: `#FFD700` (Gold) | Info: `#00FF00` (Green)",
                inline: false
            }
        ])
        .setColor("Green")
        .setFooter({ text: "💡 Tip: Test threshold settings to find what works best for your server!" })
        .setTimestamp();

    const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('guide_sticky_examples')
                .setLabel('View Examples')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝'),
            new ButtonBuilder()
                .setCustomId('guide_back_overview')
                .setLabel('Back to Overview')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('◀️')
        );

    await interaction.reply({
        embeds: [embed],
        components: [buttons]
    });
}

async function handleWelcomeSystem(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
        .setTitle("👋 Welcome System Guide")
        .setDescription(
            "Greet new members automatically with customizable welcome messages!"
        )
        .addFields([
            {
                name: "✨ Features",
                value:
                    "• **Custom Welcome Messages**: Personalize greetings for new members\n" +
                    "• **Embed Support**: Beautiful styled welcome cards\n" +
                    "• **Placeholders**: Dynamic content like member name, server name, etc.\n" +
                    "• **Channel Selection**: Choose where welcome messages appear",
                inline: false
            },
            {
                name: "⚙️ Setup",
                value:
                    "**Step 1:** Set the welcome channel\n" +
                    "`/set-welcome-channel channel:#welcome`\n\n" +
                    "**Step 2:** Customize your message (optional)\n" +
                    "`/wmedit title title:Welcome!`\n" +
                    "`/wmedit description` (Opens a modal for long text)\n" +
                    "`/wmedit color color:#0099FF`",
                inline: false
            },
            {
                name: "🔖 Available Placeholders",
                value:
                    "• `{user}` or `{mention}` - Mention the new member\n" +
                    "• `{username}` - Member's username\n" +
                    "• `{server}` - Server name\n" +
                    "• `{membercount}` - Total member count\n\n" +
                    "💡 Use `/wmformats` to see all formatting options!",
                inline: false
            },
            {
                name: "📋 Managing Welcome System",
                value:
                    "`/wmpreview` - Preview how the welcome message looks\n" +
                    "`/wmformats` - View all placeholder options\n" +
                    "`/wmedit` - Update title, description, color, thumbnail, or footer\n" +
                    "`/set-welcome-channel` - Change the welcome channel",
                inline: false
            },
            {
                name: "💡 Message Ideas",
                value:
                    "**Simple**: `Welcome {user} to {server}! We're glad you're here!`\n\n" +
                    "**Friendly**: `Hey {user}! 👋 Welcome to {server}! You're member #{membercount}!`\n\n" +
                    "**Informative**: `Welcome {user}! Check out <#rules> and <#info> to get started!`",
                inline: false
            },
            {
                name: "⚠️ Important",
                value:
                    "• Bot needs permission to send messages in welcome channel\n" +
                    "• Test the message before finalizing\n" +
                    "• Keep messages friendly and informative\n" +
                    "• Consider adding helpful channel links",
                inline: false
            }
        ])
        .setColor("Blurple")
        .setFooter({ text: "💡 Tip: Make new members feel welcomed with a warm message!" })
        .setTimestamp();

    const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('guide_back_overview')
                .setLabel('Back to Overview')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('◀️')
        );

    await interaction.reply({
        embeds: [embed],
        components: [buttons]
    });
}

async function handleSuggestionSystem(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
        .setTitle("💡 Suggestion System Guide")
        .setDescription(
            "Let your members suggest ideas and vote on them with an organized suggestion system!"
        )
        .addFields([
            {
                name: "🎯 How It Works",
                value:
                    "Members submit suggestions which appear as formatted embeds with voting reactions. " +
                    "Staff can approve, deny, or mark suggestions as implemented. All suggestions are tracked with unique IDs.",
                inline: false
            },
            {
                name: "⚙️ Setting Up",
                value:
                    "**Step 1:** Set the suggestion channel\n" +
                    "`/set-suggestion-channel channel:#suggestions`\n\n" +
                    "**Step 2:** (Optional) Customize vote emojis\n" +
                    "`/set-suggestion-emojis upvote:👍 downvote:👎`\n\n" +
                    "Members can now submit suggestions in that channel!",
                inline: false
            },
            {
                name: "📝 Submitting Suggestions (Members)",
                value:
                    "`/add-suggestion suggestion:Add a music bot!`\n\n" +
                    "Suggestions are posted with vote reactions automatically (👍 and 👎 by default).",
                inline: false
            },
            {
                name: "⚖️ Managing Suggestions (Staff)",
                value:
                    "`/approve-suggestion id:1 reason:Great idea!` - Accept a suggestion\n" +
                    "`/deny-suggestion id:2 reason:Not possible` - Reject a suggestion\n" +
                    "`/delete-suggestion id:3` - Remove a suggestion entirely",
                inline: false
            },
            {
                name: "📊 Suggestion Statuses",
                value:
                    "• **Pending** (⏳) - Awaiting staff review\n" +
                    "• **Approved** (✅) - Accepted by staff\n" +
                    "• **Denied** (❌) - Rejected by staff",
                inline: false
            },
            {
                name: "💡 Best Practices",
                value:
                    "• Review suggestions regularly\n" +
                    "• Always provide reasons for decisions\n" +
                    "• Keep members updated on progress\n" +
                    "• Thank members for good suggestions\n" +
                    "• Archive old suggestions periodically",
                inline: false
            },
            {
                name: "⚠️ Requirements",
                value:
                    "• Requires Administrator or Manage Server permission to manage\n" +
                    "• Bot needs permission to manage messages in suggestion channel\n" +
                    "• Bot needs permission to add reactions",
                inline: false
            }
        ])
        .setColor("Yellow")
        .setFooter({ text: "💡 Tip: Engage with your community by implementing their ideas!" })
        .setTimestamp();

    const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('guide_back_overview')
                .setLabel('Back to Overview')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('◀️')
        );

    await interaction.reply({
        embeds: [embed],
        components: [buttons]
    });
}

async function handleModeration(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
        .setTitle("⚖️ Moderation Tools Guide")
        .setDescription(
            "Comprehensive moderation commands to help you manage your server effectively!"
        )
        .addFields([
            {
                name: "👤 User Moderation",
                value:
                    "`/warn user reason` - Issue a warning\n" +
                    "`/mute user duration reason` - Timeout a member\n" +
                    "`/unmute user` - Remove timeout\n" +
                    "`/kick user reason` - Kick from server\n" +
                    "`/ban user reason` - Ban from server",
                inline: false
            },
            {
                name: "🗑️ Message Management",
                value:
                    "`/clear amount:50` - Delete messages\n" +
                    "`/clear amount:20 user:@someone` - Delete user's messages\n" +
                    "`/clear amount:10 contains:spam` - Delete matching messages",
                inline: false
            },
            {
                name: "📋 Moderation Logs",
                value:
                    "`/modlogs user:@someone` - View user's mod history\n" +
                    "`/modlogs type:warn` - View warnings\n" +
                    "`/modlogs moderator:@mod` - View specific mod's actions\n" +
                    "`/modlogs case:123` - View specific case",
                inline: false
            },
            {
                name: "⚠️ Warning System",
                value:
                    "Warnings accumulate and can trigger automatic actions:\n" +
                    "`/warning-escalation` - Configure automatic punishments\n" +
                    "Example: 3 warns = mute, 5 warns = kick, 7 warns = ban",
                inline: false
            },
            {
                name: "🛡️ Auto-Moderation",
                value:
                    "`/automod-config` - View/edit auto-mod settings\n" +
                    "`/automod-stats` - View moderation statistics\n" +
                    "`/automod-cleanup` - Clean old violation logs",
                inline: false
            },
            {
                name: "💡 Moderation Tips",
                value:
                    "• Always provide clear reasons for actions\n" +
                    "• Use warnings before harsher punishments\n" +
                    "• Document everything with mod logs\n" +
                    "• Be consistent with rule enforcement\n" +
                    "• Communicate with your team\n" +
                    "• Review mod logs regularly",
                inline: false
            },
            {
                name: "📊 Time Formats",
                value:
                    "`5m` = 5 minutes | `1h` = 1 hour | `2d` = 2 days\n" +
                    "`1w` = 1 week | `30s` = 30 seconds",
                inline: false
            }
        ])
        .setColor("Red")
        .setFooter({ text: "💡 Tip: Fair and consistent moderation builds trust!" })
        .setTimestamp();

    const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('guide_mod_examples')
                .setLabel('View Examples')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝'),
            new ButtonBuilder()
                .setCustomId('guide_back_overview')
                .setLabel('Back to Overview')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('◀️')
        );

    await interaction.reply({
        embeds: [embed],
        components: [buttons]
    });
}

async function handleRoleManagement(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
        .setTitle("👥 Role Management Guide")
        .setDescription(
            "Simple and effective role management commands for your server!"
        )
        .addFields([
            {
                name: "➕ Adding Roles",
                value:
                    "`/addrole user:@someone role:@Member`\n" +
                    "Assigns a role to a member. Bot must have permission to manage roles.",
                inline: false
            },
            {
                name: "➖ Removing Roles",
                value:
                    "`/removerole user:@someone role:@Member`\n" +
                    "Removes a role from a member. Bot must have permission to manage roles.",
                inline: false
            },
            {
                name: "ℹ️ Role Information",
                value:
                    "`/roleinfo role:@Member`\n" +
                    "Displays detailed information about a role:\n" +
                    "• Member count\n" +
                    "• Role color\n" +
                    "• Permissions\n" +
                    "• Position in hierarchy\n" +
                    "• Creation date",
                inline: false
            },
            {
                name: "⚠️ Important Notes",
                value:
                    "• Bot's role must be higher than the role being managed\n" +
                    "• Cannot manage roles above the bot's highest role\n" +
                    "• Requires 'Manage Roles' permission\n" +
                    "• Admin roles need special permissions",
                inline: false
            },
            {
                name: "💡 Best Practices",
                value:
                    "• Organize roles in a clear hierarchy\n" +
                    "• Use role colors for easy identification\n" +
                    "• Document what each role represents\n" +
                    "• Keep bot role near the top\n" +
                    "• Review role permissions regularly",
                inline: false
            },
            {
                name: "🎨 Role Organization Tips",
                value:
                    "**Admin Roles** (Top) - Full permissions\n" +
                    "**Moderator Roles** (High) - Moderation perms\n" +
                    "**Special Roles** (Middle) - Custom perms\n" +
                    "**Member Roles** (Low) - Basic access\n" +
                    "**Bot Roles** (Below Admin) - Bot permissions",
                inline: false
            }
        ])
        .setColor("Blue")
        .setFooter({ text: "💡 Tip: Keep your role hierarchy organized for easier management!" })
        .setTimestamp();

    const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('guide_back_overview')
                .setLabel('Back to Overview')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('◀️')
        );

    await interaction.reply({
        embeds: [embed],
        components: [buttons]
    });
}
