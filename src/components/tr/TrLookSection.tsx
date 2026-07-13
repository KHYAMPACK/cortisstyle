"use client";

import { useState } from "react";
import { TrLookCard } from "@/components/tr/TrLookCard";
import { TrLookSheet } from "@/components/tr/TrLookSheet";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";
import { TR_LOOKS_SECTION_ID } from "@/lib/tr/looks";
import type { TrLookWithProducts } from "@/types/tr-look";

interface TrLookSectionProps {
  looks: TrLookWithProducts[];
}

export function TrLookSection({ looks }: TrLookSectionProps) {
  const [selected, setSelected] = useState<TrLookWithProducts | null>(null);

  return (
    <section
      id={TR_LOOKS_SECTION_ID}
      className="scroll-mt-20"
      aria-label="Kombinler"
    >
      <TrSectionHeader
        kicker="[ KOMBİNLER ]"
        title="Bu caddeye özel looklar"
        description="Her kombin gerçek butik stokundan. Parçaları aç, tek sepette topla."
      />

      {looks.length > 0 ? (
        <div className="grid grid-cols-1 gap-px border-b border-blueprint-border bg-blueprint-border md:grid-cols-2">
          {looks.map((look, index) => (
            <div key={look.id} className="bg-ice-floor">
              <TrLookCard look={look} index={index} onSelect={setSelected} />
            </div>
          ))}
        </div>
      ) : (
        <div className="border-b border-blueprint-border px-5 py-14 md:px-10">
          <p className="text-meta max-w-xl text-[12px] leading-relaxed tracking-[0.06em]">
            Kombinler hazırlanıyor. Şimdilik aşağıdaki yeni parçalara ve butik
            vitrinlerine göz atabilirsiniz.
          </p>
        </div>
      )}

      <TrLookSheet look={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
