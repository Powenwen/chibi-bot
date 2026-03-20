# Chibi Bot

<div align="center">
    <img src="./assets/chibi-icon.png" alt="Chibi Bot Icon" width="200" height="200" />
</div>

A comprehensive Discord bot written in TypeScript with MongoDB and Redis integration. Features advanced moderation, welcome systems, sticky messages, auto-reactions, suggestion system, and fun commands. Built with strict TypeScript for enhanced type safety and reliability.

![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![Version](https://img.shields.io/badge/version-3.4.1-brightgreen)
![Discord Bot](https://img.shields.io/badge/Discord%20Bot-Ready-success)
![Code Quality](https://img.shields.io/badge/Code%20Quality-Strict%20TS-brightgreen)
![Runtime](https://img.shields.io/badge/Runtime-Bun-orange)

## Build Status

[![CI](https://github.com/Powenwen/Chibi-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/Powenwen/Chibi-bot/actions/workflows/ci.yml)
[![Code Quality](https://github.com/Powenwen/Chibi-bot/actions/workflows/code-quality.yml/badge.svg)](https://github.com/Powenwen/Chibi-bot/actions/workflows/code-quality.yml)
[![Dependencies](https://github.com/Powenwen/Chibi-bot/actions/workflows/dependency-check.yml/badge.svg)](https://github.com/Powenwen/Chibi-bot/actions/workflows/dependency-check.yml)

## ✨ Features

### 🎉 **Welcome System**
- Customizable welcome messages for new members
- Rich embeds with variables like `{user}`, `{server}`, `{memberCount}`
- Channel-specific configuration
- MongoDB persistence

### 📌 **Sticky Messages**
- Auto-reposting messages when other messages are sent
- Channel-specific sticky messages
- Easy management via slash commands
- Database persistence

### 🎭 **Auto-Reaction System**
- Automatic emoji reactions for specific channels
- Support for custom server emojis and Unicode
- Pattern-based reactions
- Redis caching for performance

### 🤖 **Auto-Responder System**
- Automatic message responses to keywords/phrases
- Case-sensitive and case-insensitive matching
- Exact match or contains mode
- Channel-specific configuration
- Administrator-controlled with Redis caching

### 💡 **Suggestion System**
- User suggestion submission via slash commands
- Admin approval/denial workflow
- Status tracking with reasons
- Community voting with custom emojis

### 🛡️ **Advanced Moderation System**
- **Warning System**: User warnings with escalation rules
- **Auto-Moderation**: Spam protection, word filtering, raid protection  
- **Moderation Tools**: Ban, kick, mute, timeout with comprehensive logging
- **Case Management**: Detailed moderation logs and case tracking
- **Permission Control**: Role-based command access and safety checks

### 🎮 **Fun Commands**
- Interactive games (Rock-Paper-Scissors, 8-ball, dice)
- Random content (jokes, facts, coin flips)
- Server and user information commands
- Ping and status commands

## 🚀 Quick Start

### Prerequisites
- **[Bun](https://bun.sh/)** v1.0+ (Latest recommended)
- **[Node.js](https://nodejs.org/)** 18+ (Alternative runtime)
- **[MongoDB](https://www.mongodb.com/)** 5.0+ (Database)
- **[Redis](https://redis.io/)** 6.0+ (Optional, for caching and performance)
- **Discord Bot Token** from [Discord Developer Portal](https://discord.com/developers/applications)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Powenwen/Chibi-bot.git
   cd Chibi-bot
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Discord bot token and database settings
   ```

4. **Validate setup**
   ```bash
   # Validate configuration and dependencies
   bun run validate-config
   
   # Check database connectivity
   bun run health-check
   ```

5. **Start the bot**
   ```bash
   # Development mode (with hot reload)
   bun run dev
   
   # Production mode
   bun run start
   
   # Full validation + start
   bun run full-check
   ```

## ⚙️ Configuration

Create a `.env` file with the following settings:

```env
# Discord Bot Configuration
TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_id_here
GUILD_ID=your_discord_guild_id_here

# Database Configuration
MONGO_URI=mongodb://localhost:27017/chibibase
MONGO_DB_NAME=chibibase

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Development Settings
NODE_ENV=development
PREFIX=c!

# Feature Flags
ENABLE_WELCOME_SYSTEM=true
ENABLE_STICKY_MESSAGES=true
ENABLE_AUTO_REACTIONS=true
ENABLE_HEALTH_CHECKS=true

# Cache and Monitoring
MESSAGE_CACHE_TTL=3600
USER_DATA_CACHE_TTL=7200
ERROR_THRESHOLD=50
HEALTH_CHECK_INTERVAL=300000

# Command Registration
USE_GUILD_COMMANDS=true
TARGET_GUILD_ID=your_test_guild_id_here
FORCE_REGISTER_COMMANDS=false
```

## 📝 Available Scripts

### Development & Build
```bash
bun run dev              # Start with hot reload
bun run start            # Production start
bun run build            # Build for production
bun run build:watch      # Build with watch mode
bun run clean           # Clean build artifacts
```

### Type Checking & Validation
```bash
bun run type-check       # Main TypeScript checking
bun run type-check:scripts # Scripts TypeScript checking
bun run validate         # Full TypeScript validation
bun run validate-config  # Configuration validation
bun run health-check     # Database & services health check
bun run full-check       # Complete validation + health + start
```

### Version Management
```bash
bun run version:patch    # Bump patch version (3.1.2 → 3.1.3)
bun run version:minor    # Bump minor version (3.1.2 → 3.2.0)
bun run version:major    # Bump major version (3.1.2 → 4.0.0)
bun run readme:update-version # Update README version badge
```

### Testing
```bash
bun run test            # Run test suite
bun run test:watch      # Run tests in watch mode
bun run test:coverage   # Run tests with coverage
```

## 📁 Project Structure

```
src/
├── commands/           # Slash commands by category
│   ├── auto-reaction-system/
│   ├── auto-responder-system/
│   ├── dev/
│   ├── fun/
│   ├── info/
│   ├── moderation/
│   ├── sticky-message/
│   ├── suggestion-system/
│   └── welcome-system/
├── events/            # Discord.js event handlers
│   ├── client/
│   ├── guild/
│   └── interaction/
├── features/          # Core feature implementations
├── models/            # MongoDB schemas
├── structures/        # Bot classes and handlers
├── utils/             # Utility functions
└── index.ts          # Main entry point

scripts/               # Development scripts
assets/               # Bot images and icons
```

## 🔧 Code Quality & Development

### TypeScript Configuration
- **Strict Mode**: Full TypeScript strict mode enabled for maximum type safety
- **Path Mapping**: Clean imports with `@/` aliases for better organization
- **Separate Configs**: Dedicated tsconfig for scripts and main application
- **Build Target**: Optimized for Bun runtime with ES modules

### Development Features
- **Hot Reload**: Instant restart on file changes during development
- **Health Monitoring**: Built-in health checks for databases and services
- **Configuration Validation**: Runtime validation of environment variables
- **Version Management**: Automated version bumping with git integration
- **Error Handling**: Comprehensive error handling and logging system

### Performance Optimizations
- **Redis Caching**: Optional Redis integration for improved performance
- **Connection Pooling**: Efficient MongoDB connection management
- **Event Optimization**: Optimized Discord.js event handling
- **Memory Management**: Careful resource management and cleanup

## 🗃️ Database Collections

The bot automatically creates these MongoDB collections:

### Core System Collections
- `welcomesystems` - Welcome message configurations per server
- `stickymessages` - Sticky message data and settings  
- `autoreactions` - Auto-reaction channel configurations
- `autoresponders` - Auto-responder trigger and response configurations
- `authorizedusers` - Authorized user permissions and roles

### Suggestion System
- `suggestions` - User-submitted suggestions with voting
- `suggestionchannels` - Suggestion channel configurations per server

### Moderation System  
- `moderationlogs` - Detailed moderation action logs
- `moderations` - Active moderation cases and infractions
- `automoderations` - Auto-moderation configuration per server
- `warningescalations` - Warning escalation rules and thresholds

All collections include proper indexing for optimal query performance and automatic cleanup of expired data where applicable.

## 🔧 Troubleshooting

### Common Issues

**TypeScript Errors**
```bash
# Fix type checking issues
bun run type-check
bun run validate
```

**Database Connection Issues**
```bash
# Check database connectivity
bun run health-check
bun run validate-config
```

**Environment Configuration**
```bash
# Ensure .env file exists and is properly configured
cp .env.example .env
# Edit .env with your actual values
```

**Bot Permissions**
- Ensure bot has necessary permissions in Discord server
- Check that bot token is valid and not expired
- Verify CLIENT_ID and GUILD_ID are correct

**Performance Issues**
- Enable Redis caching for better performance
- Check MongoDB connection and indexing
- Monitor bot memory usage and restart if needed

### Debug Mode
```bash
# Enable verbose logging
NODE_ENV=development bun run dev

# Check specific component health
bun run health-check
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Install dependencies (`bun install`)
4. Make your changes with proper TypeScript types
5. Run validation (`bun run validate`)
6. Test your changes thoroughly
7. Commit with conventional commit format (`git commit -m 'feat: add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request with detailed description

### Code Style
- Follow TypeScript strict mode requirements
- Use meaningful variable and function names
- Add JSDoc comments for public methods
- Ensure all type checks pass
- Test edge cases and error conditions

### Commit Convention
- `feat:` - New features
- `fix:` - Bug fixes  
- `docs:` - Documentation updates
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Community

- **🐛 Bug Reports**: [GitHub Issues](https://github.com/Powenwen/Chibi-bot/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/Powenwen/Chibi-bot/discussions)
- **📚 Documentation**: This README and inline code documentation
- **💬 Discord Support**: [Join our server](https://discord.gg/chibimation)


## 📊 Project Stats

![GitHub Stars](https://img.shields.io/github/stars/Powenwen/Chibi-bot?style=social)
![GitHub Forks](https://img.shields.io/github/forks/Powenwen/Chibi-bot?style=social)
![GitHub Issues](https://img.shields.io/github/issues/Powenwen/Chibi-bot)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/Powenwen/Chibi-bot)
![Last Commit](https://img.shields.io/github/last-commit/Powenwen/Chibi-bot)

---

<div align="center">

**Made with ❤️ for the Discord community**

*Empowering Discord servers with comprehensive moderation and engagement tools*

</div>
