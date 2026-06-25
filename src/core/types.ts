export type Platform = "mastodon" | "bluesky" | "nostr" | "threads" | "misskey" | "pleroma";

export interface NodeInfoData {
  software?: { name?: string; version?: string };
  protocols?: string[];
  openRegistrations?: boolean;
  usage?: { users?: { total?: number; activeMonth?: number }; localPosts?: number };
  raw?: Record<string, unknown>;
}

export interface WebFingerData {
  subject?: string;
  aliases?: string[];
  links?: Array<{ rel: string; type?: string; href?: string; template?: string }>;
  raw?: Record<string, unknown>;
}

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
  softwareVersion?: string;
  nodeInfo?: NodeInfoData;
  webFinger?: WebFingerData;
  isPartial?: boolean;
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
