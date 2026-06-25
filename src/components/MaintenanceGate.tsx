export function MaintenanceGate() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#0D0D0D] px-6 py-24 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        <p className="font-mono text-[10px] tracking-[0.45em] text-neutral-400 uppercase">
          [ STATUS // SITE MAINTENANCE ]
        </p>

        <h1 className="mt-8 font-serif text-[clamp(2.5rem,9vw,4.5rem)] leading-[0.95] font-light tracking-[0.16em] uppercase">
          Under
          <br />
          Maintenance
        </h1>

        <p className="mt-6 max-w-md text-sm leading-relaxed text-neutral-400">
          Cortisstyle is temporarily offline while we prepare the next archive
          release. We will be open again soon.
        </p>
      </div>
    </section>
  );
}
