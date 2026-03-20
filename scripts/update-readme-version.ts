#!/usr/bin/env bun
/**
 * Auto-Update README Version Badge Script
 * 
 * This script automatically updates the version badge in README.md
 * to match the current package.json version.
 * 
 * Usage:
 *   bun run scripts/update-readme-version.ts [options]
 * 
 * Options:
 *   --dry-run    - Show what would be changed without making changes
 *   --help       - Show this help message
 * 
 * This script is automatically called by the version update script,
 * but can also be run manually if needed.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface PackageJson {
    version: string;
    [key: string]: any;
}

class ReadmeVersionUpdater {
    private packageJsonPath: string;
    private readmePath: string;
    private packageJson!: PackageJson;

    constructor() {
        this.packageJsonPath = resolve(process.cwd(), 'package.json');
        // README.md is in the project root
        this.readmePath = resolve(process.cwd(), 'README.md');
        this.loadPackageJson();
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

    private getCurrentDate(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}--${month}--${day}`;
    }

    public updateReadmeVersion(dryRun: boolean = false): void {
        if (!existsSync(this.readmePath)) {
            throw new Error('README.md not found in current directory');
        }

        try {
            let readmeContent = readFileSync(this.readmePath, 'utf-8');
            const currentVersion = this.packageJson.version;
            const currentDate = this.getCurrentDate();

            // Pattern to match the version badge
            const versionBadgePattern = /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[^-]+-brightgreen\)/;
            const dateBadgePattern = /!\[Last Updated\]\(https:\/\/img\.shields\.io\/badge\/last%20updated-[\d-]+-blue\)/;

            // Create new badges
            const newVersionBadge = `![Version](https://img.shields.io/badge/version-${currentVersion}-brightgreen)`;
            const newDateBadge = `![Last Updated](https://img.shields.io/badge/last%20updated-${currentDate}-blue)`;

            // Check if version badge exists and needs updating
            const versionMatch = readmeContent.match(versionBadgePattern);
            const dateMatch = readmeContent.match(dateBadgePattern);

            if (!versionMatch) {
                console.log('⚠️  Version badge not found in README.md');
                console.log('    Expected pattern: ![Version](https://img.shields.io/badge/version-X.Y.Z-brightgreen)');
                return;
            }

            let changes = 0;
            let changeLog: string[] = [];

            // Update version badge if it's different
            if (versionMatch[0] !== newVersionBadge) {
                console.log(`📦 Updating version badge: ${versionMatch[0]} → ${newVersionBadge}`);
                readmeContent = readmeContent.replace(versionBadgePattern, newVersionBadge);
                changes++;
                changeLog.push(`Version: ${versionMatch[0]} → ${newVersionBadge}`);
            } else {
                console.log(`✅ Version badge is already up to date (${currentVersion})`);
            }

            // Update date badge if it exists and is different
            if (dateMatch && dateMatch[0] !== newDateBadge) {
                console.log(`📅 Updating date badge: ${dateMatch[0]} → ${newDateBadge}`);
                readmeContent = readmeContent.replace(dateBadgePattern, newDateBadge);
                changes++;
                changeLog.push(`Date: ${dateMatch[0]} → ${newDateBadge}`);
            } else if (dateMatch) {
                console.log(`✅ Date badge is already up to date`);
            }

            if (changes === 0) {
                console.log('📋 No changes needed - README.md is already up to date');
                return;
            }

            if (dryRun) {
                console.log('\n🧪 DRY RUN MODE - Changes that would be made:');
                changeLog.forEach(change => console.log(`   ${change}`));
                console.log('\n✅ Dry run completed');
                return;
            }

            // Write the updated content
            writeFileSync(this.readmePath, readmeContent, 'utf-8');
            console.log(`✅ README.md updated successfully (${changes} change${changes > 1 ? 's' : ''})`);

        } catch (error) {
            throw new Error(`Failed to update README.md: ${error}`);
        }
    }
}

function parseArguments(): { dryRun: boolean; help: boolean } {
    const args = process.argv.slice(2);
    let dryRun = false;
    let help = false;

    for (const arg of args) {
        switch (arg) {
            case '--dry-run':
                dryRun = true;
                break;
            case '--help':
            case '-h':
                help = true;
                break;
            default:
                if (arg.startsWith('-')) {
                    throw new Error(`Unknown option: ${arg}`);
                }
        }
    }

    return { dryRun, help };
}

function showHelp(): void {
    const helpText = `
Auto-Update README Version Badge Script

Usage:
  bun run scripts/update-readme-version.ts [options]

Options:
  --dry-run    - Show what would be changed without making changes
  --help, -h   - Show this help message

Description:
  This script automatically updates the version badge in README.md
  to match the current package.json version. It also updates the
  "Last Updated" badge with the current date.

Examples:
  bun run scripts/update-readme-version.ts
  bun run scripts/update-readme-version.ts --dry-run

Badge Patterns:
  Version: ![Version](https://img.shields.io/badge/version-X.Y.Z-brightgreen)
  Date:    ![Last Updated](https://img.shields.io/badge/last%20updated-YYYY--MM--DD-blue)
`;
    console.log(helpText);
}

function main(): void {
    try {
        const { dryRun, help } = parseArguments();

        if (help) {
            showHelp();
            return;
        }

        console.log('🔄 Updating README.md version badge...');
        
        const updater = new ReadmeVersionUpdater();
        updater.updateReadmeVersion(dryRun);

    } catch (error) {
        console.error(`❌ Error: ${error}`);
        process.exit(1);
    }
}

// Run the script
main();
