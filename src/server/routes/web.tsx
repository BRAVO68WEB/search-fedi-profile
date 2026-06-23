import { Hono } from "hono";
import { resolve } from "../../core/resolver.js";
import { Home } from "../views/home.js";
import { Result } from "../views/result.js";

const web = new Hono();

web.get("/", (c) => {
  return c.html(<Home />);
});

web.get("/search", async (c) => {
  const q = c.req.query("q");
  if (!q) {
    return c.redirect("/");
  }

  const result = await resolve(q);
  return c.html(<Result result={result} />);
});

export { web };
