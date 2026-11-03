# Mahmoud Ahmed Mobarak — Portfolio

A single-page personal portfolio built as a **fully static site** (HTML, CSS and vanilla
JavaScript — no build step, no framework) with a **local-only admin panel** for editing content.

The design is a solid-colour "liquid glass" system: a deep navy #071a30 background with a
very quiet 64 px grid, frosted neutral surfaces with 1 px hairline borders, bright white
type, cool grey-blue copy and a single vivid blue accent, one consistent type scale, and
responsive layouts from 320 px phones up to wide desktops. Borders are kept
thin so cards hold more content without feeling boxed in. The content column is capped at
`min(94vw, 2000px)` with a fluid gutter, so the layout keeps a little air at every zoom level
instead of running into the screen edge.

### Palette

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#071a30` | Page and grid base |
| `--bg-elev` / panel | `#0f2b4a` | Raised panels, image wells |
| `--text` | `#f9fcff` | Headings and primary copy (17.0:1) |
| `--text-soft` | `#e2edfa` | Secondary copy (14.8:1) |
| `--muted` | `#c3d4e8` | Descriptions, metadata (11.6:1) |
| `--faint` | `#abc0d8` | Placeholders, notes (9.4:1) |
| `--accent` | `#79bdff` | Links, labels, buttons (8.8:1) |
| `--accent-strong` | `#a8d4ff` | Hover / highlight (11.3:1) |
| `--on-accent` | `#04182c` | Text on light blue or light buttons (9.0:1) |
| `--light-surface` | `#eef6ff` | Primary and active buttons |

Contrast ratios are measured against `--bg`; all text tokens meet WCAG AAA for normal text.

## Quick start

- **View the site:** open `index.html`, or run `python -m http.server 8787` and visit
  <http://localhost:8787>.
- **Edit content:** double-click the **Portfolio Admin** shortcut on the Desktop, or run
  `start-admin.bat`, then open <http://localhost:3000>. The panel's **Preview Portfolio**
  button opens the public site at <http://localhost:3000/portfolio>.

The admin server listens on `127.0.0.1` only, so it cannot be reached from the network or
from the live GitHub Pages site. `admin/`, `package.json` and the helper scripts are
git-ignored and untracked, so publishing never uploads the panel.

## Folder map

| Path | What it is |
| --- | --- |
| `index.html` | The whole website (single page) |
| `style.css` | The complete design system (no other stylesheet is required) |
| `script.js` | Typing effect, quotes, year filter, lightbox, mobile nav, contact form |
| `portfolio-data.json` | Content that the admin panel reads and writes |
| `admin/` | Local-only content manager (`server.js`, `admin.js`, `admin.css`, `sync_html.js`); ignored by Git |
| `Photos/` `Certificate/` `Report Cards/` | Images and PDFs used by the page |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is |
| `start-admin.bat` | One-click admin launcher (Windows) |

## How editing works

1. Change anything in the admin panel → **Save All Changes**.
2. The server writes `portfolio-data.json` and patches the matching sections of `index.html`
   (hero and intro stats, report cards, certificates, projects, skills, extracurriculars,
   leadership, leadership badges, "Other badges" and the extra "Let's connect" buttons).
3. Commit and push to publish.

The intro number strip is edited under **Profile & Hero → Intro Stats**: change any value or
label, remove a box, or add a new statistic. Extra buttons below "See my work on GitHub" and
"View my certificates" are managed under **Contact & email → Extra "Let's connect" buttons**.
Each button takes a label and a link (full URL, `mailto:` or `#section`).

Badge photos and other-badge photos are uploaded from **Leadership & badges** and stored in
`Photos/Leadership/`. Role cards (leadership) show one large badge each; **Other badges**
adds a centred strip of smaller photo + description cards below them.

The one-click **Push to GitHub** button in the panel runs `git add`, `commit` and `push` for you.

## Deploying

The site is already deploy-ready. Publish the repository root (where `index.html` lives) with
any static host:

- **GitHub Pages:** Settings → Pages → Deploy from branch → `main` / `root`.
  Keep `.nojekyll` in place so folders and filenames are served untouched.
- **Netlify / Cloudflare Pages / Vercel:** no build command, publish directory `.`

Notes:

- The `admin/` folder is a local tool. It is ignored by Git and is not needed for hosting.
- Testmail and SMTP credentials are **never** written into `portfolio-data.json`; the local
  server keeps them in the ignored `admin/local-secrets.json` and merges them at runtime.
- The contact form posts to `/api/contact`, which only exists in the local admin server.
  On static hosting the form degrades gracefully: it opens the visitor's mail app if
  `CONTACT_EMAIL` is set at the top of `script.js`, and otherwise shows a clear message.
  Set `CONTACT_EMAIL` to your real address before publishing if you want that fallback.
- Every image and PDF referenced by the page must stay in the repository (certificates,
  report-card scans, project screenshots, leadership badges). Do not add them to `.gitignore`.
