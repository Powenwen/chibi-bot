#!/usr/bin/env bun
/**
 * Version Update Script for Chibi Bot
 * 
 * This script automatically updates the project version in package.json,
 * creates git tags, and provides various versioning options.
 * 
 * Usage:
 *   bun run scripts/update-version.ts [type] [options]
 * 
 * Types:
 *   patch   - Increment patch version (1.5.4 -> 1.5.5)
 *   minor   - Increment minor version (1.5.4 -> 1.6.0)
 *   major   - Increment major version (1.5.4 -> 2.0.0)
 *   custom  - Set custom version (requires --version flag)
 * 
 * Options:
 *   --version <version>  - Set specific version (for custom type)
 *   --no-git           - Skip git operations
 *   --dry-run          - Show what would be done without making changes
 *   --help             - Show this help message
 * 
 * Examples:
 *   bun run scripts/update-version.ts patch
 *   bun run scripts/update-version.ts minor --no-git
 *   bun run scripts/update-version.ts custom --version 2.0.0
 *   bun run scripts/update-version.ts major --dry-run
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

interface PackageJson {
    name: string;
    version: string;
    [key: string]: any;
}

interface VersionUpdateOptions {
    type: 'patch' | 'minor' | 'major' | 'custom';
    customVersion?: string;
    noGit?: boolean;
    dryRun?: boolean;
    help?: boolean;
}

class VersionUpdater {
    private packageJsonPath: string;
    private packageJson!: PackageJson;
    private originalVersion: string;

    constructor() {
        this.packageJsonPath = resolve(process.cwd(), 'package.json');
        this.loadPackageJson();
        this.originalVersion = this.packageJson.version;
    }

    private loadPackageJson(): void {
        if (!existsSync(this.packageJsonPath)) {
            throw new Error('package.json not found in current directory');
        }

        try {
            const content = readFileSync(this.packageJsonPath, 'utf-8');
            this.packageJson = JSON.parse(content);
        } catch (error) {
            throw new Error(`Failed to parse package.json: ${error}`);
        }

        if (!this.packageJson.version) {
            throw new Error('No version field found in package.json');
        }
    }

    private parseVersion(version: string): { major: number; minor: number; patch: number } {
        const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
        if (!match) {
            throw new Error(`Invalid version format: ${version}. Expected format: x.y.z`);
        }

        return {
            major: parseInt(match[1], 10),
            minor: parseInt(match[2], 10),
            patch: parseInt(match[3], 10)
        };
    }

    private incrementVersion(type: 'patch' | 'minor' | 'major'): string {
        const { major, minor, patch } = this.parseVersion(this.originalVersion);

        switch (type) {
            case 'patch':
                return `${major}.${minor}.${patch + 1}`;
            case 'minor':
                return `${major}.${minor + 1}.0`;
            case 'major':
                return `${major + 1}.0.0`;
            default:
                throw new Error(`Invalid version type: ${type}`);
        }
    }

    private validateCustomVersion(version: string): boolean {
        return /^\d+\.\d+\.\d+$/.test(version);
    }

    private isGitRepository(): boolean {
        try {
            execSync('git rev-parse --git-dir', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }

    private hasUncommittedChanges(): boolean {
        try {
            const status = execSync('git status --porcelain', { encoding: 'utf-8' });
            return status.trim().length > 0;
        } catch {
            return false;
        }
    }

    private executeGitOperations(newVersion: string, dryRun: boolean): void {
        if (!this.isGitRepository()) {
            console.log('⚠️  Not a git repository, skipping git operations');
            return;
        }

        const commands = [
            `git add package.json README.md`,
            `git commit -m "chore: bump version to ${newVersion}"`,
            `git tag -a v${newVersion} -m "Release version ${newVersion}"`
        ];

        console.log('\n📝 Git operations:');
        commands.forEach(cmd => {
            console.log(`  $ ${cmd}`);
            if (!dryRun) {
                try {
                    execSync(cmd, { stdio: 'inherit' });
                } catch (error) {
                    console.error(`❌ Failed to execute: ${cmd}`);
                    throw error;
                }
            }
        });

        if (!dryRun) {
            console.log(`✅ Created git tag: v${newVersion}`);
            console.log('💡 Push changes with: git push && git push --tags');
        }
    }

    private updatePackageJson(newVersion: string, dryRun: boolean): void {
        const updatedPackageJson = {
            ...this.packageJson,
            version: newVersion
        };

        console.log(`📦 Updating package.json version: ${this.originalVersion} → ${newVersion}`);

        if (!dryRun) {
            try {
                writeFileSync(
                    this.packageJsonPath,
                    JSON.stringify(updatedPackageJson, null, 2) + '\n',
                    'utf-8'
                );
                console.log('✅ package.json updated successfully');
            } catch (error) {
                throw new Error(`Failed to write package.json: ${error}`);
            }
        }
    }

    private updateReadmeVersion(dryRun: boolean): void {
        try {
            console.log('📋 Updating README.md version badge...');
            
            if (dryRun) {
                execSync('bun run scripts/update-readme-version.ts --dry-run', { stdio: 'inherit' });
            } else {
                execSync('bun run scripts/update-readme-version.ts', { stdio: 'inherit' });
            }
        } catch (error) {
            console.log('⚠️  Warning: Failed to update README.md version badge');
            console.log('   You may need to update it manually');
        }
    }

    private rollback(): void {
        console.log('\n🔄 Rolling back changes...');
        try {
            const originalContent = JSON.stringify(this.packageJson, null, 2) + '\n';
            writeFileSync(this.packageJsonPath, originalContent, 'utf-8');
            console.log('✅ Rollback completed');
        } catch (error) {
            console.error(`❌ Rollback failed: ${error}`);
        }
    }

    public updateVersion(options: VersionUpdateOptions): void {
        try {
            let newVersion: string;

            // Determine new version
            if (options.type === 'custom') {
                if (!options.customVersion) {
                    throw new Error('Custom version requires --version flag');
                }
                if (!this.validateCustomVersion(options.customVersion)) {
                    throw new Error(`Invalid custom version format: ${options.customVersion}. Expected format: x.y.z`);
                }
                newVersion = options.customVersion;
            } else {
                newVersion = this.incrementVersion(options.type);
            }

            // Validation
            if (newVersion === this.originalVersion) {
                console.log(`⚠️  Version ${newVersion} is the same as current version`);
                return;
            }

            // Check for uncommitted changes (only if git operations enabled)
            if (!options.noGit && this.isGitRepository() && this.hasUncommittedChanges()) {
                console.log('⚠️  Warning: You have uncommitted changes. Consider committing them first.');
                console.log('    Continue anyway? The version update will be committed separately.');
            }

            // Show summary
            console.log('\n🚀 Version Update Summary:');
            console.log(`   Project: ${this.packageJson.name}`);
            console.log(`   Current: ${this.originalVersion}`);
            console.log(`   New:     ${newVersion}`);
            console.log(`   Type:    ${options.type}`);
            console.log(`   Git ops: ${options.noGit ? 'disabled' : 'enabled'}`);
            console.log(`   Mode:    ${options.dryRun ? 'dry-run' : 'live'}`);

            if (options.dryRun) {
                console.log('\n🧪 DRY RUN MODE - No changes will be made\n');
            } else {
                console.log('');
            }

            // Update package.json
            this.updatePackageJson(newVersion, options.dryRun || false);

            // Update README.md version badge
            this.updateReadmeVersion(options.dryRun || false);

            // Git operations
            if (!options.noGit) {
                this.executeGitOperations(newVersion, options.dryRun || false);
            }

            // Success message
            if (!options.dryRun) {
                console.log(`\n🎉 Successfully updated version to ${newVersion}!`);
                
                if (!options.noGit && this.isGitRepository()) {
                    console.log('\n📋 Next steps:');
                    console.log('   1. Review the changes');
                    console.log('   2. Push to remote: git push && git push --tags');
                    console.log('   3. Create a release on GitHub (optional)');
                }
            } else {
                console.log('\n✅ Dry run completed successfully');
            }

        } catch (error) {
            console.error(`\n❌ Error: ${error}`);
            
            if (!options.dryRun) {
                this.rollback();
            }
            
            process.exit(1);
        }
    }
}

function parseArguments(): VersionUpdateOptions {
    const args = process.argv.slice(2);
    const options: VersionUpdateOptions = {
        type: 'patch',
        noGit: false,
        dryRun: false,
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case 'patch':
            case 'minor':
            case 'major':
            case 'custom':
                options.type = arg;
                break;
            case '--version':
                options.customVersion = args[++i];
                break;
            case '--no-git':
                options.noGit = true;
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
            default:
                if (arg.startsWith('-')) {
                    throw new Error(`Unknown option: ${arg}`);
                }
        }
    }

    return options;
}

function showHelp(): void {
    const helpText = `
Version Update Script for Chibi Bot

Usage:
  bun run scripts/update-version.ts [type] [options]

Types:
  patch   - Increment patch version (1.5.4 -> 1.5.5)
  minor   - Increment minor version (1.5.4 -> 1.6.0) 
  major   - Increment major version (1.5.4 -> 2.0.0)
  custom  - Set custom version (requires --version flag)

Options:
  --version <version>  - Set specific version (for custom type)
  --no-git           - Skip git operations (no commit/tag)
  --dry-run          - Show what would be done without making changes
  --help, -h         - Show this help message

Examples:
  bun run scripts/update-version.ts patch
  bun run scripts/update-version.ts minor --no-git
  bun run scripts/update-version.ts custom --version 2.0.0
  bun run scripts/update-version.ts major --dry-run

Git Integration:
  - Automatically commits package.json changes
  - Creates annotated git tags (v<version>)
  - Provides push instructions
  - Use --no-git to disable git operations
`;
    console.log(helpText);
}

function main(): void {
    try {
        const options = parseArguments();

        if (options.help) {
            showHelp();
            return;
        }

        const updater = new VersionUpdater();
        updater.updateVersion(options);

    } catch (error) {
        console.error(`❌ Error: ${error}`);
        process.exit(1);
    }
}

// Run the script
main();
