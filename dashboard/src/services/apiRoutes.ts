/**
 * Chibi Bot Dashboard - Backend API Route Definitions
 * 
 * This file documents all the REST API endpoints that the backend server
 * (Express/Fastify) must implement for the dashboard to function.
 * 
 * In production, these routes are handled by a separate Node.js backend
 * that connects to MongoDB, Redis, and the bot's internal API.
 */

// ==================== AUTH ROUTES ====================

/**
 * @route   GET /auth/discord
 * @desc    Redirect to Discord OAuth2 authorization
 * @access  Public
 */
// Redirects to Discord OAuth2 with scopes: identify, guilds, guilds.members.read

/**
 * @route   GET /auth/discord/callback
 * @desc    Handle Discord OAuth2 callback
 * @access  Public
 * @query   code - Authorization code from Discord
 * @query   state - CSRF state parameter
 */
// Exchanges code for tokens, creates session, sets cookie, redirects to dashboard

/**
 * @route   GET /auth/me
 * @desc    Get current authenticated user
 * @access  Private (session cookie)
 * @returns { user: DashboardUser }
 */

/**
 * @route   POST /auth/logout
 * @desc    Destroy session and clear cookie
 * @access  Private
 */

/**
 * @route   POST /auth/refresh
 * @desc    Refresh Discord access token
 * @access  Private
 */

// ==================== GUILD ROUTES ====================

/**
 * @route   GET /api/guilds
 * @desc    Get mutual guilds (user + bot) with permission info
 * @access  Private
 * @returns { guilds: GuildInfo[], botGuildIds: string[] }
 */

/**
 * @route   GET /api/guilds/:guildId
 * @desc    Get single guild info
 * @access  Private (requires MANAGE_GUILD for guild)
 * @returns { guild: GuildInfo }
 */

/**
 * @route   GET /api/guilds/:guildId/channels
 * @desc    Get guild text channels
 * @access  Private (requires MANAGE_GUILD for guild)
 * @returns { channels: GuildChannel[] }
 */

/**
 * @route   GET /api/guilds/:guildId/roles
 * @desc    Get guild roles
 * @access  Private (requires MANAGE_GUILD for guild)
 * @returns { roles: GuildRole[] }
 */

// ==================== WELCOME SYSTEM ROUTES ====================

/**
 * @route   GET /api/guilds/:guildId/welcome
 * @desc    Read welcome config
 * @access  Private (requires MANAGE_GUILD)
 * @returns { config: WelcomeConfig }
 */

/**
 * @route   PUT /api/guilds/:guildId/welcome
 * @desc    Update welcome config
 * @access  Private (requires MANAGE_GUILD)
 * @body    { enabled, channelId, messageTemplate, useEmbed, embedTitle, embedDescription, embedColor, embedThumbnail, embedFooter }
 */

/**
 * @route   POST /api/guilds/:guildId/welcome/test
 * @desc    Send test welcome message
 * @access  Private (requires MANAGE_GUILD)
 * @body    { channelId, messageTemplate, useEmbed, ...embedConfig }
 */

// ==================== STICKY MESSAGES ROUTES ====================

/**
 * @route   GET /api/guilds/:guildId/sticky
 * @desc    List sticky messages
 * @access  Private (requires MANAGE_GUILD)
 * @returns { messages: StickyMessage[] }
 */

/**
 * @route   POST /api/guilds/:guildId/sticky
 * @desc    Create sticky message
 * @access  Private (requires MANAGE_GUILD)
 * @body    { channelId, content, useEmbed, embedConfig? }
 */

/**
 * @route   PUT /api/guilds/:guildId/sticky/:id
 * @desc    Update sticky message
 * @access  Private (requires MANAGE_GUILD)
 * @body    { channelId?, content?, useEmbed?, embedConfig? }
 */

/**
 * @route   DELETE /api/guilds/:guildId/sticky/:id
 * @desc    Delete sticky message
 * @access  Private (requires MANAGE_GUILD)
 */

// ==================== AUTO-REACTIONS ROUTES ====================

