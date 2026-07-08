"use client";

import Link from "next/link";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { trPanelPath } from "@/lib/tr/paths";

interface TrOwnerComingSoonPageProps {
  title: string;
  /** Override default yakında copy (e.g. checkout-aware siparişler note). */
  description?: string;
}

export function TrOwnerComingSoonPage({
  title,
  description = "Bu bölüm yakında açılacak. Şimdilik Ürünler ve Ayarlar üzerinden devam edebilirsiniz.",
}: TrOwnerComingSoonPageProps) {
  return (
    <TrOwnerPanelGate>
      {() => (
        <div className="space-y-6">
          <Link
            href={trPanelPath()}
            className="inline-block text-[11px] tracking-[0.1em] text-neutral-500 uppercase"
          >
            ← Ana sayfa
          </Link>
          <h2 className="font-serif text-2xl tracking-tight text-neutral-950">
            {title}
          </h2>
          <div className="border border-black/10 bg-white px-5 py-8">
            <p className="text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
              Yakında
            </p>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-neutral-700">
              {description}
            </p>
          </div>
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
