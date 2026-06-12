// Mock data used only by the dashboard; keep shapes permissive to avoid
// tightly coupling to API types during incremental migration.
type Guild = any;

export const mockGuilds: Guild[] = [
  {
    id: '123456789012345678',
    name: 'Gaming Central',
    icon: 'https://cdn.discordapp.com/embed/avatars/0.png',
    memberCount: 4521,
    channelCount: 24,
    roleCount: 12,
    botInGuild: true,
    hasManageServer: true,
    features: ['welcome', 'sticky', 'autoreactions', 'automod'],
    ownerId: '111111111111111111',
  },
  {
    id: '234567890123456789',
    name: 'Anime Lounge',
    icon: 'https://cdn.discordapp.com/embed/avatars/1.png',
    memberCount: 12834,
    channelCount: 42,
    roleCount: 18,
    botInGuild: true,
    hasManageServer: true,
    features: ['welcome', 'suggestions', 'autoresponder', 'moderation'],
    ownerId: '111111111111111111',
  },
  {
    id: '345678901234567890',
    name: 'Dev Hangout',
    icon: 'https://cdn.discordapp.com/embed/avatars/2.png',
    memberCount: 892,
    channelCount: 16,
    roleCount: 8,
    botInGuild: true,
    hasManageServer: true,
    features: ['welcome', 'sticky', 'automod'],
    ownerId: '222222222222222222',
  },
  {
    id: '456789012345678901',
    name: 'Music Vibes',
    icon: 'https://cdn.discordapp.com/embed/avatars/3.png',
    memberCount: 3456,
    channelCount: 20,
    roleCount: 10,
    botInGuild: false,
    hasManageServer: true,
    features: [],
    ownerId: '111111111111111111',
  },
  {
    id: '567890123456789012',
    name: 'Study Group',
    icon: 'https://cdn.discordapp.com/embed/avatars/4.png',
    memberCount: 234,
    channelCount: 8,
    roleCount: 5,
    botInGuild: true,
    hasManageServer: true,
    features: ['sticky', 'suggestions'],
    ownerId: '111111111111111111',
  },
];

export const mockChannels = [
  { id: 'ch1', name: 'general', type: 'text' },
  { id: 'ch2', name: 'welcome', type: 'text' },
  { id: 'ch3', name: 'announcements', type: 'text' },
  { id: 'ch4', name: 'moderation-log', type: 'text' },
  { id: 'ch5', name: 'suggestions', type: 'text' },
  { id: 'ch6', name: 'bot-commands', type: 'text' },
  { id: 'ch7', name: 'memes', type: 'text' },
  { id: 'ch8', name: 'music', type: 'text' },
];

export const mockRoles = [
  { id: 'r1', name: 'Admin', color: '#ED4245', position: 10 },
  { id: 'r2', name: 'Moderator', color: '#5865F2', position: 9 },
  { id: 'r3', name: 'Member', color: '#57F287', position: 1 },
  { id: 'r4', name: 'Muted', color: '#72767D', position: 0 },
];

export const mockWelcomeConfig = {
  enabled: true,
  channelId: 'ch2',
  messageTemplate: 'Welcome {user} to {server}! You are member #{memberCount}.',
  useEmbed: true,
  embedTitle: '🎉 Welcome!',
  embedDescription: 'Hey {user}, welcome to **{server}**! We are glad to have you here. You are our {memberCount}th member!',
  embedColor: '#7C5CBF',
  embedThumbnail: true,
  embedFooter: 'Enjoy your stay!',
};

export const mockStickyMessages = [
  {
    id: 'sm1',
    channelId: 'ch1',
    channelName: 'general',
    content: '📌 Please read the rules before chatting! Be respectful to everyone.',
    useEmbed: false,
    createdBy: 'AdminUser',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'sm2',
    channelId: 'ch5',
    channelName: 'suggestions',
    content: 'Use the format: `[Category] Your suggestion here`',
    useEmbed: true,
    createdBy: 'ModUser',
    createdAt: '2024-02-01T14:00:00Z',
  },
];

