import type { UnifiedProfile, NodeInfoData, WebFingerData } from "../types.js";

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

interface NodeInfoRaw {
  software?: { name?: string; version?: string };
  protocols?: string[];
  openRegistrations?: boolean;
  usage?: { users?: { total?: number; activeMonth?: number }; localPosts?: number };
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

export async function searchPleroma(
  domain: string,
  user: string,
  signal?: AbortSignal,
): Promise<UnifiedProfile> {
  const nodeInfoResult = await probeNodeInfo(domain, signal);
  if (
    !nodeInfoResult.software ||
    !nodeInfoResult.software.name?.toLowerCase().match(/pleroma|akkoma/)
  ) {
    throw new Error(`${domain} does not appear to be a Pleroma/Akkoma instance`);
  }

  const wfUrl = `https://${domain}/.well-known/webfinger?resource=acct:${encodeURIComponent(user)}@${domain}`;
  const wfRes = await fetch(wfUrl, {
    signal,
    headers: { "User-Agent": "search-fedi-profile/1.0" },
  });
  if (!wfRes.ok) {
    throw new Error(`WebFinger failed on ${domain}: ${wfRes.status}`);
  }

  const wf = (await wfRes.json()) as {
    subject?: string;
    links?: WebFingerLink[];
    aliases?: string[];
  };
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

  return {
    platform: "pleroma",
    handle: `@${actor.preferredUsername ?? user}@${domain}`,
    displayName: actor.name,
    bio: stripHtml(actor.summary),
    avatar: actor.icon?.url,
    banner: actor.image?.url,
    url: actor.url ?? `https://${domain}/@${actor.preferredUsername ?? user}`,
    software: nodeInfoResult.software.name,
    softwareVersion: nodeInfoResult.software.version,
    createdAt: actor.published,
    nodeInfo,
    webFinger,
    extra: {
      fields: actor.attachment,
    },
  };
}
