"use client";

import { useEffect } from "react";
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
import {
  TrLookQuad,
  TrLookTrio,
} from "@/components/tr/marketplace/TrLookMosaic";
import {
  CADDE_PAGE_TRANSITION_DONE_EVENT,
  isCaddePageTransitionBusy,
} from "@/lib/platform/caddeTransition";
import {
  caddeHashScrollBehavior,
  scrollToCaddeLookAnchor,
} from "@/lib/tr/looks/scrollToLook";
import type { TrLookWithProducts } from "@/types/tr-look";

function pickLookStrip(
  looks: TrLookWithProducts[],
  afterIndex: number,
  count: number,
): { look: TrLookWithProducts; index: number }[] {
  if (looks.length <= 1) return [];
  const entries: { look: TrLookWithProducts; index: number }[] = [];
  for (let step = 1; entries.length < count && step < looks.length; step++) {
    const index = (afterIndex + step) % looks.length;
    entries.push({ look: looks[index]!, index });
  }
  return entries;
}

function CaddeLookHashScroll() {
  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    if (!id) return;

    let cancelled = false;
    let retryTimer = 0;
    let tries = 0;

    const run = () => {
      if (cancelled) return true;
      if (scrollToCaddeLookAnchor(id, caddeHashScrollBehavior())) return true;
      if (tries++ > 20) return true;
      retryTimer = window.setTimeout(run, 50);
      return false;
    };

    const start = () => {
      if (cancelled) return;
      run();
    };

    if (isCaddePageTransitionBusy()) {
      window.addEventListener(CADDE_PAGE_TRANSITION_DONE_EVENT, start, {
        once: true,
      });
    } else {
      retryTimer = window.setTimeout(start, 40);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
      window.removeEventListener(CADDE_PAGE_TRANSITION_DONE_EVENT, start);
    };
  }, []);

  return null;
}

function TrLookPieceStackPlaceholder({ index }: { index: number }) {
  return (
    <article className="border-b border-black/10" aria-hidden={index > 0}>
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

interface TrLookLookbookProps {
  looks: TrLookWithProducts[];
}

export function TrLookLookbook({ looks }: TrLookLookbookProps) {
  if (looks.length === 0) {
    return (
      <div>
        {Array.from({ length: TR_HOME_PLACEHOLDER_LOOKS }, (_, index) => (
          <TrLookPieceStackPlaceholder key={index} index={index} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <CaddeLookHashScroll />
      {looks.map((look, index) => {
        const stripCount = index % 2 === 0 ? 3 : 4;
        const strip =
          index < looks.length - 1
            ? pickLookStrip(looks, index, stripCount)
            : [];

        return (
          <div key={look.id}>
            <TrLookPieceStack look={look} index={index} />
            {stripCount === 3 ? (
              <TrLookTrio entries={strip} />
            ) : (
              <TrLookQuad entries={strip} />
            )}
          </div>
        );
      })}
    </div>
  );
}
