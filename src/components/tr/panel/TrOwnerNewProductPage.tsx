"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrPanelFadeIn } from "@/components/tr/panel/TrPanelMotion";
import { TrProductCreateWizard } from "@/components/tr/panel/TrProductCreateWizard";
import { trPanelProductsPath } from "@/lib/tr/paths";

export function TrOwnerNewProductPage() {
  const router = useRouter();

  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-6">
          <div>
            <Link
              href={trPanelProductsPath()}
              className="inline-block text-[16px] font-medium"
              style={{ color: "var(--panel-accent)" }}
            >
              ← Listeye dön
            </Link>
            <h2
              className="mt-3 text-[2rem] font-semibold tracking-tight"
              style={{ color: "var(--panel-accent-deep)" }}
            >
              Yeni ürün
            </h2>
            <p className="mt-2 text-[17px] text-neutral-600">
              Adım adım ilerleyin — önce fotoğraf, sonra isim ve fiyat.
            </p>
          </div>
          <TrPanelFadeIn>
            <TrProductCreateWizard
              boutiqueId={activeBoutique.id}
              boutiqueSlug={activeBoutique.slug}
              onSaved={() => {
                router.push(trPanelProductsPath());
              }}
            />
          </TrPanelFadeIn>
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
