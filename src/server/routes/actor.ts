import { Hono } from "hono";
import { getOrCreateRSAKeys } from "../../core/http-signature.js";

export const actor = new Hono();

function getBaseUrl(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    process.env.SIGNATURE_BASE_URL ??
    (() => {
      const host = c.req.header("x-forwarded-host") ?? c.req.header("host") ?? "localhost:3000";
      const proto = c.req.header("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`;
    })()
  );
}

actor.get("/actor", (c) => {
  const { publicKey } = getOrCreateRSAKeys();
  const baseUrl = getBaseUrl(c);

  const actorDoc = {
    "@context": ["https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"],
    id: `${baseUrl}/actor`,
    type: "Application",
    name: "search-fedi-profile",
    preferredUsername: "search-fedi-profile",
    inbox: `${baseUrl}/actor/inbox`,
    publicKey: {
      id: `${baseUrl}/actor#main-key`,
      owner: `${baseUrl}/actor`,
      publicKeyPem: publicKey,
    },
  };

  return c.json(actorDoc, 200, {
    "Content-Type": "application/activity+json",
  });
});

// Some Mastodon instances fetch the key object directly
actor.get("/actor/keys/:keyId", (c) => {
  const { publicKey } = getOrCreateRSAKeys();
  const baseUrl = getBaseUrl(c);

  const keyDoc = {
    "@context": "https://w3id.org/security/v1",
    id: `${baseUrl}/actor#main-key`,
    owner: `${baseUrl}/actor`,
    publicKeyPem: publicKey,
  };

  return c.json(keyDoc, 200, {
    "Content-Type": "application/activity+json",
  });
});
