"use client";

import {
  emptyElbiseGateChips,
  TrOwnerElbiseConstructionGateFields,
  type ElbiseGateChipState,
} from "@/components/tr/panel/TrOwnerElbiseConstructionGate";
import { TrOwnerCategoryPicker } from "@/components/tr/panel/TrOwnerCategoryPicker";
import {
  TrOwnerCreditsCostLine,
  TrOwnerCreditsMoreInfoLink,
} from "@/components/tr/panel/TrOwnerCreditsInfo";
import {
  panelErrorClass,
  panelHintClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
  panelStickyActionsClass,
  panelStickyActionsSpacerClass,
} from "@/components/tr/panel/panelUi";
import { TR_AI_CATALOG_CREDITS } from "@/lib/tr/aiCatalog/uploadCostHints";
import {
  GARMENT_UPLOAD_TYPES,
  isAltGiyimShopLeaf,
  isUstGiyimShopLeaf,
  type ConstructionCatalogFamily,
} from "@/lib/tr/catalog/garmentUploadTypes";
import type { ProductBatchCreateRow } from "@/lib/tr/productBatchCreateDraft";
import {
  batchRowChipsReady,
  batchRowCover,
  batchRowFamily,
  batchRowPackshotReady,
} from "@/lib/tr/productBatchCreateFlow";

const FAMILIES = GARMENT_UPLOAD_TYPES.filter(
  (entry) =>
    entry.live &&
    (entry.id === "elbise" ||
      entry.id === "ust-giyim" ||
      entry.id === "alt-giyim"),
);

function familyStillMatchesCategory(
  family: ConstructionCatalogFamily,
  category: string | null,
): boolean {
  if (family === "elbise") return true;
  if (family === "ust-giyim") return isUstGiyimShopLeaf(category);
  return isAltGiyimShopLeaf(category);
}

export function TrOwnerBatchChipsStep({
  boutiqueId,
  rows,
  packingById,
  onPatchRow,
  onBack,
  onConfirm,
}: {
  boutiqueId: string;
  rows: ProductBatchCreateRow[];
  packingById: Record<string, boolean>;
  onPatchRow: (clientId: string, patch: Partial<ProductBatchCreateRow>) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const notReady = rows.filter((row) => !batchRowChipsReady(row));
  const packing = rows.some((row) => packingById[row.clientId]);
  const credits = rows.length * TR_AI_CATALOG_CREDITS.productPackage;
  const canConfirm = notReady.length === 0 && !packing;

  return (
    <div className="space-y-5">
      <p className={panelHintClass}>
        Her ürünün özelliklerini kontrol edin. Onaylayınca packshot üretilir —
        isimleri bir sonraki adımda düzeltebilirsiniz.
      </p>
      <TrOwnerCreditsCostLine
        boutiqueId={boutiqueId}
        credits={credits}
        prefix="Tüm ürünler için packshot"
      />
      {notReady.length > 0 ? (
        <p className={panelErrorClass}>
          {notReady.length} üründe tür veya zorunlu özellik eksik.
        </p>
      ) : null}

      <div className="space-y-4">
        {rows.map((row, index) => {
          const family = batchRowFamily(row);
          const packingRow = Boolean(packingById[row.clientId]);
          const packReady = batchRowPackshotReady(row);
          const cover = batchRowCover(row);
          const chips = row.gateChips ?? emptyElbiseGateChips(row.proposedChips);
          return (
            <section
              key={row.clientId}
              className="space-y-4 rounded-xl border border-neutral-200/80 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-[color:var(--panel-accent-soft)]">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt=""
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[13px] text-neutral-400">
                      {index + 1}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-neutral-900">
                    {row.title.trim() || `Ürün ${index + 1}`}
                  </p>
                  {packingRow ? (
                    <p className="mt-1 text-[13px] text-neutral-500">
                      Packshot üretiliyor…
                    </p>
                  ) : packReady ? (
                    <p className="mt-1 text-[13px] text-emerald-800">
                      Packshot hazır
                    </p>
                  ) : row.packshotError ? (
                    <p className="mt-1 text-[13px] text-red-700">
                      {row.packshotError}
                    </p>
                  ) : row.frontDraftFailed ? (
                    <p className="mt-1 text-[13px] text-amber-800">
                      AI tanıyamadı — tür ve özellikleri seçin.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[14px] font-semibold text-neutral-800">
                  Tür
                </p>
                <div className="flex flex-wrap gap-2">
                  {FAMILIES.map((entry) => {
                    const active = family === entry.id;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        disabled={packingRow}
                        onClick={() => {
                          const nextFamily = entry.id as ConstructionCatalogFamily;
                          const keepCategory = familyStillMatchesCategory(
                            nextFamily,
                            row.category,
                          );
                          onPatchRow(row.clientId, {
                            uploadType: nextFamily,
                            category:
                              nextFamily === "elbise"
                                ? "elbise"
                                : keepCategory
                                  ? row.category
                                  : null,
                            gateChips:
                              nextFamily === family
                                ? chips
                                : emptyElbiseGateChips(),
                          });
                        }}
                        className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold ${
                          active
                            ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent)] text-white"
                            : "border-neutral-200 bg-white text-neutral-800"
                        }`}
                      >
                        {entry.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {family === "ust-giyim" || family === "alt-giyim" ? (
                <div className="space-y-2">
                  <p className="text-[14px] font-semibold text-neutral-800">
                    Alt kategori
                  </p>
                  <TrOwnerCategoryPicker
                    value={row.category}
                    onChange={(category) =>
                      onPatchRow(row.clientId, { category })
                    }
                    parentId={family}
                  />
                </div>
              ) : null}

              {family ? (
                <TrOwnerElbiseConstructionGateFields
                  chips={chips}
                  onChange={(next: ElbiseGateChipState) =>
                    onPatchRow(row.clientId, { gateChips: next })
                  }
                  disabled={packingRow}
                  family={family}
                  shopCategory={row.category}
                />
              ) : (
                <p className={panelHintClass}>Önce tür seçin.</p>
              )}
            </section>
          );
        })}
      </div>

      <TrOwnerCreditsMoreInfoLink boutiqueId={boutiqueId} />

      <div className={panelStickyActionsSpacerClass} aria-hidden />
      <div className={panelStickyActionsClass}>
        <button
          type="button"
          className={`${panelSecondaryBtnClass} flex-1`}
          onClick={onBack}
        >
          Geri
        </button>
        <button
          type="button"
          className={`${panelPrimaryBtnClass} flex-1`}
          disabled={!canConfirm}
          onClick={onConfirm}
        >
          {packing ? "Packshot üretiliyor…" : "Onayla — packshot üret"}
        </button>
      </div>
    </div>
  );
}