/**
 * @route   GET /api/guilds/:guildId/autoreactions
 * @desc    List auto-reaction rules
 * @access  Private (requires MANAGE_GUILD)
 * @returns { rules: AutoReactionRule[] }
 */

/**
 * @route   POST /api/guilds/:guildId/autoreactions
 * @desc    Create auto-reaction rule
 * @access  Private (requires MANAGE_GUILD)
 * @body    { channelId, emoji, triggerType, pattern?, cooldown }
 */

/**
 * @route   PUT /api/guilds/:guildId/autoreactions/:id
 * @desc    Update auto-reaction rule
 * @access  Private (requires MANAGE_GUILD)
 * @body    { channelId?, emoji?, triggerType?, pattern?, cooldown? }
 */

/**
 * @route   DELETE /api/guilds/:guildId/autoreactions/:id
 * @desc    Delete auto-reaction rule
 * @access  Private (requires MANAGE_GUILD)
 */

// ==================== AUTO-RESPONDER ROUTES ====================

/**
 * @route   GET /api/guilds/:guildId/autoresponders
 * @desc    List auto-responder rules
 * @access  Private (requires MANAGE_GUILD)
 * @returns { rules: AutoResponderRule[] }
 */

/**
 * @route   POST /api/guilds/:guildId/autoresponders
 * @desc    Create auto-responder rule
 * @access  Private (requires MANAGE_GUILD)
 * @body    { trigger, matchMode, caseSensitive, responseText, useEmbed, embedConfig?, channelIds, cooldown }
 */

/**
 * @route   PUT /api/guilds/:guildId/autoresponders/:id
 * @desc    Update auto-responder rule
 * @access  Private (requires MANAGE_GUILD)
 */

/**
 * @route   DELETE /api/guilds/:guildId/autoresponders/:id
 * @desc    Delete auto-responder rule
 * @access  Private (requires MANAGE_GUILD)
 */

// ==================== SUGGESTIONS ROUTES ====================

/**
 * @route   GET /api/guilds/:guildId/suggestions
 * @desc    List suggestions with filters
 * @access  Private (requires MANAGE_GUILD)
 * @query   status, page, limit, search
 * @returns { suggestions: SuggestionItem[], meta: PaginationMeta }
 */

/**
 * @route   POST /api/guilds/:guildId/suggestions/:id/approve
 * @desc    Approve a suggestion
 * @access  Private (requires MANAGE_GUILD)
 * @body    { reason? }
 */

/**
 * @route   POST /api/guilds/:guildId/suggestions/:id/deny
 * @desc    Deny a suggestion
 * @access  Private (requires MANAGE_GUILD)
 * @body    { reason? }
 */

/**
 * @route   GET /api/guilds/:guildId/suggestions/config
 * @desc    Get suggestion system config
 * @access  Private (requires MANAGE_GUILD)
 */

/**
 * @route   PUT /api/guilds/:guildId/suggestions/config
 * @desc    Update suggestion system config
 * @access  Private (requires MANAGE_GUILD)
 * @body    { enabled, suggestionChannelId, approvalChannelId, upvoteEmoji, downvoteEmoji, requireDenialReason }
 */

// ==================== MODERATION ROUTES ====================

/**
 * @route   GET /api/guilds/:guildId/automod
 * @desc    Read auto-mod config
 * @access  Private (requires MANAGE_GUILD)
 * @returns { config: AutoModConfig }
 */

/**
 * @route   PUT /api/guilds/:guildId/automod
 * @desc    Update auto-mod config
 * @access  Private (requires MANAGE_GUILD)
 * @body    { antiSpamEnabled, spamThreshold, spamWindow, spamAction, spamMuteDuration, wordFilterEnabled, blockedWords, exemptRoleIds, exemptChannelIds, raidProtectionEnabled, raidThreshold, raidWindow, raidAction }
 */

/**
 * @route   GET /api/guilds/:guildId/escalations
 * @desc    List warning escalation rules
 * @access  Private (requires MANAGE_GUILD)
 * @returns { rules: EscalationRule[] }
 */

