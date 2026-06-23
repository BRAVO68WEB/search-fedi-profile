export interface NodeInfo {
  software: {
    name: string;
    version?: string;
  };
  protocols?: string[];
  openRegistrations?: boolean;
  usage?: {
    users?: { total?: number; activeMonth?: number };
    localPosts?: number;
  };
}

export async function probeNodeInfo(
  domain: string,
  signal?: AbortSignal,
): Promise<NodeInfo | null> {
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

    const doc = (await docRes.json()) as NodeInfo;
    return doc;
  } catch {
    return null;
  }
}

export async function isActivityPubServer(domain: string, signal?: AbortSignal): Promise<boolean> {
  const info = await probeNodeInfo(domain, signal);
  return info?.protocols?.includes("activitypub") ?? false;
}

export function identifySoftware(
  name: string,
): "mastodon" | "misskey" | "pleroma" | "threads" | "unknown" {
  const lower = name.toLowerCase();
  if (lower.includes("mastodon")) return "mastodon";
  if (lower.includes("misskey")) return "misskey";
  if (lower.includes("pleroma") || lower.includes("akkoma")) return "pleroma";
  if (lower.includes("threads")) return "threads";
  return "unknown";
}
