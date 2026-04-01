# Riff App Skeleton

Template for building internal tools on Suno's Riff platform.

## Quick Start

1. Go to [github.com/suno-vibes/skeleton](https://github.com/suno-vibes/skeleton) and click **"Use this template"**
2. Name your repo — this becomes your URL (e.g. `marketing-dashboard` → `marketing-dashboard.riff.suno.run`)
3. Clone your new repo and open it in Cursor or Claude Code
4. Describe what you want to build — the `CLAUDE.md` file gives the AI all the context it needs
5. Run locally:
   ```bash
   pnpm install
   pnpm dev
   ```
6. Push to `main` — your app is live at `{repo-name}.riff.suno.run`

## What's included

- **Next.js** with App Router, deployed via Vinext to Cloudflare Workers
- **Tailwind CSS v4** for styling
- **Auth handled for you** — user identity available via request headers
- **Storage ready** — toggle D1, KV, or R2 in `manifest.json`

See `CLAUDE.md` for the full developer guide.
