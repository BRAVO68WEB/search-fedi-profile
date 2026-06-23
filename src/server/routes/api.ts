import { Hono } from "hono";
import { resolve } from "../../core/resolver.js";

const api = new Hono();

api.get("/search", async (c) => {
  const q = c.req.query("q");
  if (!q) {
    return c.json({ error: "Missing query parameter ?q=" }, 400);
  }

  try {
    const result = await resolve(q);
    return c.json(result);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

export { api };
