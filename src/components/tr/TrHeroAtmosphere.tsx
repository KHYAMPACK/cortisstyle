"use client";

/**
 * Blueprint grid + fine grain behind the /tr hero outfit.
 * Ground matches brand ice-floor / blueprint language.
 */
export function TrHeroAtmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden select-none"
    >
      <div
        className="absolute inset-0 opacity-[0.28] md:opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(208, 224, 245, 0.9) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(208, 224, 245, 0.9) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute inset-0 hidden opacity-[0.22] md:block"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(208, 224, 245, 0.55) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(208, 224, 245, 0.55) 1px, transparent 1px)
          `,
          backgroundSize: "8px 8px",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-multiply md:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(244,246,248,0.55)_0%,rgba(244,246,248,0.18)_38%,transparent_65%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ice-floor via-ice-floor/90 to-transparent" />
    </div>
  );
}
