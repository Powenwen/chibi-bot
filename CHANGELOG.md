# Changelog

All notable changes to Chibi Bot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.5.0] - 2026-06-03

### 🔧 Refactoring
- **Environment Configuration**: Moved all hardcoded values (guildID, owners) from `config.ts` to environment variables via `ConfigManager`
- **ConfigManager**: Centralized all configuration through `ConfigManager` — `Client.ts` no longer imports from `config.ts`
- **Dead Code**: `src/config/config.ts` is now unused (all consumers migrated to `ConfigManager`)

### 📚 Documentation
- **README.md**: Updated version badge, added `OWNER_IDS`/`BOT_ACTIVITY_NAME`/`BOT_ACTIVITIES` env vars, expanded feature descriptions, added CLI management section
- **CHANGELOG.md**: Added v3.5.0 entry
- **.env.example**: Added bot activity configuration env vars

### 🎭 Auto-Reaction System Improvements
- **aradd**: Added cooldown support, regex pattern matching, bulk emoji validation, better error messages
- **ardelete**: Added confirmation embed with deleted reaction details
- **arlist**: Improved formatting with emoji type indicators, pagination support

### 🤖 Auto-Responder System Improvements
- **arespadd**: Added regex pattern support, cooldown configuration, response delay, mention suppression
- **arespdelete**: Improved deletion with better feedback and cache invalidation
- **aresplist**: Enhanced formatting with trigger type indicators, pagination

### ⚡ Performance
- **messageCreate**: Migrated auto-reaction/resolver to use `CacheManager` with proper cache key patterns, added cooldown tracking per channel

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