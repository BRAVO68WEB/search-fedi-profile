import { Layout } from "./layout.js";

export function Home() {
  return (
    <Layout>
      <section class="section">
        <div class="container" style="max-width: 640px;">
          <form action="/search" method="get">
            <div class="field has-addons">
              <div class="control is-expanded">
                <input
                  class="input is-medium is-rounded"
                  type="text"
                  name="q"
                  placeholder="@user@mastodon.social, bsky.app, bob@example.com"
                  autofocus
                />
              </div>
              <div class="control">
                <button class="button is-primary is-medium is-rounded" type="submit">
                  Search
                </button>
              </div>
            </div>
          </form>

          <div class="section" style="padding-top: 2rem;">
            <h4 class="title is-5 has-text-grey">Supported Platforms</h4>
            <div class="columns is-multiline is-mobile">
              <div class="column is-4">
                <div class="box has-text-centered">
                  <span class="platform-badge platform-mastodon">Mastodon</span>
                </div>
              </div>
              <div class="column is-4">
                <div class="box has-text-centered">
                  <span class="platform-badge platform-bluesky">Bluesky</span>
                </div>
              </div>
              <div class="column is-4">
                <div class="box has-text-centered">
                  <span class="platform-badge platform-nostr">Nostr</span>
                </div>
              </div>
              <div class="column is-4">
                <div class="box has-text-centered">
                  <span class="platform-badge platform-threads">Threads</span>
                </div>
              </div>
              <div class="column is-4">
                <div class="box has-text-centered">
                  <span class="platform-badge platform-misskey">Misskey</span>
                </div>
              </div>
              <div class="column is-4">
                <div class="box has-text-centered">
                  <span class="platform-badge platform-pleroma">Pleroma</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section" style="padding-top: 1rem;">
            <h4 class="title is-5 has-text-grey">Examples</h4>
            <div class="content">
              <ul>
                <li>
                  <code>@gargron@mastodon.social</code> — Mastodon handle
                </li>
                <li>
                  <code>bsky.app</code> — Bluesky profile
                </li>
                <li>
                  <code>bob@example.com</code> — NIP-05 Nostr address
                </li>
                <li>
                  <code>@zuck@threads.net</code> — Threads profile
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
