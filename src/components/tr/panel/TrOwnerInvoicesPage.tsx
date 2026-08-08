"use client";

import Link from "next/link";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  panelBackLinkClass,
  panelEmptyClass,
  panelHintClass,
  panelPageTitleClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelFadeIn } from "@/components/tr/panel/TrPanelMotion";
import { trPanelPath } from "@/lib/tr/paths";

/**
 * e-Fatura / GİB — not wired yet. Honest empty state (no fake invoices).
 */
export function TrOwnerInvoicesPage() {
  return (
    <TrOwnerPanelGate>
      {() => (
        <div className="space-y-4">
          <div>
            <Link href={trPanelPath()} className={panelBackLinkClass}>
              ← Ana sayfa
            </Link>
            <h2 className={panelPageTitleClass}>Faturalar</h2>
          </div>
          <TrPanelFadeIn className="space-y-3">
            <p className={panelEmptyClass}>
              e-Fatura / e-Arşiv entegrasyonu yakında.
            </p>
            <p className={panelHintClass}>
              GİB bağlantısı hazır olunca siparişlerden otomatik kesim burada
              listelenecek. Şimdilik muhasebe sürecinizi mevcut yönteminizle
              sürdürün.
            </p>
          </TrPanelFadeIn>
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