export const mockAutoReactions = [
  { id: 'ar1', channelId: 'ch7', channelName: 'memes', emoji: '😂', triggerType: 'always', pattern: '', cooldown: 0 },
  { id: 'ar2', channelId: 'ch8', channelName: 'music', emoji: '🎵', triggerType: 'pattern', pattern: 'spotify|youtube|soundcloud', cooldown: 30 },
  { id: 'ar3', channelId: 'ch1', channelName: 'general', emoji: '👋', triggerType: 'pattern', pattern: 'hello|hi|hey', cooldown: 60 },
];

export const mockAutoResponders = [
  {
    id: 'resp1',
    trigger: 'help',
    matchMode: 'exact',
    caseSensitive: false,
    responseText: 'Need help? Check out our docs or ask a moderator!',
    useEmbed: false,
    channels: [],
    cooldown: 30,
  },
  {
    id: 'resp2',
    trigger: 'rules',
    matchMode: 'contains',
    caseSensitive: false,
    responseText: 'Please follow our community guidelines: 1. Be respectful 2. No spam 3. Use appropriate channels',
    useEmbed: true,
    channels: ['ch1'],
    cooldown: 60,
  },
];

export const mockSuggestions = [
  {
    id: 's1',
    authorId: 'u1',
    authorName: 'GamerPro',
    summary: 'Add a tournament bracket feature',
    fullText: 'It would be awesome if the bot could manage tournament brackets for our gaming events. Something simple like single elimination brackets.',
    status: 'approved',
    upvotes: 42,
    downvotes: 3,
    submittedAt: '2024-03-10T09:00:00Z',
  },
  {
    id: 's2',
    authorId: 'u2',
    authorName: 'AnimeFan99',
    summary: 'Custom anime reaction GIFs',
    fullText: 'Can we get custom anime reaction GIFs triggered by keywords? Like !hug, !pat, etc.',
    status: 'pending',
    upvotes: 28,
    downvotes: 5,
    submittedAt: '2024-03-12T15:30:00Z',
  },
  {
    id: 's3',
    authorId: 'u3',
    authorName: 'DevDave',
    summary: 'Webhook integration for GitHub',
    fullText: 'Add GitHub webhook support so we can see commit notifications in our dev channel.',
    status: 'implemented',
    upvotes: 56,
    downvotes: 1,
    submittedAt: '2024-02-20T11:00:00Z',
  },
  {
    id: 's4',
    authorId: 'u4',
    authorName: 'NewbieHere',
    summary: 'More welcome message templates',
    fullText: 'Can we have more pre-made welcome message templates to choose from?',
    status: 'denied',
    upvotes: 5,
    downvotes: 18,
    submittedAt: '2024-03-15T08:00:00Z',
  },
  {
    id: 's5',
    authorId: 'u5',
    authorName: 'MusicLover',
    summary: 'Spotify playlist sharing command',
    fullText: 'A command that lets users share Spotify playlists and the bot creates a nice embed with track info.',
    status: 'pending',
    upvotes: 33,
    downvotes: 2,
    submittedAt: '2024-03-18T20:00:00Z',
  },
];

export const mockModLogs = [
  { caseId: 'C-1042', action: 'Warn', targetUser: 'ToxicPlayer', targetUserId: 'u10', moderator: 'ModUser', moderatorId: 'm1', reason: 'Spamming in general chat', timestamp: '2024-03-20T14:30:00Z' },
  { caseId: 'C-1041', action: 'Mute', targetUser: 'LoudMouth', targetUserId: 'u11', moderator: 'AdminUser', moderatorId: 'm2', reason: 'Excessive caps after warning', timestamp: '2024-03-19T22:15:00Z' },
  { caseId: 'C-1040', action: 'Ban', targetUser: 'BadActor', targetUserId: 'u12', moderator: 'AdminUser', moderatorId: 'm2', reason: 'Posting NSFW content', timestamp: '2024-03-18T09:00:00Z' },
  { caseId: 'C-1039', action: 'Kick', targetUser: 'TrollAccount', targetUserId: 'u13', moderator: 'ModUser', moderatorId: 'm1', reason: 'Trolling other members', timestamp: '2024-03-17T16:45:00Z' },
  { caseId: 'C-1038', action: 'Unban', targetUser: 'ReformedUser', targetUserId: 'u14', moderator: 'AdminUser', moderatorId: 'm2', reason: 'Appeal accepted', timestamp: '2024-03-16T11:20:00Z' },
  { caseId: 'C-1037', action: 'Timeout', targetUser: 'HeatedDebater', targetUserId: 'u15', moderator: 'ModUser', moderatorId: 'm1', reason: 'Personal attacks in debate channel', timestamp: '2024-03-15T19:00:00Z' },
  { caseId: 'C-1036', action: 'Warn', targetUser: 'NewMember', targetUserId: 'u16', moderator: 'ModUser', moderatorId: 'm1', reason: 'Off-topic posting', timestamp: '2024-03-14T13:10:00Z' },
  { caseId: 'C-1035', action: 'Mute', targetUser: 'SpammerBot', targetUserId: 'u17', moderator: 'AdminUser', moderatorId: 'm2', reason: 'Automated spam detection triggered', timestamp: '2024-03-13T08:30:00Z' },
];

