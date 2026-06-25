import type { SearchResult } from "../../core/types.js";
import { Layout } from "./layout.js";

function formatNumber(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stringifyJson(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function profileWithoutDebug(profile: Record<string, unknown>): Record<string, unknown> {
  const { nodeInfo, webFinger, ...rest } = profile;
  return rest;
}

export function Result({ result }: { result: SearchResult }) {
  return (
    <Layout>
      <section class="section">
        <div class="container">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
            <h2 class="section-label" style="margin-bottom:0">
              Results for <code>{escapeHtml(result.query)}</code>
            </h2>
            <a class="btn btn-ghost" href="/">
              ← New Search
            </a>
          </div>

          {result.profiles.length > 0 && (
            <div class="list-row" style="margin-bottom:24px">
              <span class="marker">[+]</span> {result.profiles.length} profile
              {result.profiles.length !== 1 ? "s" : ""} found
            </div>
          )}

          {result.profiles.map((profile, index) => (
            <div class="profile-card" key={profile.platform + profile.handle}>
              <div class="profile-header">
                <div class="profile-avatar">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.displayName ?? profile.handle} />
                  ) : (
                    (profile.displayName ?? profile.handle ?? "?")[0].toUpperCase()
                  )}
                </div>
                <div>
                  <div class="profile-name">{profile.displayName ?? profile.handle}</div>
                  <div class="profile-handle">
                    {escapeHtml(profile.handle)}
                    {" · "}
                    <span class={`badge badge-${profile.platform}`}>{profile.platform}</span>
                    {profile.isPartial && (
                      <span
                        class="badge badge-partial"
                        title={(profile.extra?.note as string) ?? "Partial profile data"}
                      >
                        Partial
                      </span>
                    )}
                  </div>
                  {profile.software && (
                    <div style="margin-top:4px;font-size:12px;color:var(--mute)">
                      {profile.software}
                      {profile.softwareVersion && ` v${profile.softwareVersion}`}
                    </div>
                  )}
                </div>
              </div>

              {profile.bio && <div class="profile-bio">{escapeHtml(profile.bio)}</div>}

              {(profile.followersCount !== undefined ||
                profile.followingCount !== undefined ||
                profile.postsCount !== undefined) && (
                <div class="profile-stats">
                  {profile.followersCount !== undefined && (
                    <div>
                      <div class="stat-value">{formatNumber(profile.followersCount)}</div>
                      <div class="stat-label">Followers</div>
                    </div>
                  )}
                  {profile.followingCount !== undefined && (
                    <div>
                      <div class="stat-value">{formatNumber(profile.followingCount)}</div>
                      <div class="stat-label">Following</div>
                    </div>
                  )}
                  {profile.postsCount !== undefined && (
                    <div>
                      <div class="stat-value">{formatNumber(profile.postsCount)}</div>
                      <div class="stat-label">Posts</div>
                    </div>
                  )}
                </div>
              )}

              <div style="display:flex;gap:12px;align-items:center;margin-top:12px">
                {profile.url && (
                  <a
                    href={profile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="profile-link"
                  >
                    View Profile →
                  </a>
                )}
                <button class="btn-debug" onclick={`toggleDebug('debug-${index}')`}>
                  [Debug]
                </button>
              </div>

              <div
                id={`debug-${index}`}
                class="modal-overlay"
                onclick={`if(event.target===this)toggleDebug('debug-${index}')`}
              >
                <div class="modal-content">
                  <div class="modal-header">
                    <span>Debug: {escapeHtml(profile.handle)}</span>
                    <button class="modal-close" onclick={`toggleDebug('debug-${index}')`}>
                      ×
                    </button>
                  </div>
                  <div class="modal-body">
                    <h3>Search Query</h3>
                    <pre>{escapeHtml(result.query)}</pre>

                    <h3>Platform</h3>
                    <pre>
                      {profile.platform}
                      {profile.software
                        ? ` (${profile.software}${profile.softwareVersion ? ` v${profile.softwareVersion}` : ""})`
                        : ""}
                    </pre>

                    <h3>Raw Profile JSON</h3>
                    <pre>
                      {stringifyJson(
                        profileWithoutDebug(profile as unknown as Record<string, unknown>),
                      )}
                    </pre>

                    <h3>WebFinger Response</h3>
                    <pre>
                      {profile.webFinger
                        ? stringifyJson(profile.webFinger)
                        : "Not available — this platform does not use WebFinger"}
                    </pre>

                    <h3>NodeInfo Data</h3>
                    <pre>
                      {profile.nodeInfo
                        ? stringifyJson(profile.nodeInfo)
                        : "Not available — this platform does not expose NodeInfo"}
                    </pre>

                    {profile.extra && (
                      <>
                        <h3>Extra Data</h3>
                        <pre>{stringifyJson(profile.extra)}</pre>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {result.profiles.length === 0 && (
            <div class="notification">
              <div style="margin-bottom:8px">
                <span class="marker" style="color:var(--danger)">
                  [-]
                </span>{" "}
                <strong>No profiles found</strong>
              </div>
              <p style="font-size:13px">
                Could not find any fediverse profiles for{" "}
                <strong>{escapeHtml(result.query)}</strong>.
              </p>
              <p style="font-size:13px;margin-top:8px">
                Try a full handle like <code>@user@domain.com</code> or a known domain like{" "}
                <code>bsky.app</code>.
              </p>
            </div>
          )}

          {result.errors.length > 0 && (
            <div style="margin-top:32px">
              <h2 class="section-label">
                <span class="marker" style="color:var(--warning)">
                  [!]
                </span>{" "}
                Platforms that could not be reached
              </h2>
              {result.errors.map((err) => (
                <div class="error-card" key={err.platform}>
                  <strong>{err.platform}:</strong>{" "}
                  <span style="color:var(--mute);font-size:13px">{escapeHtml(err.error)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
