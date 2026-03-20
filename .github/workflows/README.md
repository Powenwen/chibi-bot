# GitHub Actions Workflows

This directory contains automated workflows for the Chibi-bot project.

## 📋 Available Workflows

### 1. **CI (Continuous Integration)** - `ci.yml`
**Triggers:** Push to main/develop, Pull Requests

**Jobs:**
- ✅ **Lint & Type Check** - Validates TypeScript code
- 🔨 **Build** - Compiles the project
- 🧪 **Test** - Runs test suite
- ⚙️ **Validate Config** - Checks configuration files
- 🔒 **Security Check** - Audits dependencies
- 📊 **Summary** - Reports overall status

**Status:** ![CI](https://github.com/Powenwen/Chibi-bot/actions/workflows/ci.yml/badge.svg)

---

### 2. **Code Quality** - `code-quality.yml`
**Triggers:** Push to main/develop, Pull Requests

**Jobs:**
- 🎨 **Code Quality Check** - Analyzes code patterns
- 📊 **Complexity Check** - Analyzes project structure
- 📚 **Documentation Check** - Validates documentation

**Status:** ![Code Quality](https://github.com/Powenwen/Chibi-bot/actions/workflows/code-quality.yml/badge.svg)

---

### 3. **Dependency Updates** - `dependency-check.yml`
**Triggers:** Weekly (Mondays at 9 AM UTC), Manual

**Jobs:**
- 🔍 **Check Updates** - Lists outdated dependencies
- 🔒 **Security Updates** - Checks for vulnerabilities

**Status:** ![Dependencies](https://github.com/Powenwen/Chibi-bot/actions/workflows/dependency-check.yml/badge.svg)

---

### 4. **Release** - `release.yml`
**Triggers:** Version tags (v*.*.*)

**Jobs:**
- 🚀 **Create Release** - Builds and publishes release
- 📦 **Upload Artifacts** - Archives build output
- 📢 **Notify** - Announces release

**Status:** ![Release](https://github.com/Powenwen/Chibi-bot/actions/workflows/release.yml/badge.svg)

---

### 5. **PR Validation** - `pr-validation.yml`
**Triggers:** Pull Request events

**Jobs:**
- ✅ **PR Checks** - Validates PR format
- 📏 **Size Check** - Analyzes PR size
- 🏷️ **Label Check** - Ensures proper labeling

**Status:** ![PR Validation](https://github.com/Powenwen/Chibi-bot/actions/workflows/pr-validation.yml/badge.svg)

---

### 6. **Automated Tasks** - `automated-tasks.yml`
**Triggers:** Daily (2 AM UTC), Manual

**Jobs:**
- 🏥 **Health Check** - Daily system validation
- 🧹 **Cleanup** - Removes old artifacts
- 💾 **Backup Reminder** - Database backup alerts
- 📊 **Metrics Report** - Code statistics

**Status:** ![Automated Tasks](https://github.com/Powenwen/Chibi-bot/actions/workflows/automated-tasks.yml/badge.svg)

---

## 🚀 Manual Workflow Triggers

### Run Dependency Check
```bash
gh workflow run dependency-check.yml
```

### Run Automated Tasks
```bash
gh workflow run automated-tasks.yml
```

---

## 📦 Creating a Release

### 1. Update Version
```bash
bun run version:patch  # 1.0.0 → 1.0.1
bun run version:minor  # 1.0.0 → 1.1.0
bun run version:major  # 1.0.0 → 2.0.0
```

### 2. Create and Push Tag
```bash
git add package.json
git commit -m "chore: bump version to v1.0.1"
git tag v1.0.1
git push origin main --tags
```

### 3. Workflow Triggers Automatically
The release workflow will:
- Run tests
- Build project
- Create GitHub release
- Upload artifacts
- Generate changelog

---

## 🔧 Workflow Secrets

### Required Secrets
- `GITHUB_TOKEN` - Automatically provided by GitHub

### Optional Secrets (for future enhancements)
- `DISCORD_WEBHOOK` - For release notifications
- `SENTRY_TOKEN` - For error tracking
- `CODECOV_TOKEN` - For coverage reports

---

## 📊 Workflow Status Badges

Add to README.md:

```markdown
## Build Status

[![CI](https://github.com/Powenwen/Chibi-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/Powenwen/Chibi-bot/actions/workflows/ci.yml)
[![Code Quality](https://github.com/Powenwen/Chibi-bot/actions/workflows/code-quality.yml/badge.svg)](https://github.com/Powenwen/Chibi-bot/actions/workflows/code-quality.yml)
[![Release](https://github.com/Powenwen/Chibi-bot/actions/workflows/release.yml/badge.svg)](https://github.com/Powenwen/Chibi-bot/actions/workflows/release.yml)
```

---

## 🐛 Troubleshooting

### Workflow Fails on Type Check
```bash
# Run locally to debug
bun run type-check
```

### Build Fails
```bash
# Test build locally
bun run build
```

### Dependency Audit Issues
```bash
# Check locally
bun audit
```

---

## 📝 Best Practices

### For Contributors
1. ✅ Ensure all checks pass before creating PR
2. 📝 Write descriptive PR titles (conventional commits)
3. 🏷️ Add appropriate labels to PRs
4. 📊 Keep PRs reasonably sized (<1000 lines)

### For Maintainers
1. 🔒 Review security alerts weekly
2. ⬆️ Update dependencies monthly
3. 📦 Create releases for major changes
4. 📊 Monitor workflow metrics

---

## 🔄 Workflow Updates

To modify workflows:
1. Edit files in `.github/workflows/`
2. Test with `act` (GitHub Actions local runner) if available
3. Create PR with workflow changes
4. Monitor first run after merge

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Bun CI/CD Guide](https://bun.sh/guides/ecosystem/cicd)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Last Updated:** October 19, 2025
