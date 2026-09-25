"use client";

import { useRouter } from "next/navigation";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrPanelEditor } from "@/components/tr/panel/TrPanelEditor";
import {
  boutiqueLocationAddress,
  TrSimpleProductEditor,
} from "@/components/tr/panel/TrSimpleProductEditor";
import { trPanelEditProductPath, trPanelProductsPath } from "@/lib/tr/paths";

/** Creates a Basit ürün, or a Gelişmiş ürün (Basit + variants) with `productType="advanced"`. */
export function TrOwnerNewSimpleProductPage({
  productType = "simple",
}: {
  productType?: "simple" | "advanced";
}) {
  const router = useRouter();

  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <TrPanelEditor
            backHref={trPanelProductsPath()}
            parentLabel="Ürünler"
            title={productType === "advanced" ? "Gelişmiş ürün ekle" : "Basit ürün ekle"}
          >
            <TrSimpleProductEditor
              key={activeBoutique.id}
              boutiqueId={activeBoutique.id}
              boutiqueSlug={activeBoutique.slug}
              customDomain={activeBoutique.customDomain}
              categoryMode={activeBoutique.categoryMode}
              productType={productType}
              address={boutiqueLocationAddress(activeBoutique)}
              // The editor already raised the "Ürün eklendi" toast; it stays over the redirect.
              onCreated={(created) => router.replace(trPanelEditProductPath(created.id))}
            />
          </TrPanelEditor>
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}
