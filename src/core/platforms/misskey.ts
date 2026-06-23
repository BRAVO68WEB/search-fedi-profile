import type { UnifiedProfile } from "../types.js";

interface WebFingerLink {
  rel: string;
  type?: string;
  href?: string;
}

interface ActorDocument {
  type: string;
  preferredUsername?: string;
  name?: string;
  summary?: string;
  icon?: { url: string };
  image?: { url: string };
  url?: string;
  published?: string;
  attachment?: Array<{ type: string; name: string; value: string }>;
}

interface NodeInfoSoftware {
  name?: string;
  version?: string;
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

async function probeNodeInfo(
  domain: string,
  signal?: AbortSignal,
): Promise<NodeInfoSoftware | null> {
  try {
    const niRes = await fetch(`https://${domain}/.well-known/nodeinfo`, {
      signal,
      headers: { "User-Agent": "search-fedi-profile/1.0" },
    });
    if (!niRes.ok) return null;
    const ni = (await niRes.json()) as { links?: Array<{ rel: string; href: string }> };
    const schemaUrl =
      ni.links?.find((l) => l.rel === "http://nodeinfo.diaspora.software/ns/schema/2.1")?.href ??
      ni.links?.find((l) => l.rel === "http://nodeinfo.diaspora.software/ns/schema/2.0")?.href;
    if (!schemaUrl) return null;
    const docRes = await fetch(schemaUrl, {
      signal,
      headers: { "User-Agent": "search-fedi-profile/1.0" },
    });
    if (!docRes.ok) return null;
    const doc = (await docRes.json()) as { software?: NodeInfoSoftware };
    return doc.software ?? null;
  } catch {
    return null;
  }
}

export async function searchMisskey(
  domain: string,
  user: string,
  signal?: AbortSignal,
): Promise<UnifiedProfile> {
  const software = await probeNodeInfo(domain, signal);
  if (!software || !software.name?.toLowerCase().includes("misskey")) {
    throw new Error(`${domain} does not appear to be a Misskey instance`);
  }

  const wfUrl = `https://${domain}/.well-known/webfinger?resource=acct:${encodeURIComponent(user)}@${domain}`;
  const wfRes = await fetch(wfUrl, {
    signal,
    headers: { "User-Agent": "search-fedi-profile/1.0" },
  });
  if (!wfRes.ok) {
    throw new Error(`WebFinger failed on ${domain}: ${wfRes.status}`);
  }

  const wf = (await wfRes.json()) as { links?: WebFingerLink[]; aliases?: string[] };
  const actorLink = wf.links?.find(
    (l) =>
      l.rel === "self" &&
      (l.type?.includes("application/activity+json") || l.type?.includes("application/ld+json")),
  );
  const actorUrl = actorLink?.href ?? wf.aliases?.[0];
  if (!actorUrl) {
    throw new Error(`No actor found for ${user}@${domain}`);
  }

  const actorRes = await fetch(actorUrl, {
    signal,
    headers: {
      Accept: "application/activity+json",
      "User-Agent": "search-fedi-profile/1.0",
    },
  });
  if (!actorRes.ok) {
    throw new Error(`Actor fetch failed: ${actorRes.status}`);
  }

  const actor = (await actorRes.json()) as ActorDocument;

  return {
    platform: "misskey",
    handle: `@${actor.preferredUsername ?? user}@${domain}`,
    displayName: actor.name,
    bio: stripHtml(actor.summary),
    avatar: actor.icon?.url,
    banner: actor.image?.url,
    url: actor.url ?? `https://${domain}/@${actor.preferredUsername ?? user}`,
    software: software.name,
    softwareVersion: software.version,
    createdAt: actor.published,
    extra: {
      fields: actor.attachment,
      instanceSoftware: software.name,
    },
  } as UnifiedProfile & { softwareVersion?: string };
}
