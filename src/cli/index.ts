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
  search-fedi-profile — Fediverse Profile Search

  Usage:
    npx tsx src/cli/index.ts <query> [--json]

  Examples:
    npx tsx src/cli/index.ts @gargron@mastodon.social
    npx tsx src/cli/index.ts bsky.app
    npx tsx src/cli/index.ts bob@example.com
    npx tsx src/cli/index.ts --json @user@mastodon.social
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

function platformColor(platform: string): string {
  switch (platform) {
    case "mastodon":
      return "\x1b[35m"; // magenta
    case "bluesky":
      return "\x1b[34m"; // blue
    case "nostr":
      return "\x1b[33m"; // yellow
    case "threads":
      return "\x1b[36m"; // cyan
    case "misskey":
      return "\x1b[32m"; // green
    case "pleroma":
      return "\x1b[90m"; // gray
    default:
      return RESET;
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

function printTable(profiles: UnifiedProfile[]): void {
  if (profiles.length === 0) return;

  const colW = {
    platform: 10,
    handle: 30,
    name: 20,
    followers: 10,
    posts: 8,
  };

  const header = [
    "Platform".padEnd(colW.platform),
    "Handle".padEnd(colW.handle),
    "Name".padEnd(colW.name),
    "Followers".padStart(colW.followers),
    "Posts".padStart(colW.posts),
  ].join(" │ ");

  const sep = [
    "─".repeat(colW.platform),
    "─".repeat(colW.handle),
    "─".repeat(colW.name),
    "─".repeat(colW.followers),
    "─".repeat(colW.posts),
  ].join("─┼─");

  console.log(`\n${DIM}${sep}${RESET}`);
  console.log(`${BOLD}${header}${RESET}`);
  console.log(`${DIM}${sep}${RESET}`);

  for (const p of profiles) {
    const color = platformColor(p.platform);
    const row = [
      `${color}${p.platform.padEnd(colW.platform)}${RESET}`,
      truncate(p.handle, colW.handle).padEnd(colW.handle),
      truncate(p.displayName ?? "-", colW.name).padEnd(colW.name),
      formatNumber(p.followersCount).padStart(colW.followers),
      formatNumber(p.postsCount).padStart(colW.posts),
    ].join(" │ ");
    console.log(row);
  }

  console.log(`${DIM}${sep}${RESET}\n`);

  for (const p of profiles) {
    const color = platformColor(p.platform);
    console.log(`${color}${BOLD}[${p.platform}]${RESET} ${p.handle}`);
    if (p.bio) {
      const bioLines = p.bio.split("\n").slice(0, 3);
      for (const line of bioLines) {
        console.log(`  ${DIM}${truncate(line, 72)}${RESET}`);
      }
    }
    if (p.url) {
      console.log(`  ${CYAN}${p.url}${RESET}`);
    }
    if (p.software) {
      console.log(`  ${DIM}Software: ${p.software}${RESET}`);
    }
    console.log();
  }
}

async function main(): Promise<void> {
  console.log(`${DIM}Searching for: ${BOLD}${query}${RESET}`);

  const spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const interval = setInterval(() => {
    process.stderr.write(`\r${CYAN}${spinner[i++ % spinner.length]}${RESET} Querying platforms...`);
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
    console.log(`${RED}No profiles found for: ${query}${RESET}`);
    if (result.errors.length > 0) {
      console.log(`\n${YELLOW}Errors:${RESET}`);
      for (const err of result.errors) {
        console.log(`  ${RED}✗${RESET} ${err.platform}: ${err.error}`);
      }
    }
    process.exit(1);
  }

  console.log(`${GREEN}Found ${result.profiles.length} profile(s)${RESET}`);
  printTable(result.profiles);

  if (result.errors.length > 0) {
    console.log(`${DIM}Platforms that failed:${RESET}`);
    for (const err of result.errors) {
      console.log(`  ${DIM}• ${err.platform}: ${err.error}${RESET}`);
    }
    console.log();
  }
}

main().catch((err) => {
  console.error(`${RED}Fatal error:${RESET}`, err);
  process.exit(1);
});
