"use client";

import { useRouter } from "next/navigation";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrPanelEditor } from "@/components/tr/panel/TrPanelEditor";
import {
  boutiqueLocationAddress,
  SIMPLE_PRODUCT_NOTICE_KEY,
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
              onCreated={(created, warning) => {
                if (warning) {
                  try {
                    window.sessionStorage.setItem(
                      SIMPLE_PRODUCT_NOTICE_KEY,
                      `Ürün eklendi, ancak: ${warning}`,
                    );
                  } catch {
                    /* ignore */
                  }
                }
                router.replace(trPanelEditProductPath(created.id));
              }}
            />
          </TrPanelEditor>
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}
