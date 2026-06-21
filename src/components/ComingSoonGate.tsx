"use client";

import Link from "next/link";
import { FunnelEmailCapture } from "@/components/FunnelEmailCapture";
import { SocialLinksRow } from "@/components/SocialLinksRow";

export function ComingSoonGate() {
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
          [ STATUS // UNDER DEVELOPMENT FOR SS26 ]
        </p>

        <h1 className="mt-8 font-serif text-[clamp(2.75rem,10vw,5.5rem)] leading-[0.92] font-light tracking-[0.22em] uppercase">
          Wardrobe
          <br />
          Studio
        </h1>

        <FunnelEmailCapture
          source="wardrobe-coming-soon"
          label="Sign up to get notified when we deploy"
          submitLabel="Notify Me"
          tone="dark"
          className="mt-14 flex w-full flex-col items-center"
        />

        <Link
          href="/"
          className="mt-10 font-mono text-[10px] tracking-[0.35em] text-neutral-500 uppercase transition-colors hover:text-white"
        >
          ← Return to Lookbook
        </Link>

        <SocialLinksRow tone="dark" align="center" className="mt-8" />
      </div>
    </section>
  );
}