export const mockEscalationRules = [
  { id: 'e1', warningCount: 3, action: 'mute', duration: '1h', resetWarnings: false },
  { id: 'e2', warningCount: 5, action: 'kick', duration: '', resetWarnings: true },
  { id: 'e3', warningCount: 7, action: 'ban', duration: '7d', resetWarnings: true },
];

export const mockAutomodConfig = {
  antiSpamEnabled: true,
  spamThreshold: 5,
  spamWindow: 10,
  spamAction: 'mute',
  spamMuteDuration: '30m',
  wordFilterEnabled: true,
  blockedWords: 'badword1\nbadword2\nslur\nspamlink',
  exemptRoles: ['r1', 'r2'],
  exemptChannels: ['ch4'],
  raidProtectionEnabled: true,
  raidThreshold: 10,
  raidWindow: 60,
  raidAction: 'lockdown',
};

export const botStats = {
  guilds: 2847,
  users: 482931,
  commandsRun: 12584392,
  uptime: '99.97%',
  ping: 42,
  memory: 256,
  cpu: 12,
  commandsToday: 45231,
};

export const commandStats = [
  { name: 'help', count: 2450000 },
  { name: 'warn', count: 1890000 },
  { name: 'kick', count: 1560000 },
  { name: 'ban', count: 1340000 },
  { name: 'mute', count: 1120000 },
  { name: 'welcome', count: 980000 },
  { name: 'sticky', count: 870000 },
  { name: 'suggest', count: 760000 },
  { name: 'autoreact', count: 650000 },
  { name: 'settings', count: 540000 },
];

export const commandsList = [
  { name: 'help', category: 'Utility', description: 'Display help information for all commands', usage: '/help [command]', permissions: 'None' },
  { name: 'ping', category: 'Utility', description: 'Check bot latency and API response time', usage: '/ping', permissions: 'None' },
  { name: 'info', category: 'Utility', description: 'Get information about the bot or server', usage: '/info [server|bot]', permissions: 'None' },
  { name: 'warn', category: 'Moderation', description: 'Issue a warning to a user', usage: '/warn @user [reason]', permissions: 'Manage Messages' },
  { name: 'kick', category: 'Moderation', description: 'Kick a user from the server', usage: '/kick @user [reason]', permissions: 'Kick Members' },
  { name: 'ban', category: 'Moderation', description: 'Ban a user from the server', usage: '/ban @user [reason] [duration]', permissions: 'Ban Members' },
  { name: 'mute', category: 'Moderation', description: 'Timeout/mute a user', usage: '/mute @user [duration] [reason]', permissions: 'Moderate Members' },
  { name: 'unban', category: 'Moderation', description: 'Unban a previously banned user', usage: '/unban <user_id>', permissions: 'Ban Members' },
  { name: 'modlogs', category: 'Moderation', description: 'View moderation logs for a user', usage: '/modlogs @user', permissions: 'Manage Messages' },
  { name: 'welcome', category: 'Welcome System', description: 'Configure welcome messages', usage: '/welcome <set|test|disable>', permissions: 'Manage Server' },
  { name: 'sticky', category: 'Sticky Messages', description: 'Manage sticky messages in channels', usage: '/sticky <add|remove|list>', permissions: 'Manage Messages' },
  { name: 'autoreact', category: 'Auto-Reactions', description: 'Set up automatic reactions', usage: '/autoreact <add|remove|list>', permissions: 'Manage Server' },
  { name: 'responder', category: 'Auto-Responder', description: 'Configure auto-responder triggers', usage: '/responder <add|remove|list>', permissions: 'Manage Server' },
  { name: 'suggest', category: 'Suggestions', description: 'Submit a server suggestion', usage: '/suggest <your suggestion>', permissions: 'None' },
  { name: 'approve', category: 'Suggestions', description: 'Approve a pending suggestion', usage: '/approve <suggestion_id> [reason]', permissions: 'Manage Server' },
  { name: 'deny', category: 'Suggestions', description: 'Deny a pending suggestion', usage: '/deny <suggestion_id> [reason]', permissions: 'Manage Server' },
  { name: 'automod', category: 'Moderation', description: 'Configure auto-moderation settings', usage: '/automod <toggle|settings>', permissions: 'Manage Server' },
  { name: '8ball', category: 'Fun', description: 'Ask the magic 8-ball a question', usage: '/8ball <question>', permissions: 'None' },
  { name: 'roll', category: 'Fun', description: 'Roll dice with optional sides', usage: '/roll [sides]', permissions: 'None' },
  { name: 'avatar', category: 'Fun', description: 'Get a user\'s avatar', usage: '/avatar [@user]', permissions: 'None' },
];

