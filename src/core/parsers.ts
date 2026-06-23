import type { ParsedInput, InputType } from "./types.js";

const BSKY_HANDLES = /\.bsky\.(social|app)$/i;
const NOSTR_NPUB = /^npub1[a-z0-9]{58,}$/i;
const HANDLE_RE = /^@?([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
const DOMAIN_RE = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function parseInput(input: string): ParsedInput {
  const raw = input.trim();
  const stripped = raw.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  if (NOSTR_NPUB.test(stripped)) {
    return { type: "nostr", user: stripped, domain: "", raw };
  }

  if (BSKY_HANDLES.test(stripped)) {
    const handle = stripped.startsWith("@") ? stripped.slice(1) : stripped;
    return { type: "bsky", user: handle, domain: stripped.split(".").slice(1).join("."), raw };
  }

  const handleMatch = stripped.match(HANDLE_RE);
  if (handleMatch) {
    return { type: "handle", user: handleMatch[1], domain: handleMatch[2], raw };
  }

  if (DOMAIN_RE.test(stripped) && !stripped.includes("@")) {
    return { type: "domain", user: null, domain: stripped, raw };
  }

  const withoutAt = stripped.startsWith("@") ? stripped.slice(1) : stripped;
  if (DOMAIN_RE.test(withoutAt)) {
    return { type: "domain", user: null, domain: withoutAt, raw };
  }

  if (withoutAt.includes("@")) {
    const parts = withoutAt.split("@");
    if (parts.length === 2 && DOMAIN_RE.test(parts[1])) {
      return { type: "handle", user: parts[0], domain: parts[1], raw };
    }
  }

  return { type: "handle", user: withoutAt, domain: "", raw };
}

export function buildAcct(parsed: ParsedInput): string {
  if (parsed.user && parsed.domain) {
    return `${parsed.user}@${parsed.domain}`;
  }
  return parsed.raw;
}