/**
 * @route   POST /api/guilds/:guildId/escalations
 * @desc    Add escalation rule
 * @access  Private (requires MANAGE_GUILD)
 * @body    { warningCount, action, duration, resetWarnings }
 */

/**
 * @route   PUT /api/guilds/:guildId/escalations/:id
 * @desc    Update escalation rule
 * @access  Private (requires MANAGE_GUILD)
 */

/**
 * @route   DELETE /api/guilds/:guildId/escalations/:id
 * @desc    Delete escalation rule
 * @access  Private (requires MANAGE_GUILD)
 */

/**
 * @route   POST /api/guilds/:guildId/escalations/reorder
 * @desc    Reorder escalation rules
 * @access  Private (requires MANAGE_GUILD)
 * @body    { order: string[] }
 */

/**
 * @route   GET /api/guilds/:guildId/modlogs
 * @desc    Get moderation logs (read-only)
 * @access  Private (requires MANAGE_GUILD)
 * @query   action, moderatorId, targetUserId, dateFrom, dateTo, page, limit
 * @returns { logs: ModerationLog[], meta: PaginationMeta }
 */

/**
 * @route   GET /api/guilds/:guildId/modlogs/:caseId
 * @desc    Get single case detail
 * @access  Private (requires MANAGE_GUILD)
 */

/**
 * @route   GET /api/guilds/:guildId/modlogs/export
 * @desc    Export moderation logs to CSV
 * @access  Private (requires MANAGE_GUILD)
 * @query   filters
 * @returns CSV file download
 */

// ==================== SERVER SETTINGS ROUTES ====================

/**
 * @route   GET /api/guilds/:guildId/settings
 * @desc    Get guild settings
 * @access  Private (requires MANAGE_GUILD)
 */

/**
 * @route   PUT /api/guilds/:guildId/settings
 * @desc    Update guild settings
 * @access  Private (requires MANAGE_GUILD)
 * @body    { authorizedUserIds, featureFlags }
 */

/**
 * @route   POST /api/guilds/:guildId/settings/reset
 * @desc    Reset all guild config
 * @access  Private (requires MANAGE_GUILD + confirmation token)
 * @body    { confirmationToken }
 */

/**
 * @route   GET /api/guilds/:guildId/authusers
 * @desc    List authorized users
 * @access  Private (requires MANAGE_GUILD)
 */

/**
 * @route   POST /api/guilds/:guildId/authusers
 * @desc    Add authorized user
 * @access  Private (requires MANAGE_GUILD)
 * @body    { userId }
 */

/**
 * @route   DELETE /api/guilds/:guildId/authusers/:userId
 * @desc    Remove authorized user
 * @access  Private (requires MANAGE_GUILD)
 */

// ==================== DEVELOPER ROUTES ====================

/**
 * @route   GET /api/dev/stats
 * @desc    Global bot statistics
 * @access  Developer only
 * @returns { stats: BotStats }
 */

/**
 * @route   GET /api/dev/health
 * @desc    Service health status
 * @access  Developer only
 * @returns { services: ServiceHealth[] }
 */

/**
 * @route   GET /api/dev/cache/stats
 * @desc    Redis cache statistics
 * @access  Developer only
 * @returns { keys: number, hitRate: number, memoryUsage: number }
 */

/**
 * @route   POST /api/dev/cache/clear
 * @desc    Clear all Redis cache
 * @access  Developer only
 */

/**
 * @route   GET /api/dev/guilds
 * @desc    All guilds paginated
 * @access  Developer only
 * @query   page, limit, search, sortBy
 * @returns { guilds: DevGuild[], meta: PaginationMeta }
 */

/**
 * @route   DELETE /api/dev/guilds/:id
 * @desc    Leave a guild
 * @access  Developer only
 */

/**
 * @route   GET /api/dev/commands
 * @desc    Registered command list + usage stats
 * @access  Developer only
 * @returns { commands: CommandInfo[], stats: CommandUsageStat[] }
 */

/**
 * @route   POST /api/dev/commands/register
 * @desc    Re-register slash commands
 * @access  Developer only
 * @body    { guildId?, global? }
 */

