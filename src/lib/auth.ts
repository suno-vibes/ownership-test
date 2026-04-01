import { headers } from "next/headers";
import { env } from "cloudflare:workers";

/**
 * Get the authenticated user's identity from Riff gateway headers.
 *
 * In production, X-Suno-User and X-Suno-User-Name are always set by the
 * gateway — requests without them can't reach the app. In local dev
 * (LOCAL_DEV=true in wrangler.toml), falls back to a test user so you
 * can develop without the gateway.
 */
export async function getAuthUser(): Promise<{
  email: string;
  displayName: string;
}> {
  const h = await headers();
  const email = h.get("x-suno-user");
  const displayName = h.get("x-suno-user-name");

  if (email) {
    return { email, displayName: displayName || email.split("@")[0] };
  }

  if (env.LOCAL_DEV) {
    return { email: "dev@local.test", displayName: "Local Dev" };
  }

  throw new Error("unauthorized");
}
