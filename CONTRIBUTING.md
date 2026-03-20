# Contributing to Chibi Bot

Thank you for your interest in contributing to Chibi Bot! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- **[Bun](https://bun.sh/)** v1.0+ (Primary runtime)
- **[Node.js](https://nodejs.org/)** 18+ (Alternative runtime)
- **[Git](https://git-scm.com/)** for version control
- **[MongoDB](https://www.mongodb.com/)** for local database testing
- **[Redis](https://redis.io/)** (Optional, for performance testing)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/Chibi-bot.git
   cd Chibi-bot
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your test bot credentials
   ```

4. **Validate Setup**
   ```bash
   bun run validate-config
   bun run type-check
   bun run health-check
   ```

5. **Start Development**
   ```bash
   bun run dev
   ```

## 📋 Development Guidelines

### Code Style
- **TypeScript Strict Mode**: All code must pass strict TypeScript checking
- **Naming Conventions**: Use camelCase for variables, PascalCase for classes
- **File Organization**: Follow the existing directory structure
- **Import Statements**: Use path aliases (`@/`) for cleaner imports
- **Documentation**: Add JSDoc comments for public methods and classes

### TypeScript Requirements
```bash
# Always run before committing
bun run type-check        # Main application
bun run type-check:scripts # Development scripts
bun run validate          # Full validation suite
```

### Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring without changing functionality
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks, dependency updates

**Examples:**
```bash
git commit -m "feat(moderation): add warning escalation system"
git commit -m "fix(commands): resolve option resolver type issues"
git commit -m "docs: update README with setup instructions"
```

## 🏗️ Project Structure

```
src/
├── commands/           # Discord slash commands
│   ├── moderation/    # Moderation-related commands
│   ├── utility/       # Utility commands
│   ├── fun/           # Entertainment commands
│   └── info/          # Information commands
├── events/            # Discord.js event handlers
├── features/          # Core feature implementations
├── models/            # MongoDB schemas and models
├── structures/        # Bot framework classes
├── utils/             # Utility functions and helpers
├── shared/            # Shared constants and types
└── config/            # Configuration management

scripts/               # Development and build scripts
assets/               # Static assets (images, icons)
```

## 🔧 Adding New Features

### Creating New Commands
1. **Choose Category**: Place in appropriate `commands/` subdirectory
2. **Follow Template**: Use existing commands as templates
3. **Type Safety**: Ensure proper TypeScript typing
4. **Error Handling**: Include comprehensive error handling
5. **Documentation**: Add JSDoc comments and usage examples

**Command Template:**
```typescript
import {
    CommandInteraction,
    CommandInteractionOptionResolver,
    SlashCommandBuilder
} from "discord.js";
import { BaseCommand } from "@/interfaces";

export default <BaseCommand>{
    data: new SlashCommandBuilder()
        .setName("example")
        .setDescription("Example command description"),
    
    config: {
        category: "utility",
        usage: "/example",
        examples: ["/example"],
        permissions: []
    },
    
    async execute(interaction: CommandInteraction) {
        const options = interaction.options as CommandInteractionOptionResolver;
        
        // Command implementation
        await interaction.reply("Hello, World!");
    }
};
```

### Adding New Features
1. **Feature Planning**: Create an issue to discuss the feature
2. **Implementation**: Follow existing patterns in `features/` directory
3. **Database Models**: Add MongoDB schemas if needed
4. **Testing**: Test thoroughly with various scenarios
5. **Documentation**: Update README and add examples

### Database Changes
- **Models**: Add new models in `src/models/`
- **Migrations**: Document any schema changes
- **Indexing**: Consider performance implications
- **Validation**: Include proper data validation

## 🧪 Testing Guidelines

### Manual Testing
```bash
# Start development server
bun run dev

# Test in Discord server
# Verify all commands work as expected
# Test error scenarios and edge cases
```

### Validation Testing
```bash
# TypeScript compilation
bun run type-check

# Configuration validation
bun run validate-config

# Health checks
bun run health-check

# Full validation suite
bun run validate
```

### Testing Checklist
- [ ] All TypeScript checks pass
- [ ] Commands respond correctly
- [ ] Error handling works properly
- [ ] Database operations are correct
- [ ] Permissions are respected
- [ ] Memory usage is reasonable

## 📝 Pull Request Process

### Before Submitting
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make Changes**
   - Follow code style guidelines
   - Add tests if applicable
   - Update documentation

3. **Validate Changes**
   ```bash
   bun run validate
   bun run health-check
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to Fork**
   ```bash
   git push origin feature/amazing-feature
   ```

### Pull Request Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] TypeScript checks pass (`bun run validate`)
- [ ] Manual testing completed
- [ ] Health checks pass (`bun run health-check`)

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
```

## 🐛 Bug Reports

### Before Reporting
1. **Check Existing Issues**: Search for similar issues
2. **Reproduce Locally**: Ensure the bug is reproducible
3. **Gather Information**: Collect relevant logs and environment details

### Bug Report Template
```markdown
**Bug Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
A clear and concise description of what you expected to happen.

**Environment**
- OS: [e.g., Windows 11, macOS 12]
- Runtime: [e.g., Bun 1.0.7, Node.js 18.17.0]
- Bot Version: [e.g., 3.1.2]
- Discord.js Version: [e.g., 14.16.3]

**Additional Context**
Add any other context about the problem here, including logs or screenshots.
```

## 💡 Feature Requests

### Guidelines
- **Be Specific**: Clearly describe the feature and its benefits
- **Consider Scope**: Ensure the feature fits the bot's purpose
- **Technical Feasibility**: Consider implementation complexity
- **User Impact**: Explain how users would benefit

### Feature Request Template
```markdown
**Feature Description**
A clear and concise description of the feature you'd like to see.

**Problem/Use Case**
Describe the problem this feature would solve or the use case it addresses.

**Proposed Solution**
Describe how you envision this feature working.

**Alternative Solutions**
Describe any alternative solutions or features you've considered.

**Additional Context**
Add any other context, mockups, or examples about the feature request.
```

## 📞 Community & Support

- **GitHub Issues**: 
- **GitHub Discussions**: 
- **Discord Server**: [Real-time support and community](https://discord.gg/chibimation)
- **Email**: 

## 📜 License

By contributing to Chibi Bot, you agree that your contributions will be licensed under the [ISC License](LICENSE).

---

Thank you for contributing to Chibi Bot! Your help makes this project better for everyone. 🎉