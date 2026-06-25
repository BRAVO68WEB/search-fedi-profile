import type { UnifiedProfile, NodeInfoData, WebFingerData } from "../types.js";
import { getOrCreateRSAKeys, signRequestDraftCavage } from "../http-signature.js";

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

interface NodeInfoRaw {
  software?: { name?: string; version?: string };
  protocols?: string[];
  openRegistrations?: boolean;
  usage?: { users?: { total?: number; activeMonth?: number }; localPosts?: number };
}

const BASE_HEADERS = {
  Accept: "application/activity+json",
  "User-Agent": "search-fedi-profile/1.0",
};

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

async function fetchActor(actorUrl: string, signal?: AbortSignal): Promise<ActorDocument | null> {
  // 1. Try unsigned request
  const res = await fetch(actorUrl, {
    signal,
    headers: BASE_HEADERS,
  });

  if (res.ok) {
    return (await res.json()) as ActorDocument;
  }

  // 2. If 401, try with Draft Cavage HTTP Signature
  if (res.status === 401) {
    try {
      const { privateKey } = getOrCreateRSAKeys();
      const signedHeaders = signRequestDraftCavage(actorUrl, BASE_HEADERS, privateKey);

      const signedRes = await fetch(actorUrl, {
        signal,
        headers: signedHeaders,
      });

      if (signedRes.ok) {
        return (await signedRes.json()) as ActorDocument;
      }
    } catch {
      // Signing failed
    }
  }

  return null;
}

async function fetchNodeInfo(
  domain: string,
  signal?: AbortSignal,
): Promise<{ software: { name?: string; version?: string } | null; raw: NodeInfoRaw | null }> {
  try {
    const niRes = await fetch(`https://${domain}/.well-known/nodeinfo`, {
      signal,
      headers: { "User-Agent": "search-fedi-profile/1.0" },
    });
    if (!niRes.ok) return { software: null, raw: null };
    const ni = (await niRes.json()) as { links?: Array<{ rel: string; href: string }> };
    const schemaUrl =
      ni.links?.find((l) => l.rel === "http://nodeinfo.diaspora.software/ns/schema/2.1")?.href ??
      ni.links?.find((l) => l.rel === "http://nodeinfo.diaspora.software/ns/schema/2.0")?.href;
    if (!schemaUrl) return { software: null, raw: null };
    const docRes = await fetch(schemaUrl, {
      signal,
      headers: { "User-Agent": "search-fedi-profile/1.0" },
    });
    if (!docRes.ok) return { software: null, raw: null };
    const doc = (await docRes.json()) as NodeInfoRaw;
    return { software: doc.software ?? null, raw: doc };
  } catch {
    return { software: null, raw: null };
  }
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
  const [wf, nodeInfoResult] = await Promise.all([
    fetchWebFinger(domain, user, signal),
    fetchNodeInfo(domain, signal),
  ]);

  const actorUrl = extractActorUrl(wf);
  if (!actorUrl) {
    throw new Error(`No ActivityPub actor found for ${user}@${domain}`);
  }

  const actor = await fetchActor(actorUrl, signal);

  const nodeInfo: NodeInfoData | undefined = nodeInfoResult.raw
    ? {
        software: nodeInfoResult.raw.software,
        protocols: nodeInfoResult.raw.protocols,
        openRegistrations: nodeInfoResult.raw.openRegistrations,
        usage: nodeInfoResult.raw.usage,
        raw: nodeInfoResult.raw as Record<string, unknown>,
      }
    : undefined;

  const webFinger: WebFingerData = {
    subject: wf.subject,
    aliases: wf.aliases,
    links: wf.links,
    raw: wf as unknown as Record<string, unknown>,
  };

  // If actor fetch failed, return partial profile
  if (!actor) {
    return {
      platform: "mastodon",
      handle: `@${user}@${domain}`,
      displayName: user,
      url: `https://${domain}/@${user}`,
      software: nodeInfoResult.software?.name ?? "mastodon",
      softwareVersion: nodeInfoResult.software?.version,
      isPartial: true,
      nodeInfo,
      webFinger,
      extra: {
        note: "This instance requires HTTP Signatures for full profile data. Showing basic info from WebFinger.",
      },
    };
  }

  // Full profile
  return {
    platform: "mastodon",
    handle: `@${actor.preferredUsername ?? user}@${domain}`,
    displayName: actor.name,
    bio: stripHtml(actor.summary),
    avatar: actor.icon?.url,
    banner: actor.image?.url,
    url: actor.url ?? `https://${domain}/@${actor.preferredUsername ?? user}`,
    software: nodeInfoResult.software?.name ?? "mastodon",
    softwareVersion: nodeInfoResult.software?.version,
    createdAt: actor.published,
    isPartial: false,
    nodeInfo,
    webFinger,
    extra: {
      fields: actor.attachment,
      actorType: actor.type,
    },
  };
}
