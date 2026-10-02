"use client";

import { Layers, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrPanelChoiceCard } from "@/components/tr/panel/TrPanelChoiceCard";
import { TrPanelEditor } from "@/components/tr/panel/TrPanelEditor";
import { panelHintClass } from "@/components/tr/panel/panelUi";
import {
  boutiqueLocationAddress,
  TrProductEditor,
} from "@/components/tr/panel/TrProductEditor";
import {
  trPanelEditProductPath,
  trPanelNewAdvancedProductPath,
  trPanelNewSimpleProductPath,
  trPanelProductsPath,
} from "@/lib/tr/paths";

/**
 * "Ürün ekle": Basit or Gelişmiş. Both open the product editor, where the product's
 * kind (Ürün türü) is picked like its categories. Gelişmiş sells as variants (F5).
 */
export function TrOwnerProductKindChooser() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <TrPanelEditor backHref={trPanelProductsPath()} parentLabel="Ürünler" title="Yeni ürün">
            <div className="pt-3">
              <h2 className="text-[18px] font-semibold text-neutral-900">
                Ne tür bir ürün ekleyeceksiniz?
              </h2>
              <p className={`mt-1 ${panelHintClass}`}>
                Ürün türünü (Elbise, Pantolon…) bir sonraki adımda, ürünün içinden
                seçersiniz.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <TrPanelChoiceCard
                  href={trPanelNewSimpleProductPath()}
                  icon={<Package className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
                  title="Basit ürün"
                  description="Tek fiyat; bedenleri ve stoğu beden tablosunda ya da tek stok olarak girersiniz."
                />
                <TrPanelChoiceCard
                  href={trPanelNewAdvancedProductPath()}
                  icon={<Layers className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
                  title="Gelişmiş ürün"
                  description="Varyantlar: renk, beden gibi seçeneklerin her kombinasyonu için ayrı fiyat, SKU ve stok."
                />
              </div>
            </div>
          </TrPanelEditor>
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}

/** The editor for a new product; `advanced` = Gelişmiş (variants). */
export function TrOwnerNewProductPage({ advanced = false }: { advanced?: boolean }) {
  const router = useRouter();
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <TrPanelEditor
            backHref={trPanelProductsPath()}
            parentLabel="Ürünler"
            title={advanced ? "Gelişmiş ürün ekle" : "Basit ürün ekle"}
          >
            <TrProductEditor
              key={activeBoutique.id}
              boutiqueId={activeBoutique.id}
              boutiqueSlug={activeBoutique.slug}
              customDomain={activeBoutique.customDomain}
              address={boutiqueLocationAddress(activeBoutique)}
              productType={advanced ? "advanced" : "simple"}
              // The editor already raised the "Ürün eklendi" toast; it stays over the redirect.
              onCreated={(created) => router.replace(trPanelEditProductPath(created.id))}
            />
          </TrPanelEditor>
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}
