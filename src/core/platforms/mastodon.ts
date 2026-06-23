import type { UnifiedProfile } from "../types.js";

interface WebFingerLink {
  rel: string;
  type?: string;
  href?: string;
}

interface WebFingerResponse {
  subject: string;
  aliases?: string[];
  links?: WebFingerLink[];
}

interface ActorDocument {
  type: string;
  preferredUsername?: string;
  name?: string;
  summary?: string;
  icon?: { url: string };
  image?: { url: string };
  url?: string;
  followers?: string;
  following?: string;
  attachment?: Array<{ type: string; name: string; value: string }>;
  published?: string;
}

async function fetchWebFinger(
  domain: string,
  user: string,
  signal?: AbortSignal,
): Promise<WebFingerResponse> {
  const url = `https://${domain}/.well-known/webfinger?resource=acct:${encodeURIComponent(user)}@${domain}`;
  const res = await fetch(url, {
    signal,
    headers: { "User-Agent": "search-fedi-profile/1.0" },
  });
  if (!res.ok) {
    throw new Error(`WebFinger failed for ${user}@${domain}: ${res.status}`);
  }
  return (await res.json()) as WebFingerResponse;
}

function extractActorUrl(wf: WebFingerResponse): string | null {
  const link =
    wf.links?.find(
      (l) =>
        l.rel === "self" &&
        (l.type?.includes("application/activity+json") ||
          l.type?.includes('application/ld+json; profile="https://www.w3.org/ns/activitystreams"')),
    ) ?? wf.links?.find((l) => l.rel === "self" && l.href);
  return link?.href ?? wf.aliases?.[0] ?? null;
}

async function fetchActor(actorUrl: string, signal?: AbortSignal): Promise<ActorDocument> {
  const res = await fetch(actorUrl, {
    signal,
    headers: {
      Accept: "application/activity+json",
      "User-Agent": "search-fedi-profile/1.0",
    },
  });
  if (!res.ok) {
    throw new Error(`Actor fetch failed: ${res.status}`);
  }
  return (await res.json()) as ActorDocument;
}

function stripHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function searchMastodon(
  domain: string,
  user: string,
  signal?: AbortSignal,
): Promise<UnifiedProfile> {
  const wf = await fetchWebFinger(domain, user, signal);
  const actorUrl = extractActorUrl(wf);
  if (!actorUrl) {
    throw new Error(`No ActivityPub actor found for ${user}@${domain}`);
  }

  const actor = await fetchActor(actorUrl, signal);

  return {
    platform: "mastodon",
    handle: `@${actor.preferredUsername ?? user}@${domain}`,
    displayName: actor.name,
    bio: stripHtml(actor.summary),
    avatar: actor.icon?.url,
    banner: actor.image?.url,
    url: actor.url ?? `https://${domain}/@${actor.preferredUsername ?? user}`,
    software: "mastodon",
    createdAt: actor.published,
    extra: {
      fields: actor.attachment,
      actorType: actor.type,
    },
  };
}