/**
 * @route   GET /api/dev/logs
 * @desc    Log stream (SSE or polling)
 * @access  Developer only
 * @query   level, module, search, limit
 * @returns { logs: LogEntry[] }
 */

/**
 * @route   GET /api/dev/users
 * @desc    Dashboard users list
 * @access  Developer only
 * @returns { users: DevUser[] }
 */

/**
 * @route   PATCH /api/dev/users/:id/role
 * @desc    Promote/demote user
 * @access  Developer only
 * @body    { role: 'user' | 'developer' }
 */

/**
 * @route   GET /api/dev/config
 * @desc    Global bot config
 * @access  Developer only
 * @returns { config: GlobalConfig }
 */

/**
 * @route   PUT /api/dev/config
 * @desc    Update global bot config
 * @access  Developer only
 * @body    { activities, errorThreshold, healthCheckInterval, messageCacheTTL, userCacheTTL, maintenanceMode, featureFlags }
 */

/**
 * @route   GET /api/dev/alerts
 * @desc    Alert rules list
 * @access  Developer only
 * @returns { rules: AlertRule[] }
 */

/**
 * @route   POST /api/dev/alerts
 * @desc    Create alert rule
 * @access  Developer only
 * @body    { condition, threshold, metric, target, enabled, cooldown }
 */

/**
 * @route   PUT /api/dev/alerts/:id
 * @desc    Update alert rule
 * @access  Developer only
 */

/**
 * @route   DELETE /api/dev/alerts/:id
 * @desc    Delete alert rule
 * @access  Developer only
 */

// ==================== AUDIT ROUTES ====================

/**
 * @route   POST /api/audit/log
 * @desc    Write audit log entry
 * @access  Private (internal use)
 * @body    { action, resource, guildId?, resourceId?, payload, previousValue? }
 */

/**
 * @route   GET /api/audit/logs
 * @desc    Get audit logs with filtering
 * @access  Developer only
 * @query   userId, guildId, action, resource, dateFrom, dateTo, page, limit
 */

/**
 * @route   GET /api/audit/stats
 * @desc    Get audit statistics
 * @access  Developer only
 * @query   guildId
 */

// ==================== HEALTH CHECK ====================

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 * @returns { status: 'ok', uptime: number }
 */

// ==================== WEBSOCKET ENDPOINTS ====================

/**
 * @route   WS /ws/dev/logs
 * @desc    Real-time log stream for developer dashboard
 * @access  Developer only (validated via session)
 * @events  log, error, stats, ping
 */

/**
 * @route   WS /ws/stats
 * @desc    Real-time stats broadcast
 * @access  Private
 * @events  stats_update, guild_event, alert
 */

// ==================== MIDDLEWARE REQUIREMENTS ====================

/**
 * Required middleware for the backend:
 * 
 * 1. Session validation - Check Redis session store
 * 2. CSRF protection - Validate state parameter
 * 3. Rate limiting - Redis-based per-user and global limits
 * 4. Guild permission check - Verify MANAGE_GUILD or ADMINISTRATOR
 * 5. Developer check - Verify user ID in OWNER_IDS
 * 6. Request validation - Zod schema validation on all write endpoints
 * 7. Audit logging - Log all write operations
 * 8. Error handling - Consistent error responses
 * 9. CORS - Allow only dashboard origin
 * 10. Helmet/CSP - Security headers
 */

// ==================== ERROR RESPONSE FORMAT ====================

/**
 * Standard error response:
 * {
 *   success: false,
 *   error: {
 *     code: 'ERROR_CODE',
 *     message: 'Human readable message',
 *     details?: { field: ['error message'] }
 *   }
 * }
 * 
 * Common error codes:
 * - UNAUTHORIZED (401) - Not logged in
 * - FORBIDDEN (403) - No permission for guild/action
 * - NOT_FOUND (404) - Resource not found
 * - VALIDATION_ERROR (400) - Invalid request body
 * - RATE_LIMITED (429) - Too many requests
 * - DISCORD_API_ERROR (502) - Discord API failure
 * - BOT_UNAVAILABLE (503) - Bot process offline
 * - INTERNAL_ERROR (500) - Server error
 */
