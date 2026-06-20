"use client";

import { useState } from "react";
import { LookGrid } from "@/components/LookGrid";
import { LookModal } from "@/components/LookModal";
import { HomeHero } from "@/components/HomeHero";
import type { Look } from "@/types/look";

export default function Home() {
  const [selectedLook, setSelectedLook] = useState<Look | null>(null);

  return (
    <div className="min-h-full bg-white text-neutral-900">
      <HomeHero />
      <LookGrid onSelectLook={setSelectedLook} />

      <footer className="flex flex-col items-start justify-between gap-4 border-t border-neutral-200 px-5 py-8 text-[9px] tracking-[0.4em] text-neutral-400 uppercase md:flex-row md:items-center md:px-10">
        <span>Cortis Style © 2026</span>
        <span>Lookbook — All Rights Reserved</span>
      </footer>

      <LookModal look={selectedLook} onClose={() => setSelectedLook(null)} />
    </div>
  );
}
