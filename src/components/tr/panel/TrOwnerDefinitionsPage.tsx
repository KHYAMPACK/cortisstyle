"use client";

import { Layers, LayoutGrid } from "lucide-react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrPanelChoiceCard } from "@/components/tr/panel/TrPanelChoiceCard";
import { trPanelCategoriesPath, trPanelVariantTypesPath } from "@/lib/tr/paths";

/**
 * Tanımlamalar: the hub for the named lists products draw on. Kategoriler and Varyant
 * Türleri for now — Markalar, Etiketler and the rest are added when something needs
 * them (add a card here and a page under /tr/panel/tanimlamalar).
 */
export function TrOwnerDefinitionsPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <div className="space-y-5">
            <h2 className="text-[1.25rem] font-semibold tracking-tight text-neutral-900 sm:text-[1.375rem]">
              Tanımlamalar
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <TrPanelChoiceCard
                href={trPanelCategoriesPath()}
                icon={<LayoutGrid className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
                title="Kategoriler"
                description="Ürünlerinizi kategorilere ayırarak ziyaretçilerinizin aradıkları ürünü daha hızlı bulmasını sağlayın."
              />
              <TrPanelChoiceCard
                href={trPanelVariantTypesPath()}
                icon={<Layers className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
                title="Varyant Türleri"
                description="Renk, beden gibi seçenekleri bir kez tanımlayın; ürünlerinizin varyantlarında kullanın."
              />
            </div>
          </div>
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}
