"use client";

import { Layers, Package, Shirt } from "lucide-react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrPanelChoiceCard } from "@/components/tr/panel/TrPanelChoiceCard";
import { TrPanelEditor } from "@/components/tr/panel/TrPanelEditor";
import { panelHintClass } from "@/components/tr/panel/panelUi";
import { resolveCatalogProfile } from "@/lib/tr/catalogProfiles";
import { trPanelProductsPath } from "@/lib/tr/paths";
import { productTypesForProfile } from "@/lib/tr/productTypes/registry";
import type { TrProductType } from "@/types/tr-marketplace";

function ProductTypeIcon({ id }: { id: TrProductType }) {
  const props = { className: "h-5 w-5", strokeWidth: 1.75, "aria-hidden": true };
  if (id === "fashion") return <Shirt {...props} />;
  return id === "advanced" ? <Layers {...props} /> : <Package {...props} />;
}

/**
 * First step of "Ürün ekle": which kind of product. The choices come from the
 * boutique's vertical (`productTypesForProfile`), so a new vertical or type shows
 * up here without touching this page.
 */
export function TrOwnerProductTypeChooser() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique, isStaff }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <TrPanelEditor
            backHref={trPanelProductsPath()}
            parentLabel="Ürünler"
            title="Yeni ürün"
          >
            <div className="pt-3">
              <h2 className="text-[18px] font-semibold text-neutral-900">
                Ne tür bir ürün ekleyeceksiniz?
              </h2>
              <p className={`mt-1 ${panelHintClass}`}>
                Bir ürünün türü eklendikten sonra değişmez.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {productTypesForProfile(resolveCatalogProfile(activeBoutique), {
                  isStaff,
                }).map(
                  (type) => (
                    <TrPanelChoiceCard
                      key={type.id}
                      href={type.createPath}
                      icon={<ProductTypeIcon id={type.id} />}
                      title={type.label}
                      description={type.description}
                    />
                  ),
                )}
              </div>
            </div>
          </TrPanelEditor>
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}
