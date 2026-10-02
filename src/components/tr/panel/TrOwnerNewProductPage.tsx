"use client";

import { Layers, Package, Shapes } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrPanelChoiceCard } from "@/components/tr/panel/TrPanelChoiceCard";
import { TrPanelEditor } from "@/components/tr/panel/TrPanelEditor";
import { TrPanelLoading } from "@/components/tr/panel/TrPanelMotion";
import { panelHintClass } from "@/components/tr/panel/panelUi";
import {
  boutiqueLocationAddress,
  TrProductEditor,
} from "@/components/tr/panel/TrProductEditor";
import { fetchOwnerProductKinds, type TrOwnerBoutiqueSummary } from "@/lib/tr/ownerClient";
import { trPanelEditProductPath, trPanelProductsPath } from "@/lib/tr/paths";
import type { TrProductKind } from "@/lib/tr/productKinds/types";

/** What the owner picked before the editor opens. */
type Start = { kindId: string | null; productType: "simple" | "advanced" };

/**
 * "Ürün ekle": first the product's kind (Elbise, Pantolon…), then the product editor,
 * empty, starting from that kind (its fields, suggested category, size table). A
 * boutique without kinds goes straight to the editor. `advanced` opens a product with
 * variants (staff only until the shop can sell them).
 */
export function TrOwnerNewProductPage({ advanced = false }: { advanced?: boolean }) {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique, isStaff }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <NewProductFlow
            key={activeBoutique.id}
            boutique={activeBoutique}
            isStaff={isStaff}
            advanced={advanced && isStaff}
          />
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}

function NewProductFlow({
  boutique,
  isStaff,
  advanced,
}: {
  boutique: TrOwnerBoutiqueSummary;
  isStaff: boolean;
  advanced: boolean;
}) {
  const router = useRouter();
  const [kinds, setKinds] = useState<TrProductKind[] | null>(null);
  const [start, setStart] = useState<Start | null>(
    advanced ? { kindId: null, productType: "advanced" } : null,
  );

  useEffect(() => {
    let cancelled = false;
    fetchOwnerProductKinds(boutique.id)
      .then((result) => {
        if (!cancelled) setKinds(result.kinds);
      })
      .catch(() => {
        if (!cancelled) setKinds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [boutique.id]);

  const chosen = start ?? (kinds && kinds.length === 0 ? { kindId: null, productType: "simple" as const } : null);
  const kindName = kinds?.find((kind) => kind.id === chosen?.kindId)?.name;

  return (
    <TrPanelEditor
      backHref={trPanelProductsPath()}
      parentLabel="Ürünler"
      title={kindName ? `Yeni ürün · ${kindName}` : "Yeni ürün"}
    >
      {chosen ? (
        <TrProductEditor
          boutiqueId={boutique.id}
          boutiqueSlug={boutique.slug}
          customDomain={boutique.customDomain}
          address={boutiqueLocationAddress(boutique)}
          productType={chosen.productType}
          initialKindId={chosen.kindId}
          // The editor already raised the "Ürün eklendi" toast; it stays over the redirect.
          onCreated={(created) => router.replace(trPanelEditProductPath(created.id))}
        />
      ) : kinds === null ? (
        <TrPanelLoading label="Ürün türleri yükleniyor…" />
      ) : (
        <div className="pt-3">
          <h2 className="text-[18px] font-semibold text-neutral-900">
            Ne tür bir ürün ekleyeceksiniz?
          </h2>
          <p className={`mt-1 ${panelHintClass}`}>
            Tür, doldurulacak özellikleri ve önerilen kategoriyi belirler; sonradan
            değiştirebilirsiniz.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {kinds.map((kind) => (
              <TrPanelChoiceCard
                key={kind.id}
                onClick={() => setStart({ kindId: kind.id, productType: "simple" })}
                icon={<Shapes className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
                title={kind.name}
                description={`${kind.attributes.length} özellik`}
              />
            ))}
            <TrPanelChoiceCard
              onClick={() => setStart({ kindId: null, productType: "simple" })}
              icon={<Package className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
              title="Türü olmayan ürün"
              description="Özellik alanı olmadan; tür sonradan seçilebilir."
            />
            {isStaff ? (
              <TrPanelChoiceCard
                onClick={() => setStart({ kindId: null, productType: "advanced" })}
                icon={<Layers className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
                title="Varyantlı ürün (personel)"
                description="Her renk/beden kombinasyonu için ayrı fiyat, SKU ve stok. Mağaza henüz satamıyor."
              />
            ) : null}
          </div>
        </div>
      )}
    </TrPanelEditor>
  );
}
