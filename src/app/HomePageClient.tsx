"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LookGrid } from "@/components/LookGrid";
import { LookModal } from "@/components/LookModal";
import { EnterDigitalWardrobeButton } from "@/components/EnterDigitalWardrobeButton";
import {
  HomeHero,
  LOOKBOOK_COLLECTION_ID,
} from "@/components/HomeHero";
import { ArchiveCommunitySignOff } from "@/components/ArchiveCommunitySignOff";
import { SiteFooter } from "@/components/SiteFooter";
import { PremiumArchivePaywallModal } from "@/components/PremiumArchivePaywallModal";
import type { Look } from "@/types/look";

interface HomePageClientProps {
  looks: Look[];
}

function HomePageContent({ looks }: HomePageClientProps) {
  const searchParams = useSearchParams();
  const [selectedLook, setSelectedLook] = useState<Look | null>(null);
  const [paywallLook, setPaywallLook] = useState<Look | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  useEffect(() => {
    const lookId = searchParams.get("look")?.trim();
    if (!lookId) return;

    const look = looks.find((entry) => entry.id === lookId);
    if (look) {
      setSelectedLook(look);
    }
  }, [looks, searchParams]);

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

        <LookGrid
          looks={looks}
          onSelectLook={setSelectedLook}
          onLockedLookClick={(look) => {
            setPaywallLook(look);
            setIsPaywallOpen(true);
          }}
        />
      </section>

      <footer>
        <ArchiveCommunitySignOff tone="light" className="border-t border-blueprint-border px-5 pt-10 pb-10 md:px-10" />
        <SiteFooter />
      </footer>

      <LookModal look={selectedLook} onClose={() => setSelectedLook(null)} />

      <PremiumArchivePaywallModal
        isOpen={isPaywallOpen}
        look={paywallLook}
        onClose={() => {
          setIsPaywallOpen(false);
          setPaywallLook(null);
        }}
      />
    </div>
  );
}

export function HomePageClient({ looks }: HomePageClientProps) {
  return (
    <Suspense fallback={<div className="min-h-full bg-ice-floor" />}>
      <HomePageContent looks={looks} />
    </Suspense>
  );
}
