import type { UnifiedProfile } from "../types.js";

const RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
  "wss://relay.primal.net",
];

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bech32Decode(str: string): string | null {
  const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  const data = str.slice(5);
  const buf: number[] = [];
  for (const c of data) {
    const idx = CHARSET.indexOf(c);
    if (idx === -1) return null;
    buf.push(idx);
  }
  if (buf.length < 8) return null;
  const dataWords = buf.slice(0, -6);
  const hexChars: string[] = [];
  for (let i = 0; i < dataWords.length; i += 2) {
    const val = dataWords[i] * 32 + (dataWords[i + 1] ?? 0);
    hexChars.push(val.toString(16).padStart(2, "0"));
  }
  return hexChars.join("");
}

async function fetchNip05(
  domain: string,
  name: string,
  signal?: AbortSignal,
): Promise<{ pubkey: string; relays?: string[] }> {
  const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    signal,
    headers: { "User-Agent": "search-fedi-profile/1.0" },
  });
  if (!res.ok) {
    throw new Error(`NIP-05 lookup failed for ${name}@${domain}: ${res.status}`);
  }
  const data = (await res.json()) as {
    names?: Record<string, string>;
    relays?: Record<string, string[]>;
  };
  const pubkey = data.names?.[name];
  if (!pubkey) {
    throw new Error(`No pubkey found for ${name} at ${domain}`);
  }
  return { pubkey, relays: data.relays?.[pubkey] };
}

async function fetchKind0(
  pubkey: string,
  relays: string[],
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  const allRelays = [...new Set([...relays, ...RELAYS])];
  const filter = JSON.stringify({
    kinds: [0],
    authors: [pubkey],
    limit: 1,
  });

  for (const relay of allRelays) {
    try {
      const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error("timeout"));
        }, 5000);

        const ws = new WebSocket(relay);

        ws.onopen = () => {
          ws.send(JSON.stringify(["REQ", "search-fedi", JSON.parse(filter)]));
        };

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(String(ev.data));
            if (msg[0] === "EVENT" && msg[2]?.kind === 0) {
              clearTimeout(timeout);
              ws.close();
              const content = JSON.parse(msg[2].content);
              resolve(content);
            }
            if (msg[0] === "EOSE") {
              clearTimeout(timeout);
              ws.close();
              reject(new Error("no kind:0 event found"));
            }
          } catch (e) {
            clearTimeout(timeout);
            ws.close();
            reject(e);
          }
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error(`WebSocket error on ${relay}`));
        };

        if (signal) {
          signal.addEventListener("abort", () => {
            clearTimeout(timeout);
            ws.close();
            reject(new Error("aborted"));
          });
        }
      });

      return result;
    } catch {
      continue;
    }
  }
  throw new Error("Could not fetch kind:0 event from any relay");
}

export async function searchNostr(
  identifier: string,
  signal?: AbortSignal,
): Promise<UnifiedProfile> {
  let name: string;
  let domain: string;

  if (identifier.includes("@")) {
    const parts = identifier.split("@");
    name = parts[0] === "_" ? "" : parts[0];
    domain = parts[1];
  } else {
    throw new Error(`Invalid NIP-05 identifier: ${identifier}`);
  }

  const nip05 = await fetchNip05(domain, name, signal);

  let kind0: Record<string, unknown> = {};
  try {
    kind0 = await fetchKind0(nip05.pubkey, nip05.relays ?? [], signal);
  } catch {
    // kind:0 fetch is best-effort; we still have the pubkey
  }

  return {
    platform: "nostr",
    handle: name ? `${name}@${domain}` : domain,
    displayName: (kind0.name as string) ?? (kind0.display_name as string) ?? name,
    bio: kind0.about as string | undefined,
    avatar: kind0.picture as string | undefined,
    banner: kind0.banner as string | undefined,
    url: (kind0.website as string) ?? `https://${domain}`,
    software: "nostr",
    extra: {
      pubkey: nip05.pubkey,
      nip05: identifier,
      lud16: kind0.lud16,
      nip05Relays: nip05.relays,
    },
  };
}

export async function searchNostrByNpub(
  npub: string,
  signal?: AbortSignal,
): Promise<UnifiedProfile> {
  const hex = bech32Decode(npub);
  if (!hex) {
    throw new Error(`Invalid npub: ${npub}`);
  }

  let kind0: Record<string, unknown> = {};
  try {
    kind0 = await fetchKind0(hex, RELAYS, signal);
  } catch {
    // best effort
  }

  return {
    platform: "nostr",
    handle: npub,
    displayName: (kind0.name as string) ?? (kind0.display_name as string),
    bio: kind0.about as string | undefined,
    avatar: kind0.picture as string | undefined,
    banner: kind0.banner as string | undefined,
    url: (kind0.website as string) ?? `https://njump.me/${npub}`,
    software: "nostr",
    extra: {
      pubkey: hex,
      nip05: kind0.nip05,
      lud16: kind0.lud16,
    },
  };
}
