"use client";

import Link from "next/link";
import { ArchiveCommunitySignOff } from "@/components/ArchiveCommunitySignOff";
import { BrandLogo } from "@/components/BrandLogo";
import { FunnelEmailCapture } from "@/components/FunnelEmailCapture";

export function NotifyDeployGate() {
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
        <BrandLogo variant="onDark" className="mb-10 h-28 w-auto md:h-32" />

        <p className="font-mono text-[10px] tracking-[0.45em] text-neutral-400 uppercase">
          [ MEMBERS // DEPLOYING SOON ]
        </p>

        <h1 className="mt-8 font-serif text-[clamp(2.25rem,8vw,4rem)] leading-[0.95] font-light tracking-[0.18em] uppercase">
          Archive Access
          <br />
          En Route
        </h1>

        <p className="mt-5 max-w-md text-sm leading-relaxed text-neutral-400">
          Account creation is paused while we finalize the platform. Leave your
          email to receive priority notification when member access opens.
        </p>

        <FunnelEmailCapture
          source="member-notify"
          label="Enter your email for deploy notification"
          submitLabel="Notify Me"
          tone="dark"
          className="mt-10"
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
