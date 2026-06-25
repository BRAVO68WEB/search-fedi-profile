#!/usr/bin/env node

import { resolve } from "../core/resolver.js";
import type { SearchResult, UnifiedProfile } from "../core/types.js";

const args = process.argv.slice(2);
const jsonFlag = args.includes("--json");
const query = args
  .filter((a) => a !== "--json")
  .join(" ")
  .trim();

if (!query) {
  console.error(`
  ┌─────────────────────────────────────────────────────────────────┐
  │  SEARCH-FEDI-PROFILE                                            │
  │  Discover any Fediverse profile across all protocols             │
  └─────────────────────────────────────────────────────────────────┘

  Usage:
    search-fedi-profile <query> [--json]

  Examples:
    search-fedi-profile @gargron@mastodon.social
    search-fedi-profile bsky.app
    search-fedi-profile bob@example.com
    search-fedi-profile --json @user@mastodon.social
`);
  process.exit(1);
}

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const MAGENTA = "\x1b[35m";
const BLUE = "\x1b[34m";
const WHITE = "\x1b[37m";
const GRAY = "\x1b[90m";

function platformIcon(platform: string): string {
  switch (platform) {
    case "mastodon":
      return `${MAGENTA}◆${RESET}`;
    case "bluesky":
      return `${BLUE}◆${RESET}`;
    case "nostr":
      return `${YELLOW}◆${RESET}`;
    case "threads":
      return `${CYAN}◆${RESET}`;
    case "misskey":
      return `${GREEN}◆${RESET}`;
    case "pleroma":
      return `${GRAY}◆${RESET}`;
    default:
      return `${WHITE}◆${RESET}`;
  }
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + "...";
}

function formatNumber(n: number | undefined): string {
  if (n === undefined) return "-";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function printHeader(): void {
  console.log();
  console.log(
    `${DIM}  ┌─────────────────────────────────────────────────────────────────┐${RESET}`,
  );
  console.log(
    `${DIM}  │${RESET}  ${BOLD}SEARCH-FEDI-PROFILE${RESET}                                             ${DIM}│${RESET}`,
  );
  console.log(
    `${DIM}  │${RESET}  ${DIM}Discover any Fediverse profile across all protocols${RESET}             ${DIM}│${RESET}`,
  );
  console.log(
    `${DIM}  └─────────────────────────────────────────────────────────────────┘${RESET}`,
  );
  console.log();
}

function printProfile(profile: UnifiedProfile, index: number): void {
  const icon = platformIcon(profile.platform);
  const num = `${DIM}[${index}]${RESET}`;

  console.log(`  ${num} ${icon} ${BOLD}${profile.displayName ?? profile.handle}${RESET}`);
  console.log(`      ${DIM}handle${RESET}  ${profile.handle}`);
  console.log(
    `      ${DIM}platform${RESET} ${profile.platform}${profile.software && profile.software !== profile.platform ? ` (${profile.software})` : ""}`,
  );

  if (profile.software) {
    const versionStr = profile.softwareVersion ? ` v${profile.softwareVersion}` : "";
    console.log(`      ${DIM}software${RESET} ${profile.software}${versionStr}`);
  }

  if (profile.bio) {
    const bioLines = profile.bio.split("\n").slice(0, 3);
    console.log(`      ${DIM}bio${RESET}      ${bioLines[0]}`);
    for (let i = 1; i < bioLines.length; i++) {
      console.log(`           ${bioLines[i]}`);
    }
  }

  const stats: string[] = [];
  if (profile.followersCount !== undefined) {
    stats.push(`${formatNumber(profile.followersCount)} followers`);
  }
  if (profile.followingCount !== undefined) {
    stats.push(`${formatNumber(profile.followingCount)} following`);
  }
  if (profile.postsCount !== undefined) {
    stats.push(`${formatNumber(profile.postsCount)} posts`);
  }
  if (stats.length > 0) {
    console.log(`      ${DIM}stats${RESET}    ${stats.join(" · ")}`);
  }

  if (profile.url) {
    console.log(`      ${DIM}url${RESET}      ${CYAN}${profile.url}${RESET}`);
  }

  console.log();
}

function printSummary(profiles: UnifiedProfile[]): void {
  console.log(
    `  ${DIM}┌─────────────────────────────────────────────────────────────────┐${RESET}`,
  );
  console.log(
    `  ${DIM}│${RESET}  ${GREEN}${BOLD}[+]${RESET} ${profiles.length} profile${profiles.length !== 1 ? "s" : ""} found${" ".repeat(Math.max(0, 43 - String(profiles.length).length))}${DIM}│${RESET}`,
  );
  console.log(
    `  ${DIM}└─────────────────────────────────────────────────────────────────┘${RESET}`,
  );
  console.log();
}

function printNoResults(): void {
  console.log(
    `  ${DIM}┌─────────────────────────────────────────────────────────────────┐${RESET}`,
  );
  console.log(
    `  ${DIM}│${RESET}  ${RED}${BOLD}[-]${RESET} No profiles found${" ".repeat(44)}${DIM}│${RESET}`,
  );
  console.log(
    `  ${DIM}└─────────────────────────────────────────────────────────────────┘${RESET}`,
  );
  console.log();
}

function printErrors(errors: { platform: string; error: string }[]): void {
  if (errors.length === 0) return;
  console.log(`  ${DIM}[!] Platforms that could not be reached${RESET}`);
  for (const err of errors) {
    console.log(`      ${RED}[-]${RESET} ${err.platform}: ${DIM}${err.error}${RESET}`);
  }
  console.log();
}

async function main(): Promise<void> {
  printHeader();

  console.log(`  ${DIM}query${RESET}     ${BOLD}${query}${RESET}`);
  console.log(`  ${DIM}status${RESET}    ${YELLOW}querying platforms...${RESET}`);
  console.log();

  const spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const interval = setInterval(() => {
    process.stderr.write(`\r  ${DIM}[${spinner[i++ % spinner.length]}]${RESET} resolving...`);
  }, 80);

  let result: SearchResult;
  try {
    result = await resolve(query);
  } finally {
    clearInterval(interval);
    process.stderr.write("\r" + " ".repeat(40) + "\r");
  }

  if (jsonFlag) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (result.profiles.length === 0) {
    printNoResults();
    printErrors(result.errors);
    process.exit(1);
  }

  printSummary(result.profiles);

  result.profiles.forEach((profile, index) => {
    printProfile(profile, index + 1);
  });

  printErrors(result.errors);
}

main().catch((err) => {
  console.error(`${RED}  [!] Fatal error:${RESET}`, err);
  process.exit(1);
});
