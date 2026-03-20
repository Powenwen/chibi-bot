/**
 * Standardized cache key patterns for consistent Redis operations
 * All keys use the `chibi:` prefix automatically added by Redis client config
 */

export const CacheKeys = {
    /**
     * Guild-related cache keys
     */
    guild: {
        data: (guildId: string) => `guild:${guildId}:data`,
        config: (guildId: string) => `guild:${guildId}:config`,
        settings: (guildId: string) => `guild:${guildId}:settings`,
    },

    /**
     * Auto-reaction cache keys
     */
    autoReaction: {
        all: (guildId: string) => `autoreaction:guild:${guildId}:all`,
        channel: (guildId: string, channelId: string) => `autoreaction:guild:${guildId}:channel:${channelId}`,
        list: (guildId: string) => `autoreaction:guild:${guildId}:list`,
    },

    /**
     * Auto-responder cache keys
     */
    autoResponder: {
        all: (guildId: string) => `autoresponder:guild:${guildId}:all`,
        channel: (guildId: string, channelId: string) => `autoresponder:guild:${guildId}:channel:${channelId}`,
        trigger: (guildId: string, channelId: string, trigger: string) => 
            `autoresponder:guild:${guildId}:channel:${channelId}:trigger:${trigger}`,
        list: (guildId: string) => `autoresponder:guild:${guildId}:list`,
    },

    /**
     * Sticky message cache keys
     */
    stickyMessage: {
        all: (guildId: string) => `stickymessage:guild:${guildId}:all`,
        channel: (guildId: string, channelId: string) => `stickymessage:guild:${guildId}:channel:${channelId}`,
        unique: (uniqueId: string) => `stickymessage:unique:${uniqueId}`,
        list: (guildId: string) => `stickymessage:guild:${guildId}:list`,
    },

    /**
     * Welcome system cache keys
     */
    welcomeSystem: {
        config: (guildId: string) => `welcome:guild:${guildId}:config`,
        message: (guildId: string) => `welcome:guild:${guildId}:message`,
    },

    /**
     * Suggestion system cache keys
     */
    suggestion: {
        channel: (guildId: string) => `suggestion:guild:${guildId}:channel`,
        all: (guildId: string) => `suggestion:guild:${guildId}:all`,
        single: (guildId: string, suggestionId: string) => `suggestion:guild:${guildId}:${suggestionId}`,
        pending: (guildId: string) => `suggestion:guild:${guildId}:pending`,
        approved: (guildId: string) => `suggestion:guild:${guildId}:approved`,
        denied: (guildId: string) => `suggestion:guild:${guildId}:denied`,
    },

    /**
     * Moderation cache keys
     */
    moderation: {
        case: (guildId: string, caseId: number) => `moderation:guild:${guildId}:case:${caseId}`,
        userHistory: (guildId: string, userId: string) => `moderation:guild:${guildId}:user:${userId}:history`,
        warningCount: (guildId: string, userId: string) => `moderation:guild:${guildId}:user:${userId}:warnings`,
        escalation: (guildId: string) => `moderation:guild:${guildId}:escalation`,
        automod: (guildId: string) => `automod:guild:${guildId}:config`,
        metrics: (guildId: string) => `automod:guild:${guildId}:metrics`,
    },

    /**
     * Raid protection cache keys
     */
    raid: {
        tracker: (guildId: string) => `raid:guild:${guildId}:tracker`,
        lockdown: (guildId: string) => `raid:guild:${guildId}:lockdown`,
        permissions: (guildId: string) => `raid:guild:${guildId}:permissions`,
    },

    /**
     * Anti-spam and duplicate filter cache keys
     */
    spam: {
        messageHistory: (guildId: string, userId: string) => `spam:guild:${guildId}:user:${userId}:history`,
        duplicateHistory: (guildId: string, userId: string, channelId: string) => 
            `duplicate:guild:${guildId}:user:${userId}:channel:${channelId}`,
    },

    /**
     * Error and metrics cache keys
     */
    system: {
        error: (errorId: string) => `error:${errorId}`,
        errorPattern: (errorName: string, feature: string) => `error:pattern:${errorName}:${feature}`,
        metrics: (feature: string) => `metrics:${feature}`,
        health: () => 'system:health',
    },
} as const;

/**
 * Cache key patterns for bulk operations
 */
export const CachePatterns = {
    /**
     * Get all cache keys for a guild (for bulk operations)
     */
    guild: {
        all: (guildId: string) => `*:guild:${guildId}:*`,
        pattern: (guildId: string) => `*guild:${guildId}*`,
    },
} as const;

/**
 * Cache TTL (Time To Live) constants in seconds
 */
export const CacheTTL = {
    /** Very short - 5 minutes */
    VERY_SHORT: 300,
    /** Short - 15 minutes */
    SHORT: 900,
    /** Medium - 30 minutes */
    MEDIUM: 1800,
    /** Standard - 1 hour */
    STANDARD: 3600,
    /** Long - 2 hours */
    LONG: 7200,
    /** Very long - 6 hours */
    VERY_LONG: 21600,
    /** Day - 24 hours */
    DAY: 86400,
    /** Week - 7 days */
    WEEK: 604800,
} as const;

/**
 * Feature-specific cache TTL strategy
 */
export const CacheStrategy = {
    autoReaction: {
        ttl: CacheTTL.STANDARD,
        invalidateOnChange: true,
        preload: true,
    },
    autoResponder: {
        ttl: CacheTTL.LONG,
        invalidateOnChange: true,
        preload: true,
    },
    stickyMessage: {
        ttl: CacheTTL.MEDIUM,
        invalidateOnChange: true,
        preload: false,
    },
    welcomeSystem: {
        ttl: CacheTTL.STANDARD,
        invalidateOnChange: true,
        preload: true,
    },
    suggestion: {
        ttl: CacheTTL.SHORT,
        invalidateOnChange: true,
        preload: false,
    },
    moderation: {
        ttl: CacheTTL.MEDIUM,
        invalidateOnChange: true,
        preload: false,
    },
    metrics: {
        ttl: CacheTTL.DAY,
        invalidateOnChange: false,
        preload: false,
    },
} as const;

/**
 * Cache tag patterns for group invalidation
 */
export const CacheTags = {
    guild: (guildId: string) => `tag:guild:${guildId}`,
    channel: (channelId: string) => `tag:channel:${channelId}`,
    user: (userId: string) => `tag:user:${userId}`,
    feature: (feature: string) => `tag:feature:${feature}`,
} as const;
