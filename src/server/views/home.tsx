import { Layout } from "./layout.js";

const ASCII_LOGO = [
  "▗▄▄▄▖▗▄▄▄▖▗▄▄▄ ▗▄▄▄▖▗▖  ▗▖▗▄▄▄▖▗▄▄▖  ▗▄▄▖▗▄▄▄▖",
  "▐▌   ▐▌   ▐▌  █  █  ▐▌  ▐▌▐▌   ▐▌ ▐▌▐▌   ▐▌   ",
  "▐▛▀▀▘▐▛▀▀▘▐▌  █  █  ▐▌  ▐▌▐▛▀▀▘▐▛▀▚▖ ▝▀▚▖▐▛▀▀▘",
  "▐▌   ▐▙▄▄▖▐▙▄▄▀▗▄█▄▖ ▝▚▞▘ ▐▙▄▄▖▐▌ ▐▌▗▄▄▞▘▐▙▄▄▖",
].join("\n");

export function Home() {
  return (
    <Layout>
      <section class="section">
        <div class="container">
          <div class="hero-box">
            <pre class="hero-ascii">{ASCII_LOGO}</pre>
            <br />
            <div class="hero-prompt">
              <span class="prompt-symbol">$</span>{" "}
              <span class="prompt-cmd">pnpmx search-fedi-profile @user@mastodon.social</span>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container" style="max-width: 600px;">
          <form action="/search" method="get">
            <div class="search-row">
              <input
                class="input"
                type="text"
                name="q"
                placeholder="@user@mastodon.social  ·  bsky.app  ·  bob@example.com"
                autofocus
              />
              <button class="btn btn-primary" type="submit">
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <h2 class="section-label">
            <span class="marker">[+]</span> Supported Platforms
          </h2>
          <div class="grid-3">
            <div class="card">
              <span class="badge badge-mastodon">Mastodon</span>
              <p style="margin-top:8px;font-size:12px;color:var(--mute)">ActivityPub · WebFinger</p>
            </div>
            <div class="card">
              <span class="badge badge-bluesky">Bluesky</span>
              <p style="margin-top:8px;font-size:12px;color:var(--mute)">AT Protocol · XRPC</p>
            </div>
            <div class="card">
              <span class="badge badge-nostr">Nostr</span>
              <p style="margin-top:8px;font-size:12px;color:var(--mute)">NIP-05 · Relay</p>
            </div>
            <div class="card">
              <span class="badge badge-threads">Threads</span>
              <p style="margin-top:8px;font-size:12px;color:var(--mute)">ActivityPub · WebFinger</p>
            </div>
            <div class="card">
              <span class="badge badge-misskey">Misskey</span>
              <p style="margin-top:8px;font-size:12px;color:var(--mute)">ActivityPub · NodeInfo</p>
            </div>
            <div class="card">
              <span class="badge badge-pleroma">Pleroma</span>
              <p style="margin-top:8px;font-size:12px;color:var(--mute)">ActivityPub · NodeInfo</p>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <h2 class="section-label">
            <span class="marker">[+]</span> Usage
          </h2>
          <div style="margin-top:16px">
            <div class="list-row">
              <span class="marker">[+]</span> <strong>CLI</strong> —{" "}
              <code>npx search-fedi-profile @user@domain</code>
            </div>
            <div class="list-row">
              <span class="marker">[+]</span> <strong>API</strong> —{" "}
              <code>GET /api/search?q=@user@domain</code>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
