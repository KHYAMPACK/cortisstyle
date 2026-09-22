"use client";

import { TrOwnerCategoryPicker } from "@/components/tr/panel/TrOwnerCategoryPicker";
import {
  emptyElbiseGateChips,
  TrOwnerElbiseConstructionGateFields,
  type ElbiseGateChipState,
} from "@/components/tr/panel/TrOwnerElbiseConstructionGate";
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
import { TR_AI_CATALOG_CREDITS } from "@/lib/tr/fashion/aiCatalog/uploadCostHints";
import {
  GARMENT_UPLOAD_TYPES,
  isAltGiyimShopLeaf,
  isTakimShopLeaf,
  isUstGiyimShopLeaf,
  TAKIM_SHOP_LEAF,
  type ConstructionCatalogFamily,
} from "@/lib/tr/catalog/garmentUploadTypes";
import {
  takimItemChipsReady,
  takimItemPackshotUrl,
} from "@/lib/tr/catalog/takimUpload";
import type { TakimItemDraft } from "@/lib/tr/productTakimCreateDraft";

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
  if (isTakimShopLeaf(category)) return false;
  if (family === "elbise") return true;
  if (family === "ust-giyim") return isUstGiyimShopLeaf(category);
  return isAltGiyimShopLeaf(category);
}

export function TrOwnerTakimChipsStep({
  boutiqueId,
  items,
  packing,
  onPatchItem,
  onBack,
  onConfirm,
}: {
  boutiqueId: string;
  items: [TakimItemDraft, TakimItemDraft];
  packing: [boolean, boolean];
  onPatchItem: (index: 0 | 1, patch: Partial<TakimItemDraft>) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const notReady = items.filter(
    (item) =>
      !takimItemChipsReady({
        family: item.uploadType,
        category: item.category,
        chips: item.gateChips,
      }),
  );
  const packingBusy = packing.some(Boolean);
  const canConfirm = notReady.length === 0 && !packingBusy;

  return (
    <div className="space-y-5">
      <p className={panelHintClass}>
        Her parçanın türünü ve özelliklerini kontrol edin. Onaylayınca iki
        packshot üretilir.
      </p>
      <TrOwnerCreditsCostLine
        boutiqueId={boutiqueId}
        credits={2 * TR_AI_CATALOG_CREDITS.productPackage}
        prefix="İki packshot"
      />
      {notReady.length > 0 ? (
        <p className={panelErrorClass}>
          {notReady.length} parçada tür veya zorunlu özellik eksik.
        </p>
      ) : null}
      {items.map((item, index) => {
        const family = item.uploadType;
        const packingRow = packing[index]!;
        const packReady = Boolean(takimItemPackshotUrl(item));
        const cover =
          item.images[0]?.trim() || item.marketplaceImages[0]?.trim() || "";
        const chips =
          item.gateChips ??
          emptyElbiseGateChips(item.proposedChips, { hasDetailPhoto: false });
        return (
          <section
            key={item.clientId}
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
                  Parça {index + 1}
                  {item.title.trim() ? ` · ${item.title}` : ""}
                </p>
                {packingRow ? (
                  <p className="mt-1 text-[13px] text-neutral-500">
                    Packshot üretiliyor…
                  </p>
                ) : packReady ? (
                  <p className="mt-1 text-[13px] text-emerald-800">
                    Packshot hazır
                  </p>
                ) : item.packshotError ? (
                  <p className="mt-1 text-[13px] text-red-700">
                    {item.packshotError}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[14px] font-semibold text-neutral-800">Tür</p>
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
                          item.category,
                        );
                        onPatchItem(index as 0 | 1, {
                          uploadType: nextFamily,
                          category:
                            nextFamily === "elbise"
                              ? "elbise"
                              : keepCategory
                                ? item.category
                                : null,
                          gateChips:
                            nextFamily === family
                              ? chips
                              : emptyElbiseGateChips(undefined, {
                                  hasDetailPhoto: false,
                                }),
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
                  value={item.category}
                  onChange={(category) =>
                    onPatchItem(index as 0 | 1, { category })
                  }
                  parentId={family}
                  excludeIds={[TAKIM_SHOP_LEAF]}
                />
              </div>
            ) : null}
            {family ? (
              <TrOwnerElbiseConstructionGateFields
                chips={chips}
                onChange={(next: ElbiseGateChipState) =>
                  onPatchItem(index as 0 | 1, { gateChips: next })
                }
                disabled={packingRow}
                family={family}
                shopCategory={item.category}
                hasDetailPhoto={false}
              />
            ) : (
              <p className={panelHintClass}>Önce tür seçin.</p>
            )}
          </section>
        );
      })}
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
          {packingBusy ? "Packshot üretiliyor…" : "Onayla — packshot üret"}
        </button>
      </div>
    </div>
  );
}
