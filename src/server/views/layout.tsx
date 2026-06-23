import type { Child } from "hono/jsx";

export function Layout({ children }: { children: Child }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Search Fediverse Profile</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.3/css/bulma.min.css" />
        <style>{`
          body {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .main-content { flex: 1; }
          .platform-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .platform-mastodon { background: #6364FF; color: white; }
          .platform-bluesky  { background: #0085FF; color: white; }
          .platform-nostr    { background: #F7931A; color: white; }
          .platform-threads  { background: #000000; color: white; }
          .platform-misskey  { background: #86B300; color: white; }
          .platform-pleroma  { background: #6B4C7A; color: white; }
          .profile-card {
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .profile-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .avatar-ring {
            border: 3px solid #dbdbdb;
            border-radius: 50%;
            overflow: hidden;
          }
          .stat-box {
            text-align: center;
          }
          .stat-number {
            font-weight: 700;
            font-size: 1.25rem;
          }
          .stat-label {
            font-size: 0.75rem;
            color: #7a7a7a;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .hero-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .error-card {
            border-left: 4px solid #ff3860;
          }
          .bio-text {
            max-height: 4.5em;
            overflow: hidden;
            position: relative;
          }
        `}</style>
      </head>
      <body>
        <section class="hero hero-gradient is-small">
          <div class="hero-body">
            <div class="container has-text-centered">
              <p class="title has-text-white">Fediverse Profile Search</p>
              <p class="subtitle has-text-white-bis">
                Discover profiles across Mastodon, Bluesky, Nostr, Threads & more
              </p>
            </div>
          </div>
        </section>
        <main class="main-content">{children}</main>
        <footer class="footer">
          <div class="content has-text-centered">
            <p class="has-text-grey">
              search-fedi-profile — Query any fediverse address across all protocols
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
