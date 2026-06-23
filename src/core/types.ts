export type Platform = "mastodon" | "bluesky" | "nostr" | "threads" | "misskey" | "pleroma";

export interface UnifiedProfile {
  platform: Platform;
  handle: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  url?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  createdAt?: string;
  software?: string;
  extra?: Record<string, unknown>;
}

export interface PlatformError {
  platform: Platform | string;
  error: string;
}

export interface SearchResult {
  query: string;
  profiles: UnifiedProfile[];
  errors: PlatformError[];
}

export type InputType = "handle" | "bsky" | "nostr" | "domain";

export interface ParsedInput {
  type: InputType;
  user: string | null;
  domain: string;
  raw: string;
}
