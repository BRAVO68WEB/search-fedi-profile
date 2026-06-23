import type { SearchResult } from "../../core/types.js";
import { Layout } from "./layout.js";

function formatNumber(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function platformColor(platform: string): string {
  switch (platform) {
    case "mastodon":
      return "#6364FF";
    case "bluesky":
      return "#0085FF";
    case "nostr":
      return "#F7931A";
    case "threads":
      return "#000000";
    case "misskey":
      return "#86B300";
    case "pleroma":
      return "#6B4C7A";
    default:
      return "#363636";
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function Result({ result }: { result: SearchResult }) {
  return (
    <Layout>
      <section class="section">
        <div class="container">
          <div class="level">
            <div class="level-left">
              <div class="level-item">
                <h2 class="title is-4">
                  Results for <code>{escapeHtml(result.query)}</code>
                </h2>
              </div>
            </div>
            <div class="level-right">
              <div class="level-item">
                <a class="button is-light is-rounded" href="/">
                  ← New Search
                </a>
              </div>
            </div>
          </div>

          {result.profiles.length > 0 && (
            <p class="subtitle is-6 has-text-grey mb-4">
              Found {result.profiles.length} profile{result.profiles.length !== 1 ? "s" : ""}
            </p>
          )}

          <div class="columns is-multiline">
            {result.profiles.map((profile) => (
              <div class="column is-6" key={profile.platform + profile.handle}>
                <div class="card profile-card">
                  <div class="card-content">
                    <div class="media">
                      <div class="media-left">
                        {profile.avatar ? (
                          <figure class="image is-64x64 avatar-ring">
                            <img
                              src={profile.avatar}
                              alt={profile.displayName ?? profile.handle}
                              style="object-fit: cover; width: 64px; height: 64px;"
                            />
                          </figure>
                        ) : (
                          <figure class="image is-64x64 avatar-ring">
                            <div
                              style={`width:64px;height:64px;background:${platformColor(profile.platform)};display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:700;`}
                            >
                              {(profile.displayName ?? profile.handle ?? "?")[0].toUpperCase()}
                            </div>
                          </figure>
                        )}
                      </div>
                      <div class="media-content">
                        <p class="title is-5 mb-1">{profile.displayName ?? profile.handle}</p>
                        <p class="subtitle is-6 has-text-grey mb-1">{escapeHtml(profile.handle)}</p>
                        <span class={`platform-badge platform-${profile.platform}`}>
                          {profile.platform}
                          {profile.software && profile.software !== profile.platform
                            ? ` (${profile.software})`
                            : ""}
                        </span>
                      </div>
                    </div>

                    {profile.bio && (
                      <div class="content mt-3">
                        <p class="bio-text" style="white-space: pre-wrap;">
                          {escapeHtml(profile.bio)}
                        </p>
                      </div>
                    )}

                    <div class="columns is-mobile is-gapless mt-3">
                      <div class="column stat-box">
                        <div class="stat-number">{formatNumber(profile.followersCount)}</div>
                        <div class="stat-label">Followers</div>
                      </div>
                      <div class="column stat-box">
                        <div class="stat-number">{formatNumber(profile.followingCount)}</div>
                        <div class="stat-label">Following</div>
                      </div>
                      <div class="column stat-box">
                        <div class="stat-number">{formatNumber(profile.postsCount)}</div>
                        <div class="stat-label">Posts</div>
                      </div>
                    </div>
                  </div>
                  {profile.url && (
                    <footer class="card-footer">
                      <a
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="card-footer-item has-text-link"
                      >
                        View Profile →
                      </a>
                    </footer>
                  )}
                </div>
              </div>
            ))}
          </div>

          {result.profiles.length === 0 && (
            <div class="notification is-warning is-light">
              <p class="title is-5">No profiles found</p>
              <p>
                Could not find any fediverse profiles for{" "}
                <strong>{escapeHtml(result.query)}</strong>.
              </p>
              <p class="mt-2">
                Try a full handle like <code>@user@domain.com</code> or a known domain like{" "}
                <code>bsky.app</code>.
              </p>
            </div>
          )}

          {result.errors.length > 0 && (
            <div class="section" style="padding-top: 1rem;">
              <h4 class="title is-6 has-text-grey">Platforms that could not be reached</h4>
              {result.errors.map((err) => (
                <div class="notification is-danger is-light error-card mb-2" key={err.platform}>
                  <strong>{err.platform}:</strong> {escapeHtml(err.error)}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
