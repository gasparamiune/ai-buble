# 🫧 AI BUBLE — cloud dashboard

A free, phone-accessible AI-bubble trigger monitor.
**GitHub Pages** hosts the dashboard; **GitHub Actions** refreshes it on a cron (your laptop can be off).

- `index.html` — the dashboard (fetches `data.json`)
- `data.json` — the data the dashboard renders (the cron updates it)
- `scripts/refresh.mjs` — pulls live prices (Yahoo Finance, keyless) + optional headlines (Tavily)
- `.github/workflows/ai-buble.yml` — cron that runs the refresh and commits `data.json`

---

## One-time setup (~5 minutes)

### 1. Create a **public** repo and push these files
Public = unlimited free Actions minutes + free Pages. From this folder:

```bash
git init
git add .
git commit -m "AI BUBLE dashboard"
gh repo create ai-buble --public --source=. --push    # needs the GitHub CLI, logged in
# …or create the repo on github.com and:
# git remote add origin https://github.com/<YOU>/ai-buble.git
# git branch -M main && git push -u origin main
```

### 2. Turn on GitHub Pages
Repo **Settings ▸ Pages ▸ Build and deployment ▸ Source: “Deploy from a branch” ▸ Branch: `main` / `(root)` ▸ Save.**
After ~1 minute your dashboard is live at:

```
https://<YOUR-USERNAME>.github.io/ai-buble/
```

Open that on your phone and bookmark it / “Add to Home Screen.”

### 3. Populate prices now
Repo **Actions ▸ “AI BUBLE refresh” ▸ Run workflow.** (The first time, GitHub may ask you to **enable workflows** — click it.) It fetches prices and commits `data.json`; the dashboard shows them on reload.

That's it. From now on it refreshes **weekdays after the US close** automatically.

---

## Optional: headlines (Tavily, free tier)
Add a repo secret **Settings ▸ Secrets and variables ▸ Actions ▸ New repository secret**, name `TAVILY_API_KEY`, value your `tvly-…` key. The refresh will then also store recent headlines in `data.json`. (Quarterly use stays inside Tavily's free 1,000-credit/month tier.)

## Optional: Smart tier (full Claude quarterly analysis in the cloud)
The free setup refreshes **prices** automatically; the deep **trigger re-scoring** is done by your local “AI BUBLE” scheduled task. To run that deep check in the cloud too, add an `ANTHROPIC_API_KEY` secret and a second Actions job that calls the Anthropic API with the AI BUBLE prompt and writes the result into `data.json`. Costs a few cents per quarterly run. (Ask Claude to scaffold this job.)

---

## Good to know
- **Cron is UTC and best-effort** — runs can be delayed by a few minutes; not for split-second timing.
- **GitHub pauses scheduled workflows after 60 days of repo inactivity.** If it goes quiet, open Actions and click **enable**, or push any commit to wake it.
- Prices are from **Yahoo Finance (delayed)** — fine for a monitor, not for trading.
- **Not financial advice.** Educational monitoring only.
