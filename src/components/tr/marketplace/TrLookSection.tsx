"use client";

import {
  TR_HOME_PLACEHOLDER_LOOKS,
  TrPlaceholderLookCard,
} from "@/components/tr/TrHomePlaceholders";
import { TrLookMosaic } from "@/components/tr/marketplace/TrLookMosaic";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import {
  TR_HOME_LOOK_TEASER_COUNT,
  TR_LOOKS_SECTION_ID,
} from "@/lib/tr/looks";
import { CADDE_CTA, caddeBracket } from "@/lib/tr/marketplace/caddeUi";
import { trKombinlerPath } from "@/lib/tr/paths";
import type { TrLookWithProducts } from "@/types/tr-look";

interface TrLookSectionProps {
  looks: TrLookWithProducts[];
  /** Kept for call-site compatibility; cart actions live on kombin page. */
  cartEnabled?: boolean;
}

export function TrLookSection({ looks }: TrLookSectionProps) {
  const teasers = looks.slice(0, TR_HOME_LOOK_TEASER_COUNT);
  const showPlaceholders = teasers.length === 0;

  return (
    <section
      id={TR_LOOKS_SECTION_ID}
      className="scroll-mt-20"
      aria-label="Kombinler"
    >
      <TrSectionHeader
        tone="cadde"
        index="01"
        kicker="Editoryal"
        title="Kombinler"
      />

      {showPlaceholders ? (
        <div
          className="grid grid-cols-2 gap-3 px-5 py-8 lg:grid-cols-3 lg:gap-5 lg:px-8 lg:py-12 xl:px-14"
          aria-hidden
        >
          {Array.from({ length: TR_HOME_PLACEHOLDER_LOOKS }, (_, index) => (
            <TrPlaceholderLookCard key={index} index={index} />
          ))}
        </div>
      ) : (
        <TrLookMosaic looks={teasers} />
      )}

      <div className="flex justify-center px-5 py-10 md:py-14">
        <TrSoftNavLink
          href={trKombinlerPath()}
          className={`${CADDE_CTA} text-jet-black transition-colors hover:text-cadde-red`}
        >
          {caddeBracket("Tüm kombinleri gör")}
        </TrSoftNavLink>
      </div>
    </section>
  );
}
