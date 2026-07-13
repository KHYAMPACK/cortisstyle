"use client";

import { useState } from "react";
import {
  TR_HOME_PLACEHOLDER_LOOKS,
  TR_HOME_PLACEHOLDER_PIECES_PER_LOOK,
  TrPlaceholderLookCard,
  TrPlaceholderProductCard,
} from "@/components/tr/TrHomePlaceholders";
import {
  TR_LOOK_COVER_FRAME,
  TR_LOOK_COVER_PAD,
  TR_LOOK_PIECE_ROW,
  TR_LOOK_PIECE_TILE,
  TrLookPieceStack,
} from "@/components/tr/TrLookPieceStack";
import { TrLookSheet } from "@/components/tr/TrLookSheet";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";
import { TR_LOOKS_SECTION_ID } from "@/lib/tr/looks";
import type { TrLookWithProducts } from "@/types/tr-look";

interface TrLookSectionProps {
  looks: TrLookWithProducts[];
  cartEnabled?: boolean;
}

function TrLookPieceStackPlaceholder({ index }: { index: number }) {
  return (
    <article className="border-b border-blueprint-border" aria-hidden={index > 0}>
      <div className={TR_LOOK_COVER_PAD}>
        <div className={TR_LOOK_COVER_FRAME}>
          <TrPlaceholderLookCard index={index} />
        </div>
      </div>
      <div className={TR_LOOK_PIECE_ROW}>
        {Array.from(
          { length: TR_HOME_PLACEHOLDER_PIECES_PER_LOOK },
          (_, pieceIndex) => (
            <div key={pieceIndex} className={TR_LOOK_PIECE_TILE}>
              <TrPlaceholderProductCard index={pieceIndex} />
            </div>
          ),
        )}
      </div>
    </article>
  );
}

export function TrLookSection({
  looks,
  cartEnabled = false,
}: TrLookSectionProps) {
  const [selected, setSelected] = useState<TrLookWithProducts | null>(null);
  const showPlaceholders = looks.length === 0;

  return (
    <section
      id={TR_LOOKS_SECTION_ID}
      className="scroll-mt-20"
      aria-label="Kombinler"
    >
      <TrSectionHeader kicker="[ KOMBİNLER ]" />

      {showPlaceholders
        ? Array.from({ length: TR_HOME_PLACEHOLDER_LOOKS }, (_, index) => (
            <TrLookPieceStackPlaceholder key={index} index={index} />
          ))
        : looks.map((look, index) => (
            <TrLookPieceStack
              key={look.id}
              look={look}
              index={index}
              onSelect={setSelected}
              cartEnabled={cartEnabled}
            />
          ))}

      {!showPlaceholders ? (
        <TrLookSheet
          look={selected}
          onClose={() => setSelected(null)}
          cartEnabled={cartEnabled}
        />
      ) : null}
    </section>
  );
}
