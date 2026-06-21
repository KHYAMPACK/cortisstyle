"use client";

import { useState } from "react";
import { LookGrid } from "@/components/LookGrid";
import { LookModal } from "@/components/LookModal";
import { EnterDigitalWardrobeButton } from "@/components/EnterDigitalWardrobeButton";
import {
  HomeHero,
  LOOKBOOK_COLLECTION_ID,
} from "@/components/HomeHero";
import type { Look } from "@/types/look";

export default function Home() {
  const [selectedLook, setSelectedLook] = useState<Look | null>(null);

  return (
    <div className="min-h-full bg-ice-floor text-jet-black">
      <HomeHero />

      <section
        id={LOOKBOOK_COLLECTION_ID}
        className="scroll-mt-0 bg-ice-floor"
        aria-label="Lookbook collection"
      >
        <div className="border-b border-blueprint-border px-5 py-8 md:px-10 md:py-10">
          <p className="text-meta text-[9px] tracking-[0.5em] uppercase">
            [ RARE CURATION ]
          </p>
          <h2 className="mt-3 font-serif text-2xl leading-none tracking-[-0.02em] text-neutral-950 md:text-3xl">
            SS26 Lookbook
          </h2>
          <p className="text-meta mt-3 max-w-xl text-[11px] leading-relaxed tracking-[0.08em]">
            An editorial study in form, silhouette, and restraint. Curated
            looks for the new season.
          </p>
          <div className="mt-8 md:mt-10">
            <EnterDigitalWardrobeButton className="w-full sm:w-auto" />
          </div>
        </div>

        <LookGrid onSelectLook={setSelectedLook} />
      </section>

      <footer className="flex flex-col items-start justify-between gap-4 border-t border-blueprint-border px-5 py-8 text-meta text-[9px] tracking-[0.4em] uppercase md:flex-row md:items-center md:px-10">
        <span>Cortis Style © 2026</span>
        <span>Lookbook — All Rights Reserved</span>
      </footer>

      <LookModal look={selectedLook} onClose={() => setSelectedLook(null)} />
    </div>
  );
}
