"use client";

import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrOwnerProductCreatedSuccess } from "@/components/tr/panel/TrOwnerProductCreatedSuccess";
import { TrPanelEditor } from "@/components/tr/panel/TrPanelEditor";
import { TrPanelFadeIn } from "@/components/tr/panel/TrPanelMotion";
import { TrProductCreateWizard } from "@/components/tr/panel/TrProductCreateWizard";
import { trPanelProductsPath } from "@/lib/tr/paths";
import type { TrProduct } from "@/types/tr-marketplace";

export function TrOwnerNewProductPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
        <NewProductFlow
          boutiqueId={activeBoutique.id}
          boutiqueSlug={activeBoutique.slug}
          boutiqueName={activeBoutique.name}
        />
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}

function NewProductFlow({
  boutiqueId,
  boutiqueSlug,
  boutiqueName,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
  boutiqueName: string;
}) {
  const [created, setCreated] = useState<TrProduct | null>(null);
  const [wizardKey, setWizardKey] = useState(0);

  return (
    <TrPanelEditor
      backHref={trPanelProductsPath()}
      parentLabel="Ürünler"
      title={created ? "Ürün eklendi" : "Yeni ürün"}
    >
      <AnimatePresence mode="wait">
        {created ? (
          <TrPanelFadeIn key="created-success">
            <TrOwnerProductCreatedSuccess
              product={created}
              boutiqueSlug={boutiqueSlug}
              boutiqueName={boutiqueName}
              onAddAnother={() => {
                setCreated(null);
                setWizardKey((key) => key + 1);
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            />
          </TrPanelFadeIn>
        ) : (
          <TrPanelFadeIn key={`create-wizard-${wizardKey}`}>
            <p className="mb-6 text-[15px] text-neutral-600">
              Adım adım ilerleyin — önce fotoğraf, sonra isim ve fiyat.
            </p>
            <TrProductCreateWizard
              key={wizardKey}
              boutiqueId={boutiqueId}
              onSaved={(product) => {
                setCreated(product);
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            />
          </TrPanelFadeIn>
        )}
      </AnimatePresence>
    </TrPanelEditor>
  );
}
