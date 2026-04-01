# Riff App — AI Assistant Guide

This is a Suno internal tool built on the Riff platform.

## Framework

- **Next.js** with App Router, compiled by **Vinext** (Vite plugin) and deployed to **Cloudflare Workers**
- **Tailwind CSS v4** for styling (configured via Vite plugin, no config file needed)
- **pnpm** as package manager
- Source code lives in `src/`

## Commands

```bash
pnpm dev        # Local development server
pnpm build      # Production build
pnpm typecheck  # TypeScript type checking (strict)
pnpm test       # Run tests (vitest)
```

## Database (Drizzle ORM)

When D1 is enabled, use Drizzle ORM for all database operations:

- **Schema**: Define tables in `src/db/schema.ts` using Drizzle's schema builder
- **Queries**: Use `getDb().select()`, `getDb().insert()`, etc. — never raw `env.DB.prepare()`
- **Migrations**: After schema changes, run `pnpm db:generate` to create a migration in `drizzle/`
- **Local dev**: Apply migrations with `pnpm dlx wrangler d1 execute <app-name>-local --local --file=drizzle/<migration>.sql`
- **Production**: The deploy service auto-applies migrations from `drizzle/` on every deploy

The `drizzle.config.ts` in the project root configures drizzle-kit to use `src/db/schema.ts`.

## Code Quality

- **Type everything.** No `any`. Define interfaces for data models, API request/response shapes, and component props. Type database query results.
- **Test as you build.** Use vitest. Test API routes, data transformations, and non-trivial logic. Run tests before deploying.

## Authentication

**Do NOT implement login.** Auth is handled by the Riff gateway. Every request includes:

| Header | Value |
|--------|-------|
| `X-Suno-User` | User's email (e.g. `alice@suno.com`) |
| `X-Suno-User-Name` | Display name (e.g. `Alice Smith`) |

These are set by the gateway and cannot be spoofed. Use `src/lib/auth.ts` to read them:

```tsx
import { getAuthUser } from "../lib/auth";

export default async function Page() {
  const { email, displayName } = await getAuthUser();
  // ...
}
```

