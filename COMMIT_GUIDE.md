# How to commit & publish this portfolio

Everything below also lives inside the admin panel's **Tutorial & Git Guide** tab.

---

## 0. One-time setup (per computer)

1. Install [Git](https://git-scm.com/downloads) (default options are fine).
2. Create a repository on GitHub, e.g. `username/portfolio` — **do not** add a README there.
3. Tell Git who you are (once, in any terminal):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

4. Connect this folder to your repo:

```bash
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

---

## 1. Everyday commit (after editing the site)

Open a terminal in this folder and run:

```bash
git add .
git commit -m "Update portfolio content"
git push
```

That's it — GitHub Pages redeploys automatically in a minute or two.

**Shortcut:** the admin panel's **Push to GitHub** button runs exactly those three commands
for you. Use it for quick content edits; use the terminal when you want custom commit
messages.

---

## 2. Useful commands when things change

| Situation | Command |
| --- | --- |
| See what changed before committing | `git status` then `git diff` |
| Commit only one file | `git add path/to/file` then commit/push |
| Undo an uncommitted edit to one file | `git restore path/to/file` |
| Go back to the last commit entirely | `git restore .` (careful — discards edits) |
| See the change history | `git log --oneline` |

---

## 3. Turn on GitHub Pages (first time only)

1. GitHub repo → **Settings** → **Pages** (left sidebar).
2. **Source:** *Deploy from a branch*.
3. **Branch:** `main`, folder **`/ (root)`** → **Save**.
4. Wait ~1 minute. Your site is live at `https://USERNAME.github.io/REPO/`.

Every push now updates the live site automatically.

---

## 4. What gets committed

- Everything except `.gitignore` exclusions (OS junk, logs, `node_modules`).
- `admin/`, `portfolio-data.json` and `start-admin.bat` **are** committed — they're part
  of the repo, they just never run on the live static site.
- If a file upload in the admin panel "fails to show on the site" after pushing, hard
  refresh with **Ctrl+Shift+R** before debugging.
