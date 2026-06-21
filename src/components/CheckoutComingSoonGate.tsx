"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { looks } from "@/data/looks";
import { ArchiveCommunitySignOff } from "@/components/ArchiveCommunitySignOff";
import { FunnelEmailCapture } from "@/components/FunnelEmailCapture";

export function CheckoutComingSoonGate() {
  const searchParams = useSearchParams();
  const lookId = searchParams.get("look")?.trim() ?? "";
  const look = looks.find((entry) => entry.id === lookId);

  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#0D0D0D] px-6 py-24 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        <div className="mb-10 w-full space-y-3 border border-neutral-800 bg-neutral-950/60 p-5 text-left">
          <div className="h-3 w-24 bg-neutral-800" aria-hidden />
          <div className="h-2 w-full bg-neutral-900" aria-hidden />
          <div className="h-2 w-5/6 bg-neutral-900" aria-hidden />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="h-16 border border-neutral-800 bg-neutral-900/40" aria-hidden />
            <div className="h-16 border border-neutral-800 bg-neutral-900/40" aria-hidden />
          </div>
          <div className="h-10 w-full border border-neutral-700 bg-neutral-900/20" aria-hidden />
        </div>

        <p className="w-full font-mono text-[10px] tracking-[0.45em] text-neutral-500 uppercase">
          Secure Checkout Preview
        </p>

        <h1 className="mt-4 w-full font-serif text-[clamp(2rem,7vw,3.25rem)] leading-none tracking-[0.18em] uppercase">
          Collection En Route
        </h1>

        <p className="mt-5 w-full max-w-md text-sm leading-relaxed text-neutral-400">
          This exclusive curation package is currently being finalized. Secure
          your priority sequence number below to gain earliest access to purchase
          links.
        </p>

        {look ? (
          <p className="text-meta mt-4 w-full text-[10px] tracking-[0.25em] text-neutral-500 uppercase">
            Intent registered for: {look.title}
          </p>
        ) : null}

        <FunnelEmailCapture
          source="checkout-priority"
          lookId={lookId || undefined}
          label="Priority purchase access — enter email"
          submitLabel="Secure Sequence"
          tone="dark"
          className="mt-6"
        />

        <Link
          href="/"
          className="mt-10 font-mono text-[10px] tracking-[0.35em] text-neutral-500 uppercase transition-colors hover:text-white"
        >
          ← Return to Lookbook
        </Link>

        <ArchiveCommunitySignOff tone="dark" className="mt-0 pb-8" />
      </div>
    </section>
  );
}
