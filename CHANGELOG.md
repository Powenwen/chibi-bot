# Changelog

All notable changes to Chibi Bot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.5.0] - 2026-06-12

### 🌐 Web Dashboard Integration
- **Full Dashboard-Bot Integration**: Connected the React web dashboard to the bot's Express backend with Discord OAuth2 authentication
- **Express Server**: Added `src/server/` with REST API routes for all guild features (welcome, sticky, auto-reactions, auto-responder, suggestions, auto-mod, escalations, mod-logs)
- **WebSocket Server**: Real-time event broadcasting for moderation actions via `src/server/websocket.ts`
- **Session Management**: Custom `IoRedisStore` for Express sessions with Redis backend (replaced incompatible `connect-redis`)
- **Auth Middleware**: `requireAuth` + `requireGuildAccess` middleware with Redis-cached Discord permission checks (10-min TTL)
- **Dashboard Auth Flow**: "Trust but verify" model — single `/auth/me` check on mount, global 401 interceptor auto-clears expired sessions
- **Protected Routes**: Loading state during auth check, no redirect flash

### 🎨 UI/UX Improvements
- **@skyra/discord-components-react**: Replaced custom Discord embed renderer with official library for authentic Discord-styled messages
- **Custom Form Styling**: Styled checkboxes, radio buttons, range sliders, select elements, and toggle switches
- **Card Hover Effects**: Smooth lift transitions on interactive cards
- **Guild Icon Fallback**: Colored initials when guild has no icon (in sidebar and guild selector)
- **Slash Commands**: Updated all command references from `c!` prefix to `/` across the dashboard

### 🔧 Bug Fixes & Sync Corrections
- **Welcome System**: Fixed `type` enum mismatch (frontend sent `"default"`, model expects `"embed"/"text"/"both"`), made `channelID` optional in model, added explicit field mapping in backend route to prevent validation failures
- **Sticky Messages**: Fixed `authorID` being set to guild ID instead of user ID, added required field generation (`messageID`, `uniqueID`, `messageChannelID`)
- **Auto-Responder**: Fixed `channelID` validation — backend now explicitly maps all fields instead of blind-spreading `req.body`
- **Suggestions**: Fixed status enum mismatch (backend now uses capitalized `"Approved"`/`"Denied"` to match model), fixed `upvotes`/`downvotes` type (arrays of user IDs, not numbers), added `suggestion` field mapping
- **Auto-Mod**: Fixed `toApi` mapper — now includes `duplicateFilter`, `linkFilter`, and `caps` sections the model expects
- **Logs Tab**: Fixed filter field (`log.type` not `log.action`), fixed moderator/target search fields
- **Feature Toggles**: Fixed `AutoReactionModel`/`AutoResponderModel` toggle — these models don't have `enabled` field, toggle now checks document existence instead
- **Escalation Rules**: Fixed `deleteEscalationRule` return type mismatch
- **BigInt Permissions**: Fixed Discord permission checking for large integers using BigInt in middleware

### 🏗️ Architecture
- **Feature Toggle Routes**: Added `src/server/routes/features.ts` with GET/PUT endpoints that read/write `enabled` field on each feature's MongoDB collection
- **Bot Permissions Endpoint**: Added `/api/guilds/:guildId/bot-permissions` — checks bot's actual server-level permissions from member object + role resolution
- **Dashboard Directory**: Renamed from `chibi-bot-web-dashboard` to `dashboard`

### 📚 Documentation
- **README.md**: Updated with dashboard features, correct env vars, accurate project structure including `src/server/` and `dashboard/`
- **Dashboard README**: Updated auth flow, environment variables, database collections, and development instructions

## [3.1.2] - 2025-09-28

### 🔧 Fixed
- **TypeScript Strict Mode**: Fixed all 22 TypeScript compilation errors across 7 files
- **Command Option Resolvers**: Properly typed `CommandInteractionOptionResolver` in all command files
- **Import Duplicates**: Removed duplicate `CommandInteraction` imports in moderation commands
- **Type Safety**: Enhanced type safety with proper casting of interaction options

### 📚 Documentation  
- **README.md**: Comprehensive documentation update with detailed setup instructions
- **Package Description**: Updated package.json description to reflect current features
- **Keywords**: Enhanced package.json keywords for better discoverability
- **Troubleshooting**: Added troubleshooting section with common issues and solutions
- **Scripts Documentation**: Complete documentation of all available npm/bun scripts

### 🏗️ Code Quality
- **Strict TypeScript**: All code now passes strict TypeScript compilation
- **Error Handling**: Improved error handling across command implementations
- **Code Organization**: Better import management and type definitions

### 📁 Files Changed
- `src/commands/info/help.ts` - Fixed option resolver type issues
- `src/commands/moderation/mute.ts` - Removed duplicate imports
- `src/commands/moderation/warn.ts` - Fixed option resolver methods
- `src/commands/moderation/warning-escalation.ts` - Fixed all option resolver calls
- `src/commands/role-management/addrole.ts` - Fixed option resolver types
- `src/commands/role-management/removerole.ts` - Fixed option resolver types  
- `src/commands/role-management/roleinfo.ts` - Fixed option resolver types
- `README.md` - Comprehensive documentation updates
- `package.json` - Updated description and keywords
- `CHANGELOG.md` - Added version history documentation

## [3.1.1] - 2025-08-05

### 🚀 Features
- **Advanced Moderation System**: Complete moderation suite with warning escalation
- **Auto-Moderation**: Intelligent spam, word, and raid protection
- **Welcome System**: Rich, customizable welcome messages with variables
- **Sticky Messages**: Auto-reposting important channel announcements
- **Auto-Reaction System**: Automated emoji reactions for channels
- **Suggestion System**: Community feedback collection with voting
- **Fun Commands**: Interactive games and entertainment features

### 🔧 Technical Improvements
- **Bun Runtime**: Optimized for Bun JavaScript runtime
- **MongoDB Integration**: Comprehensive database schema and models
- **Redis Caching**: Optional Redis integration for performance
- **Health Monitoring**: Built-in health checks and validation
- **Configuration Management**: Runtime configuration validation
- **Version Management**: Automated version bumping system

### 📊 Database Models
- **ModerationSystem**: Complete moderation logging and case management
- **WelcomeSystem**: Server-specific welcome configurations
- **StickyMessages**: Persistent message management
- **AutoReactions**: Channel-specific reaction automation
- **Suggestions**: User feedback and voting system
- **WarningEscalation**: Automated punishment escalation

## [3.1.0] - 2025-07-20

### 🎉 Initial Release
- **Core Bot Framework**: Basic Discord.js bot structure
- **Command System**: Slash command implementation
- **Event Handling**: Discord event management
- **Database Setup**: MongoDB connection and basic models
- **Configuration**: Environment-based configuration system

---

## Release Notes Format

### Types of Changes
- **🚀 Added** - New features
- **🔧 Changed** - Changes in existing functionality  
- **🗑️ Deprecated** - Soon-to-be removed features
- **❌ Removed** - Removed features
- **🔧 Fixed** - Bug fixes
- **🔒 Security** - Security improvements
- **📚 Documentation** - Documentation updates
- **🏗️ Technical** - Internal technical changes

### Commit Convention
This project follows [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `docs:` - Documentation updates
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks
- `BREAKING CHANGE:` - Breaking changes (major version bump)

### Version Numbering
Following [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

---