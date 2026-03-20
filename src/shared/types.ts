// Bot type definitions
export interface User {
  id: string;
  username: string;
  avatar?: string;
}

export interface Guild {
  id: string;
  name: string;
  icon?: string;
}

export interface CacheConfig {
  ttl: number;
  maxSize?: number;
}

export interface DatabaseConfig {
  uri: string;
  dbName: string;
}

// Bot-specific types
export interface BotStats {
  commands: number;
  events: number;
  buttons: number;
  modals: number;
  selectMenus: number;
  guilds: number;
  users: number;
  uptime: number | null;
  memoryUsage: NodeJS.MemoryUsage;
  ready: boolean;
  health: boolean;
  shutdownInProgress: boolean;
}

// Authorized User types
export interface IAuthorizedUser {
  userId: string;
  username?: string;
  role?: string;
  addedAt?: Date;
  addedBy?: string;
}

// Suggestion System types
export type SuggestionStatus = "Pending" | "Approved" | "Denied";

export interface ISuggestion {
  guildID: string;
  channelID: string;
  messageID: string;
  suggestionID: string;
  suggestion: string;
  authorID: string;
  status: SuggestionStatus;
  response: string;
  responseAuthorID: string;
}

export interface ISuggestionChannel {
  guildID: string;
  channelID: string;
  emojis: {
    upvote: string;
    downvote: string;
  };
}

// Welcome System types
export interface IWelcomeSystem {
  guildID: string;
  channelID: string;
  embed: {
    title: string;
    description: string;
    color: string;
    thumbnail: boolean;
    footer: {
      enabled: boolean;
      text: string;
      timestamp: boolean;
    };
  };
}

// Sticky Message types
export interface IStickyMessage {
  guildID: string;
  channelID: string;
  messageID: string;
  messageChannelID: string;
  uniqueID: string;
  authorID: string;
  createdAt: Date;
  title: string;
  content: string;
  color: string;
  embedID: string;
  maxMessageCount: number;
}

// Auto Reaction types
export interface IAutoReaction {
  guildID: string;
  channelID: string;
  emojis: string[];
}

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Custom Command types
export interface ICustomCommand {
  id?: string;
  name: string;
  description: string;
  trigger: string;
  response: string;
  enabled?: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