**Always use `getAuthUser()`** — never read `x-suno-user` headers directly. The helper falls back to a test user in local dev (where gateway headers aren't present) and throws in production if headers are missing. Use it in both server components and API routes.

### Local Development Auth

In local dev, there's no Riff gateway to set auth headers. The `LOCAL_DEV` variable in `wrangler.toml` enables a fallback to `dev@local.test`. This variable never reaches production — the deploy service generates a fresh wrangler.toml at deploy time.

## Storage

Riff can provision databases, key-value stores, and file storage for your app — no infrastructure setup required.

### Enabling Storage

Enable in `manifest.json` — that's it:

```json
{
  "bindings": {
    "d1": true,
    "kv": false,
    "r2": false
  }
}
```

The deploy service automatically provisions the resource, looks up its ID, and injects the correct binding config into your build. No manual wrangler.toml editing needed.

**TypeScript:** When enabling a binding, also uncomment the corresponding line in `src/env.d.ts` so TypeScript recognizes the binding on `env`.

### Local Development Bindings

For local dev, uncomment the matching binding block in `wrangler.toml` (the commented-out sections at the bottom). For D1, generate and apply migrations locally:

```bash
pnpm db:generate
for f in drizzle/*.sql; do pnpm dlx wrangler d1 execute <app-name>-local --local --file="$f"; done
```

Local D1 data persists in `.wrangler/state/v3/d1/` between restarts.

| Storage | Binding name | Use case | Docs |
|---------|-------------|----------|------|
| **D1** | `env.DB` | SQLite database — tables, queries, relations | https://developers.cloudflare.com/d1/ |
| **KV** | `env.KV` | Key-value store — config, sessions, simple lookups | https://developers.cloudflare.com/kv/ |
| **R2** | `env.R2` | Object storage — files, images, large blobs | https://developers.cloudflare.com/r2/ |

### Accessing Bindings

Use `import { env } from "cloudflare:workers"` in any server component, route handler, or server action. This is a native module provided by Cloudflare's runtime — not an npm package.

```tsx
import { env } from "cloudflare:workers";
```

### D1 — Database (Drizzle ORM)

D1 is a SQLite database. This project uses **Drizzle ORM** for type-safe schema definitions and queries.

**Step 1: Define your schema** in `src/db/schema.ts` using Drizzle's schema builder:

```ts
// src/db/schema.ts
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});
```

**Step 2: Create a db helper** in `src/db/index.ts`:

```ts
// src/db/index.ts
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";

export function getDb() {
  return drizzle(env.DB);
}
```

**Step 3: Generate and apply migrations:**

```bash
pnpm db:generate                    # Creates migration SQL in drizzle/
# For local dev:
for f in drizzle/*.sql; do pnpm dlx wrangler d1 execute <app-name>-local --local --file="$f"; done
```

The deploy service auto-applies migrations from `drizzle/` on every deploy.

**Step 4: Use in your code:**

```tsx
// src/app/api/items/route.ts
import { getDb } from "../../db";
import { items } from "../../db/schema";
import { desc } from "drizzle-orm";
import { getAuthUser } from "../../lib/auth";

// List all items
export async function GET() {
  const results = await getDb().select().from(items).orderBy(desc(items.createdAt));
  return Response.json(results);
}

// Create a new item
export async function POST(request: Request) {
  const { email } = await getAuthUser();
  const { title } = (await request.json()) as { title: string };

  await getDb().insert(items).values({ title, createdBy: email });
  return Response.json({ ok: true });
}
```

> **Tip for AI assistants:** When the user wants to store data, suggest D1 with Drizzle ORM. Help them define tables in `src/db/schema.ts` using Drizzle's schema builder — it's type-safe TypeScript, not raw SQL. Always use `getDb()` for queries, never raw `env.DB.prepare()`.

### KV — Key-Value Store

KV is a simple get/put store. Good for config, feature flags, session data, or caching.

```tsx
// src/app/api/config/route.ts
import { env } from "cloudflare:workers";

export async function GET() {
  const value = await env.KV.get("site-title");
  return Response.json({ title: value ?? "My App" });
}

export async function PUT(request: Request) {
  const { key, value } = (await request.json()) as { key: string; value: string };
  await env.KV.put(key, value);
  return Response.json({ ok: true });
}
```

### R2 — File Storage

R2 stores files (images, PDFs, CSVs, etc). Good for uploads and large blobs.

```tsx
// src/app/api/files/route.ts
import { env } from "cloudflare:workers";

// Upload a file
export async function PUT(request: Request) {
  const url = new URL(request.url);
  const filename = url.searchParams.get("name") ?? "upload";
  await env.R2.put(filename, request.body);
  return Response.json({ ok: true, filename });
}

// Download a file
export async function GET(request: Request) {
  const url = new URL(request.url);
  const filename = url.searchParams.get("name");
  if (!filename) return Response.json({ error: "name required" }, { status: 400 });

  const object = await env.R2.get(filename);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: { "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream" },
  });
}
```

## Deployment

**Push to `main`** — the platform builds and deploys automatically. Your app is live at `{repo-name}.riff.suno.run`.

- **`wrangler.toml` `name` must match the repo name** — the gateway routes `<name>.riff.suno.run` to a Worker named `<name>`. If the name is wrong, you'll get a 502. The deploy service injects storage bindings before build
- No GitHub Actions — deployment is handled by the platform
- **Never commit API keys or secrets.** Set secrets via the Riff dashboard at [riff.suno.run](https://riff.suno.run)
- **Access secrets via `import { env } from "cloudflare:workers"` — NEVER `process.env`.** `process.env` silently returns `undefined` in Workers. The app won't error — it'll just use fallback/mock data and you'll wonder why your secret "isn't set." This is the #1 secrets mistake on Riff.
- **`[vars]` in wrangler.toml is local dev only.** The deploy service strips it before building — vars don't reach production. Use the Riff dashboard for all runtime config and secrets. Never put secret placeholders (e.g., `MY_KEY = ""`) in `[vars]` — they can shadow real CF secrets.
- **Declare secret types in `src/env.d.ts`** under `Cloudflare.Env` so TypeScript catches missing env access
- **Do NOT create `pnpm-workspace.yaml`** unless it includes a `packages` field — CI will fail with "packages field missing or empty." Put workspace config (e.g. `onlyBuiltDependencies`) in `package.json` under `"pnpm": {}` instead

## Design

The app ships with **Suno brand defaults** — dark background (#101012), warm accent palette, and Inter font. Design tokens are in `src/app/suno.css` as CSS custom properties.

| Token | Value | Use |
|-------|-------|-----|
| `--suno-gold` | #d4a020 | Primary accent, labels, code highlights |
| `--suno-orange` | #e06830 | Warm accent |
| `--suno-crimson` | #b82040 | Gradient midpoint |
| `--suno-magenta` | #c22076 | Gradient endpoint |
| `--suno-text-muted` | #c0b8af | Secondary text |
| `--suno-text-dim` | #7a7068 | Tertiary text |
| `--suno-border` | rgba(255,255,255,0.06) | Subtle borders |
| `--suno-gradient-aura` | gold→amber→crimson→magenta | Brand gradient |

**Brand font**: Suno uses **Neue Montreal**. The skeleton loads **Inter** as a widely available fallback. To use Neue Montreal, add the font files and update the font-family in layout.tsx.

**Background image**: `public/suno-aura.jpg` is the Suno aura texture. The welcome page uses it as a subtle backdrop. Feel free to use it, replace it, or remove it.

**These are all opt-in defaults.** Delete `suno.css`, change the body classes in `layout.tsx`, and you have a blank canvas.

## Access Controls

Access is managed through the Riff dashboard (riff.suno.run), not in code.

- **Open (default):** Any @suno.com user can access the app
- **Private:** Only the owner and people on the access list can access the app
- **Roles:** Owner (full control, including publish/unpublish), Editor (manage secrets, tags, access list, access mode, and restore deploys — but cannot publish/unpublish), Viewer (use the app)

Ownership is established automatically: the first person to deploy the app (push to main) becomes the owner, provided they've linked their GitHub account at riff.suno.run. If no GitHub link exists, ownership falls back to the `owner` field in `manifest.json`.

To restrict access, go to your app's detail page on the dashboard and use the Access section.

## Project Structure

```
src/
  env.d.ts          # TypeScript declarations for storage bindings (uncomment as needed)
  types.ts          # Shared type definitions (create as needed)
  app/
    layout.tsx      # Root layout (HTML shell, global styles)
    page.tsx        # Home page (reading user identity from headers)
    globals.css     # Tailwind imports + suno.css
    suno.css        # Suno brand design tokens (CSS custom properties)
manifest.json       # App metadata and storage bindings
drizzle.config.ts   # Drizzle Kit config (schema path, migration output dir)
drizzle/            # Generated migration SQL files (committed to repo)
vitest.config.ts    # Test configuration
public/
  suno-aura.jpg     # Suno aura background texture (optional)
vite.config.ts      # Vinext + Tailwind + Cloudflare plugin config — DO NOT MODIFY
wrangler.toml       # Worker config — name MUST match repo name, deploy service patches bindings
```
