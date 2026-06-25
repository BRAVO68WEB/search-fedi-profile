import type { UnifiedProfile, WebFingerData } from "../types.js";
import { getOrCreateRSAKeys, signRequestDraftCavage } from "../http-signature.js";

const THREADS_DOMAIN = "threads.net";

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
}

const BASE_HEADERS = {
  Accept: "application/activity+json",
  "User-Agent": "search-fedi-profile/1.0",
};

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

export async function searchThreads(user: string, signal?: AbortSignal): Promise<UnifiedProfile> {
  const cleanUser = user.startsWith("@") ? user.slice(1) : user;

  const wfUrl = `https://${THREADS_DOMAIN}/.well-known/webfinger?resource=acct:${encodeURIComponent(cleanUser)}@${THREADS_DOMAIN}`;
  const wfRes = await fetch(wfUrl, {
    signal,
    headers: { "User-Agent": "search-fedi-profile/1.0" },
  });

  if (!wfRes.ok) {
    throw new Error(
      `Threads WebFinger failed for @${cleanUser}@${THREADS_DOMAIN}: ${wfRes.status}`,
    );
  }

  const wf = (await wfRes.json()) as {
    links?: WebFingerLink[];
    aliases?: string[];
    subject?: string;
  };

  const profilePageLink = wf.links?.find(
    (l) => l.rel === "http://webfinger.net/rel/profile-page" && l.type === "text/html",
  );
  const profileUrl = profilePageLink?.href ?? `https://www.threads.net/@${cleanUser}`;

  const actorLink = wf.links?.find(
    (l) =>
      l.rel === "self" &&
      (l.type?.includes("application/activity+json") || l.type?.includes("application/ld+json")),
  );
  const actorUrl = actorLink?.href;

  const webFinger: WebFingerData = {
    subject: wf.subject,
    aliases: wf.aliases,
    links: wf.links,
    raw: wf as unknown as Record<string, unknown>,
  };

  if (actorUrl) {
    // 1. Try unsigned request
    try {
      const actorRes = await fetch(actorUrl, { signal, headers: BASE_HEADERS });

      if (actorRes.ok) {
        const actor = (await actorRes.json()) as ActorDocument;
        return {
          platform: "threads",
          handle: `@${actor.preferredUsername ?? cleanUser}@${THREADS_DOMAIN}`,
          displayName: actor.name,
          bio: stripHtml(actor.summary),
          avatar: actor.icon?.url,
          banner: actor.image?.url,
          url: actor.url ?? profileUrl,
          software: "threads",
          createdAt: actor.published,
          webFinger,
        };
      }

      // 2. If 401, try with Draft Cavage HTTP Signature
      if (actorRes.status === 401) {
        const { privateKey } = getOrCreateRSAKeys();
        const signedHeaders = signRequestDraftCavage(actorUrl, BASE_HEADERS, privateKey);

        const signedRes = await fetch(actorUrl, { signal, headers: signedHeaders });

        if (signedRes.ok) {
          const actor = (await signedRes.json()) as ActorDocument;
          return {
            platform: "threads",
            handle: `@${actor.preferredUsername ?? cleanUser}@${THREADS_DOMAIN}`,
            displayName: actor.name,
            bio: stripHtml(actor.summary),
            avatar: actor.icon?.url,
            banner: actor.image?.url,
            url: actor.url ?? profileUrl,
            software: "threads",
            createdAt: actor.published,
            webFinger,
          };
        }
      }
    } catch {
      // Actor fetch failed
    }
  }

  return {
    platform: "threads",
    handle: `@${cleanUser}@${THREADS_DOMAIN}`,
    displayName: cleanUser,
    url: profileUrl,
    software: "threads",
    isPartial: true,
    webFinger,
    extra: {
      note: "Threads requires HTTP Signatures for full actor data but returns 500 on signed requests. Showing basic info from WebFinger.",
    },
  };
}
