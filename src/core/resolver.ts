import type { SearchResult, UnifiedProfile, PlatformError, Platform } from "./types.js";
import { parseInput, buildAcct } from "./parsers.js";
import { probeNodeInfo, identifySoftware } from "./detect.js";
import { searchBluesky } from "./platforms/bluesky.js";
import { searchMastodon } from "./platforms/mastodon.js";
import { searchNostr, searchNostrByNpub } from "./platforms/nostr.js";
import { searchThreads } from "./platforms/threads.js";
import { searchMisskey } from "./platforms/misskey.js";
import { searchPleroma } from "./platforms/pleroma.js";

const TIMEOUT = 10_000;

function createSignal(): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), TIMEOUT);
  return controller;
}

function isBskyDomain(domain: string): boolean {
  return domain === "bsky.social" || domain === "bsky.app";
}

function isThreadsDomain(domain: string): boolean {
  return domain === "threads.net";
}

async function resolveActivityPub(domain: string, user: string): Promise<UnifiedProfile> {
  const controller = createSignal();
  const info = await probeNodeInfo(domain, controller.signal);
  const software = info?.software?.name ? identifySoftware(info.software.name) : "mastodon";

  switch (software) {
    case "misskey":
      return searchMisskey(domain, user, controller.signal);
    case "pleroma":
      return searchPleroma(domain, user, controller.signal);
    default:
      return searchMastodon(domain, user, controller.signal);
  }
}

export async function resolve(input: string): Promise<SearchResult> {
  const parsed = parseInput(input);
  const tasks: Promise<UnifiedProfile>[] = [];
  const platformLabels: string[] = [];

  switch (parsed.type) {
    case "bsky": {
      const controller = createSignal();
      tasks.push(searchBluesky(parsed.user!, controller.signal));
      platformLabels.push("bluesky");
      break;
    }

    case "nostr": {
      if (parsed.domain) {
        const controller = createSignal();
        tasks.push(searchNostr(buildAcct(parsed), controller.signal));
        platformLabels.push("nostr");
      }
      const npubController = createSignal();
      tasks.push(searchNostrByNpub(parsed.user!, npubController.signal));
      platformLabels.push("nostr");
      break;
    }

    case "handle": {
      if (isBskyDomain(parsed.domain)) {
        const controller = createSignal();
        tasks.push(searchBluesky(parsed.user!, controller.signal));
        platformLabels.push("bluesky");
      } else if (isThreadsDomain(parsed.domain)) {
        const controller = createSignal();
        tasks.push(searchThreads(parsed.user!, controller.signal));
        platformLabels.push("threads");
      } else {
        const controller = createSignal();
        tasks.push(resolveActivityPub(parsed.domain, parsed.user!));
        platformLabels.push("activitypub");

        const nostrController = createSignal();
        tasks.push(searchNostr(buildAcct(parsed), nostrController.signal));
        platformLabels.push("nostr");
      }
      break;
    }

    case "domain": {
      // Try as Bluesky handle
      const bskyController = createSignal();
      tasks.push(searchBluesky(parsed.domain, bskyController.signal));
      platformLabels.push("bluesky");

      // Try as Threads user
      const threadsController = createSignal();
      tasks.push(searchThreads(parsed.domain, threadsController.signal));
      platformLabels.push("threads");

      // Try as NIP-05 root identifier
      const nostrController = createSignal();
      tasks.push(searchNostr(`_@${parsed.domain}`, nostrController.signal));
      platformLabels.push("nostr");

      // Try ActivityPub/WebFinger: split domain into possible user@host
      // e.g. "bravo68web.b68.dev" → user="bravo68web", host="b68.dev"
      const parts = parsed.domain.split(".");
      if (parts.length >= 3) {
        const possibleUser = parts[0];
        const possibleHost = parts.slice(1).join(".");
        const apController = createSignal();
        tasks.push(resolveActivityPub(possibleHost, possibleUser));
        platformLabels.push("activitypub");
      }

      break;
    }
  }

  const results = await Promise.allSettled(tasks);

  const profiles: UnifiedProfile[] = [];
  const errors: PlatformError[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      profiles.push(result.value);
    } else {
      errors.push({
        platform: platformLabels[i] as Platform,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  });

  return { query: parsed.raw, profiles, errors };
}