export const dailyCommands = [
  { day: 'Mar 1', count: 42000 },
  { day: 'Mar 2', count: 45100 },
  { day: 'Mar 3', count: 43800 },
  { day: 'Mar 4', count: 46500 },
  { day: 'Mar 5', count: 48900 },
  { day: 'Mar 6', count: 47200 },
  { day: 'Mar 7', count: 51000 },
  { day: 'Mar 8', count: 49500 },
  { day: 'Mar 9', count: 52300 },
  { day: 'Mar 10', count: 54800 },
  { day: 'Mar 11', count: 53100 },
  { day: 'Mar 12', count: 56700 },
  { day: 'Mar 13', count: 55200 },
  { day: 'Mar 14', count: 58900 },
  { day: 'Mar 15', count: 57400 },
  { day: 'Mar 16', count: 60100 },
  { day: 'Mar 17', count: 61800 },
  { day: 'Mar 18', count: 59300 },
  { day: 'Mar 19', count: 62500 },
  { day: 'Mar 20', count: 64200 },
  { day: 'Mar 21', count: 45231 },
];

export const devUsers = [
  { id: 'u1', username: 'GamerPro', guildsManaged: 3, lastLogin: '2024-03-21T10:00:00Z', role: 'User' },
  { id: 'u2', username: 'AnimeFan99', guildsManaged: 2, lastLogin: '2024-03-20T18:30:00Z', role: 'User' },
  { id: 'u3', username: 'DevDave', guildsManaged: 5, lastLogin: '2024-03-21T08:15:00Z', role: 'Developer' },
  { id: 'u4', username: 'ModUser', guildsManaged: 4, lastLogin: '2024-03-19T22:00:00Z', role: 'User' },
  { id: 'u5', username: 'AdminUser', guildsManaged: 6, lastLogin: '2024-03-21T09:45:00Z', role: 'Developer' },
];

export const alertRules = [
  { id: 'a1', condition: 'Error rate > 5%', target: 'Discord Webhook #alerts', enabled: true },
  { id: 'a2', condition: 'Uptime < 99%', target: 'Discord Webhook #ops', enabled: true },
  { id: 'a3', condition: 'Guild count spike > 100/hour', target: 'Discord Webhook #growth', enabled: false },
];

export const alertHistory = [
  { id: 'h1', rule: 'Error rate > 5%', timestamp: '2024-03-18T03:00:00Z', sent: true },
  { id: 'h2', rule: 'Uptime < 99%', timestamp: '2024-03-15T14:00:00Z', sent: true },
  { id: 'h3', rule: 'Error rate > 5%', timestamp: '2024-03-10T09:00:00Z', sent: false },
];
