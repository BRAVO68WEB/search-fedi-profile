import type { UnifiedProfile } from "../types.js";

const API_BASE = "https://public.api.bsky.app/xrpc";

export async function searchBluesky(handle: string, signal?: AbortSignal): Promise<UnifiedProfile> {
  const cleanHandle = handle.startsWith("@") ? handle.slice(1) : handle;

  const profileRes = await fetch(
    `${API_BASE}/app.bsky.actor.getProfile?actor=${encodeURIComponent(cleanHandle)}`,
    { signal, headers: { "User-Agent": "search-fedi-profile/1.0" } },
  );

  if (!profileRes.ok) {
    const text = await profileRes.text().catch(() => "");
    throw new Error(`Bluesky API error ${profileRes.status}: ${text}`);
  }

  const data = (await profileRes.json()) as Record<string, unknown>;

  return {
    platform: "bluesky",
    handle: data.handle as string,
    displayName: data.displayName as string | undefined,
    bio: data.description as string | undefined,
    avatar: data.avatar as string | undefined,
    banner: data.banner as string | undefined,
    url: `https://bsky.app/profile/${data.handle}`,
    followersCount: data.followersCount as number | undefined,
    followingCount: data.followsCount as number | undefined,
    postsCount: data.postsCount as number | undefined,
    createdAt: data.createdAt as string | undefined,
    software: "bluesky",
    extra: {
      did: data.did,
      indexedAt: data.indexedAt,
      labels: data.labels,
      verification: data.verification,
    },
  };
}
