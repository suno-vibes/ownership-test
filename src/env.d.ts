// Storage binding declarations.
// Uncomment bindings as you enable them in manifest.json.
// Without these, TypeScript won't recognize env.DB / env.KV / env.R2.
declare namespace Cloudflare {
  interface Env {
    /** Local development flag — set in wrangler.toml [vars], never reaches production */
    LOCAL_DEV?: string;
    // DB: D1Database;    // Enable: set "d1": true in manifest.json, then see src/db/
    // KV: KVNamespace;   // Enable: set "kv": true in manifest.json
    // R2: R2Bucket;      // Enable: set "r2": true in manifest.json
  }
}
