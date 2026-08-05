"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductCreatedSuccess } from "@/components/tr/panel/TrOwnerProductCreatedSuccess";
import {
  panelBackLinkClass,
  panelPageTitleClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelFadeIn } from "@/components/tr/panel/TrPanelMotion";
import { TrProductCreateWizard } from "@/components/tr/panel/TrProductCreateWizard";
import { trPanelProductsPath } from "@/lib/tr/paths";
import type { TrProduct } from "@/types/tr-marketplace";

export function TrOwnerNewProductPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <NewProductFlow
          boutiqueId={activeBoutique.id}
          boutiqueSlug={activeBoutique.slug}
          boutiqueName={activeBoutique.name}
        />
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
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {created ? (
          <TrPanelFadeIn key="created-success">
            <div className="mb-2">
              <Link href={trPanelProductsPath()} className={panelBackLinkClass}>
                ← Ürün listesi
              </Link>
              <h2 className={panelPageTitleClass}>Ürün eklendi</h2>
            </div>
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
            <div>
              <Link href={trPanelProductsPath()} className={panelBackLinkClass}>
                ← Listeye dön
              </Link>
              <h2 className={panelPageTitleClass}>Yeni ürün</h2>
              <p className="mt-2 text-[17px] text-neutral-600">
                Adım adım ilerleyin — önce fotoğraf, sonra isim ve fiyat.
              </p>
            </div>
            <div className="mt-6">
              <TrProductCreateWizard
                key={wizardKey}
                boutiqueId={boutiqueId}
                boutiqueSlug={boutiqueSlug}
                onSaved={(product) => {
                  setCreated(product);
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              />
            </div>
          </TrPanelFadeIn>
        )}
      </AnimatePresence>
    </div>
  );
}
