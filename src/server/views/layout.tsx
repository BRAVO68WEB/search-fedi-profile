import type { Child } from "hono/jsx";

export function Layout({ children }: { children: Child }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>search-fedi-profile</title>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔍</text></svg>"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }

          :root {
            --ink: #fdfcfc;
            --ink-deep: #ffffff;
            --charcoal: #e0dede;
            --body: #b0acac;
            --mute: #7a7676;
            --stone: #5a5858;
            --ash: #403e3e;
            --canvas: #1a1818;
            --surface-soft: #222020;
            --surface-card: #2a2828;
            --surface-dark: #0f0e0e;
            --surface-dark-elevated: #1a1818;
            --hairline: rgba(255,255,255,0.08);
            --hairline-strong: #4a4848;
            --on-dark: #fdfcfc;
            --on-dark-mute: #7a7676;
            --accent: #58a6ff;
            --accent-hover: #79b8ff;
            --success: #3fb950;
            --danger: #f85149;
            --warning: #d29922;
            --radius: 4px;
          }

          [data-theme="light"] {
            --ink: #201d1d;
            --ink-deep: #0f0000;
            --charcoal: #302c2c;
            --body: #424245;
            --mute: #646262;
            --stone: #6e6e73;
            --ash: #9a9898;
            --canvas: #fdfcfc;
            --surface-soft: #f8f7f7;
            --surface-card: #f1eeee;
            --surface-dark: #201d1d;
            --surface-dark-elevated: #302c2c;
            --hairline: rgba(15,0,0,0.12);
            --hairline-strong: #646262;
            --on-dark: #fdfcfc;
            --on-dark-mute: #9a9898;
            --accent: #007aff;
            --accent-hover: #0056b3;
          }

          body {
            font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            background: var(--canvas);
            color: var(--ink);
            font-size: 15px;
            line-height: 1.6;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          .container { max-width: 860px; margin: 0 auto; padding: 0 20px; }

          .section { padding: 64px 0; }
          .section + .section { border-top: 1px solid var(--hairline); }

          h1 { font-size: 28px; font-weight: 700; line-height: 1.4; }
          h2 { font-size: 15px; font-weight: 700; line-height: 1.6; color: var(--ink); }
          p { color: var(--body); }
          code { background: var(--surface-card); padding: 2px 6px; border-radius: var(--radius); font-size: 13px; }
          a { color: var(--accent); text-decoration: none; }
          a:hover { text-decoration: underline; }

          /* Nav */
          .nav {
            background: var(--surface-dark);
            border-bottom: 1px solid var(--hairline);
            height: 48px;
            display: flex;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
          }
          .nav-inner {
            max-width: 860px;
            margin: 0 auto;
            padding: 0 20px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .nav-brand {
            font-weight: 700;
            font-size: 14px;
            color: var(--ink);
            text-decoration: none;
          }
          .nav-right {
            display: flex;
            gap: 16px;
            align-items: center;
          }
          .nav-link {
            color: var(--mute);
            font-size: 13px;
            text-decoration: none;
          }
          .nav-link:hover { color: var(--ink); }

          /* Theme Toggle */
          .theme-toggle {
            background: var(--surface-card);
            border: 1px solid var(--hairline);
            color: var(--mute);
            font-family: inherit;
            font-size: 12px;
            padding: 4px 10px;
            border-radius: var(--radius);
            cursor: pointer;
            line-height: 1;
          }
          .theme-toggle:hover { color: var(--ink); border-color: var(--hairline-strong); }

          /* Input + Button */
          .search-row { display: flex; gap: 8px; }
          .input {
            flex: 1;
            font-family: inherit;
            font-size: 14px;
            padding: 8px 12px;
            background: var(--surface-soft);
            border: 1px solid var(--hairline);
            border-radius: var(--radius);
            color: var(--ink);
            outline: none;
          }
          .input:focus { border-color: var(--accent); background: var(--canvas); }
          .input::placeholder { color: var(--ash); }
          .btn {
            display: inline-block;
            padding: 8px 20px;
            border-radius: var(--radius);
            font-family: inherit;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            border: none;
            white-space: nowrap;
          }
          .btn-primary { background: var(--accent); color: #fff; }
          .btn-primary:hover { background: var(--accent-hover); }
          .btn-ghost {
            background: transparent;
            color: var(--mute);
            border: 1px solid var(--hairline);
          }
          .btn-ghost:hover { color: var(--ink); border-color: var(--hairline-strong); }

          /* Hero */
          .hero-box {
            background: var(--surface-dark);
            border: 1px solid var(--hairline);
            border-radius: var(--radius);
            padding: 32px 24px;
            text-align: center;
            overflow-x: auto;
          }
          .hero-ascii {
            font-size: 11px;
            line-height: 1.15;
            color: var(--accent);
            white-space: pre;
            display: inline-block;
            text-align: left;
          }
          .hero-prompt {
            background: var(--surface-card);
            color: var(--body);
            padding: 6px 14px;
            border-radius: var(--radius);
            font-size: 13px;
            display: inline-block;
            margin-top: 20px;
          }
          .hero-prompt .prompt-symbol { color: var(--success); }
          .hero-prompt .prompt-cmd { color: var(--ink); }

          /* List Rows */
          .list-row { padding: 6px 0; color: var(--body); font-size: 14px; }
          .list-row .marker { color: var(--accent); font-weight: 700; }

          /* Cards */
          .card {
            background: var(--surface-soft);
            border: 1px solid var(--hairline);
            border-radius: var(--radius);
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
          .card + .card { margin-top: 10px; }

          .grid-3 .card + .card { margin-top: 0; }

          /* Grid */
          .grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }

          @media (max-width: 768px) {
            .grid-3 {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 480px) {
            .grid-3 {
              grid-template-columns: 1fr;
            }
          }

          /* Platform Badge */
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: var(--radius);
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .badge-mastodon { background: #6364FF20; color: #8b8bff; border: 1px solid #6364FF40; }
          .badge-bluesky  { background: #0085FF20; color: #58a6ff; border: 1px solid #0085FF40; }
          .badge-nostr    { background: #F7931A20; color: #f7931a; border: 1px solid #F7931A40; }
          .badge-threads  { background: #ffffff10; color: var(--body); border: 1px solid var(--hairline); }
          .badge-misskey  { background: #86B30020; color: #86b300; border: 1px solid #86B30040; }
          .badge-pleroma  { background: #6B4C7A20; color: #a78bba; border: 1px solid #6B4C7A40; }
          .badge-partial  { background: var(--warning); color: var(--surface-dark); cursor: help; margin-left: 6px; }

          /* Profile Card */
          .profile-card {
            background: var(--surface-soft);
            border: 1px solid var(--hairline);
            border-radius: var(--radius);
            padding: 20px;
          }
          .profile-card + .profile-card { margin-top: 12px; }
          .profile-header { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 12px; }
          .profile-avatar {
            width: 44px; height: 44px;
            border-radius: var(--radius);
            background: var(--surface-card);
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 16px; color: var(--ink);
            flex-shrink: 0; overflow: hidden;
          }
          .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
          .profile-name { font-weight: 700; font-size: 15px; }
          .profile-handle { color: var(--mute); font-size: 13px; margin-top: 2px; }
          .profile-bio { color: var(--body); font-size: 13px; margin: 10px 0; line-height: 1.5; white-space: pre-wrap; }
          .profile-stats {
            display: flex; gap: 24px; margin: 12px 0; padding: 10px 0;
            border-top: 1px solid var(--hairline); border-bottom: 1px solid var(--hairline);
          }
          .stat-value { font-weight: 700; font-size: 15px; color: var(--ink); }
          .stat-label { font-size: 11px; color: var(--mute); text-transform: uppercase; letter-spacing: 0.5px; }
          .profile-link { display: inline-block; margin-top: 10px; font-size: 13px; }

          /* Section Label */
          .section-label { margin-bottom: 16px; }
          .section-label .marker { color: var(--accent); }

          /* Error */
          .error-card {
            border-left: 2px solid var(--danger);
            padding: 8px 12px;
            margin: 6px 0;
            font-size: 13px;
          }
          .error-card strong { color: var(--danger); }

          /* Notification */
          .notification {
            background: var(--surface-soft);
            border: 1px solid var(--hairline);
            border-radius: var(--radius);
            padding: 16px;
            font-size: 14px;
          }

          /* Footer */
          .footer {
            border-top: 1px solid var(--hairline);
            padding: 24px 0;
            color: var(--mute);
            font-size: 12px;
            margin-top: auto;
          }
          .footer-inner {
            max-width: 860px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: center;
          }
          .footer a { color: var(--mute); }
          .footer a:hover { color: var(--ink); }

          /* Debug Modal */
          .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 200;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .modal-content {
            background: var(--surface-soft);
            border: 1px solid var(--hairline);
            border-radius: var(--radius);
            max-width: 800px;
            width: 100%;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid var(--hairline);
            flex-shrink: 0;
          }

          .modal-header span {
            font-weight: 700;
            font-size: 15px;
          }

          .modal-close {
            background: none;
            border: none;
            color: var(--mute);
            font-size: 20px;
            cursor: pointer;
            padding: 4px 8px;
            line-height: 1;
          }

          .modal-close:hover {
            color: var(--ink);
          }

          .modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
          }

          .modal-body h3 {
            font-size: 13px;
            font-weight: 700;
            color: var(--accent);
            margin: 16px 0 8px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .modal-body h3:first-child {
            margin-top: 0;
          }

          .modal-body pre {
            background: var(--surface-dark);
            color: var(--on-dark);
            padding: 12px 16px;
            border-radius: var(--radius);
            font-size: 12px;
            line-height: 1.5;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .btn-debug {
            background: transparent;
            color: var(--warning);
            border: 1px solid var(--warning);
            padding: 4px 12px;
            font-size: 12px;
            cursor: pointer;
            border-radius: var(--radius);
            font-family: inherit;
          }

          .btn-debug:hover {
            background: var(--warning);
            color: var(--surface-dark);
          }

          @media (max-width: 640px) {
            h1 { font-size: 22px; }
            .section { padding: 40px 0; }
            .hero-ascii { font-size: 8px; }
            .search-row { flex-direction: column; }
            .profile-stats { flex-wrap: wrap; gap: 16px; }
            .nav-link { display: none; }
            .modal-content { max-height: 90vh; }
          }
        `}</style>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function() {
            var t = localStorage.getItem('theme') || 'dark';
            if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
          })();
          function toggleDebug(id) {
            var el = document.getElementById(id);
            if (el.style.display === 'flex') {
              el.style.display = 'none';
            } else {
              el.style.display = 'flex';
            }
          }
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
              var modals = document.querySelectorAll('.modal-overlay');
              modals.forEach(function(m) { m.style.display = 'none'; });
            }
          });
        `,
          }}
        />
      </head>
      <body>
        <nav class="nav">
          <div class="nav-inner">
            <a href="/" class="nav-brand">
              search-fedi-profile
            </a>
            <div class="nav-right">
              <a href="/" class="nav-link">
                Home
              </a>
              <a href="https://github.com/BRAVO68WEB/search-fedi-profile" class="nav-link">
                GitHub
              </a>
              <button
                class="theme-toggle"
                onclick="(function(){var d=document.documentElement,t=d.getAttribute('data-theme'),n=t==='light'?'':'light';if(n)d.setAttribute('data-theme',n);else d.removeAttribute('data-theme');localStorage.setItem('theme',n||'dark');this.textContent=n==='light'?'☾ dark':'☀ light'})()"
              >
                ☀ light
              </button>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer class="footer">
          <div class="footer-inner">
            <span>
              Made with ♥ by <a href="https://github.com/BRAVO68WEB">@bravo68web</a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
