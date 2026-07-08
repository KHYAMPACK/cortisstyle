"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrProductEditorForm } from "@/components/tr/panel/TrProductEditorForm";
import { trPanelPath } from "@/lib/tr/paths";

export function TrOwnerNewProductPage() {
  const router = useRouter();

  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-6">
          <Link
            href={trPanelPath()}
            className="inline-block text-[11px] tracking-[0.1em] text-neutral-500 uppercase"
          >
            ← Listeye dön
          </Link>
          <h2 className="font-serif text-xl tracking-tight text-neutral-950">
            Yeni ürün
          </h2>
          <TrProductEditorForm
            boutiqueId={activeBoutique.id}
            mode="create"
            onSaved={() => {
              router.push(trPanelPath());
            }}
          />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
