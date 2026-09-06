# Mahmoud's Portfolio — static site + local admin panel

A fully static personal portfolio (HTML/CSS/JS only — no server needed to host it) with a
local-only admin panel for editing every section of the site.

## Quick start

- **View the site:** open `index.html` in a browser. That's it — the site is 100% static.
- **Edit content:** run `start-admin.bat` (Windows) or `node admin/server.js`, then open
  <http://localhost:3000>. The built-in **Tutorial & Git Guide** tab inside the panel
  explains every tab, and how to commit & push.

## Folder map

| Path | What it is |
| --- | --- |
| `index.html` | The whole website (single page) |
| `style.css` / `stars.css` | All styling |
| `script.js` | All site behavior (lightbox, tabs, wallet, form) |
| `portfolio-data.json` | Content database the admin panel edits |
| `admin/` | Local-only admin panel (not needed for hosting) |
| `Photos/` `Certificate/` `Report Cards/` | Images and PDFs |
| `start-admin.bat` | One-click admin launcher (Windows) |
| `COMMIT_GUIDE.md` | Step-by-step git commit & GitHub Pages guide |

## How editing works

1. Edit anything in the admin panel → **Save All Changes**
2. The panel writes `portfolio-data.json` and regenerates `index.html` from it
3. Commit & push to publish (see `COMMIT_GUIDE.md` or the panel's Tutorial tab)
