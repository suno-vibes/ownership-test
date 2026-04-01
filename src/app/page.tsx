import { getAuthUser } from "../lib/auth";

export default async function HomePage() {
  const { email: userEmail } = await getAuthUser();

  return (
    <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      {/* Vinyl texture */}
      <svg
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02]"
        width="900"
        height="900"
        viewBox="0 0 900 900"
      >
        {[80, 120, 160, 200, 240, 280, 320, 360, 400, 440].map((r) => (
          <circle key={r} cx="450" cy="450" r={r} fill="none" stroke="white" strokeWidth="0.5" />
        ))}
      </svg>

      {/* Horizon aura */}
      <div
        className="pointer-events-none absolute -z-10"
        style={{
          bottom: "-25%",
          left: "5%",
          right: "5%",
          height: "55%",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(212,160,32,0.07) 0%, rgba(224,104,48,0.04) 30%, rgba(194,32,118,0.03) 50%, transparent 70%)",
        }}
      />

      {/* Content */}
      <p className="text-[13px] text-[--suno-text-dim] tracking-wide">
        {userEmail}
      </p>
      <h1 className="mt-2 text-[32px] font-semibold tracking-tight text-white">
        Your app is ready.
      </h1>
      <p className="mt-2.5 text-[15px] text-[--suno-text-dim]">
        Start building in{" "}
        <code className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[13px] text-[--suno-text-muted]">
          src/app/page.tsx
        </code>
      </p>

      {/* Info panel */}
      <div className="mt-8 w-full max-w-[400px] overflow-hidden rounded-xl border border-white/[0.05]">
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-white/[0.04]">
          <div className="border-b border-white/[0.04] px-4 py-3.5 sm:border-b-0 sm:border-r">
            <p className="mb-1 text-[11px] font-medium text-[--suno-gold]">Stack</p>
            <p className="text-[12px] text-[--suno-text-dim]">Next.js · Tailwind · Workers</p>
          </div>
          <div className="px-4 py-3.5">
            <p className="mb-1 text-[11px] font-medium text-[--suno-gold]">Deploy</p>
            <p className="text-[12px] text-[--suno-text-dim]">Push to main → live</p>
          </div>
        </div>
        <div className="px-4 py-3.5">
          <p className="mb-1 text-[11px] font-medium text-[--suno-gold]">Storage</p>
          <p className="text-[12px] text-[--suno-text-dim]">
            D1 · KV · R2 — toggle in manifest.json
          </p>
        </div>
      </div>

      {/* Horizon line */}
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: "60px",
          left: "10%",
          right: "10%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(212,160,32,0.2), rgba(224,104,48,0.14), rgba(194,32,118,0.2), transparent)",
        }}
      />
    </main>
  );
}
