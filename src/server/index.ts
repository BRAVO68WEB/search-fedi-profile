import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { api } from "./routes/api.js";
import { web } from "./routes/web.js";

const app = new Hono();

app.route("/api", api);
app.route("/", web);

const portArg = process.argv.indexOf("--port");
const port =
  (portArg !== -1 ? Number(process.argv[portArg + 1]) : undefined) ??
  (process.env.PORT ? Number(process.env.PORT) : 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`\n  search-fedi-profile server running at http://localhost:${info.port}\n`);
});
