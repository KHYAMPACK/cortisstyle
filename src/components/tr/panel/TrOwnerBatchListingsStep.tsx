"use client";

import { useState } from "react";
import { TrOwnerCategoryPicker } from "@/components/tr/panel/TrOwnerCategoryPicker";
import { TrOwnerProductFeaturesFields } from "@/components/tr/panel/TrOwnerProductFeaturesFields";
import {
  panelErrorClass,
  panelFieldClass,
  panelHintClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import type { PipelineJobItem } from "@/lib/tr/aiCatalog/pipelineProgress";
import {
  requestOwnerListingDraft,
  type OwnerListingDraft,
} from "@/lib/tr/ownerClient";
import {
  clampDescription,
  clampTitle,
  isValidTryPrice,
  sanitizeTryPriceInput,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import type { ProductBatchCreateRow } from "@/lib/tr/productBatchCreateDraft";
import { batchPhotoTileStatus, batchRowCover } from "@/lib/tr/productBatchCreateFlow";

function applyDraft(
  row: ProductBatchCreateRow,
  draft: OwnerListingDraft,
): Partial<ProductBatchCreateRow> {
  return {
    title: clampTitle(draft.title),
    description: clampDescription(draft.description ?? ""),
    features: draft.features ?? row.features,
    category: draft.category ?? row.category,
    listingDraft: draft,
  };
}

export function TrOwnerBatchListingsStep({
  boutiqueId,
  rows,
  photoJobsById,
  onPatchRow,
}: {
  boutiqueId: string;
  rows: ProductBatchCreateRow[];
  photoJobsById: Record<string, PipelineJobItem[]>;
  onPatchRow: (clientId: string, patch: Partial<ProductBatchCreateRow>) => void;
}) {
  const [filling, setFilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFeatures, setOpenFeatures] = useState<string | null>(null);

  async function fillAll() {
    setFilling(true);
    setError(null);
    const failures: string[] = [];
    for (const [index, row] of rows.entries()) {
      if (row.listingDraft?.title?.trim()) {
        onPatchRow(row.clientId, applyDraft(row, row.listingDraft));
        continue;
      }
      const source =
        row.marketplaceImages[0]?.trim() || row.images[0]?.trim() || "";
      if (!source) {
        failures.push(`Ürün ${index + 1}: fotoğraf yok`);
        continue;
      }
      try {
        const draft = await requestOwnerListingDraft({
          boutiqueId,
          sourceImageUrl: source,
          category: row.category,
        });
        onPatchRow(row.clientId, applyDraft(row, draft));
      } catch (fillError) {
        failures.push(
          `Ürün ${index + 1}: ${
            fillError instanceof Error ? fillError.message : "AI dolduramadı"
          }`,
        );
      }
    }
    if (failures.length > 0) setError(failures.join(" · "));
    setFilling(false);
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        className={`${panelPrimaryBtnClass} w-full sm:w-auto`}
        disabled={filling}
        onClick={() => void fillAll()}
      >
        {filling ? "Dolduruluyor…" : "Hepsini AI ile doldur"}
      </button>
      <p className={panelHintClass}>
        İsim, açıklama, özellik ve kategori AI’dan gelir. Fiyatı her ürüne siz
        yazarsınız.
      </p>
      {error ? <p className={panelErrorClass}>{error}</p> : null}

      <div className="space-y-4">
        {rows.map((row, index) => {
          const photoStatus = batchPhotoTileStatus(
            row,
            photoJobsById[row.clientId] ?? [],
          );
          const cover = batchRowCover(row);
          const packing =
            photoStatus.kind === "queued" || photoStatus.kind === "packshot";
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
                    Ürün {index + 1}
                  </p>
                  {packing ? (
                    <p className="mt-1 text-[13px] text-neutral-500">
                      Katalog hazırlanıyor — metni şimdi yazabilirsiniz.
                    </p>
                  ) : null}
                </div>
              </div>

              <label className="block space-y-2">
                <span className="text-[14px] font-semibold text-neutral-800">
                  Ürün adı
                </span>
                <input
                  value={row.title}
                  onChange={(event) =>
                    onPatchRow(row.clientId, {
                      title: clampTitle(event.target.value),
                    })
                  }
                  className={panelFieldClass}
                  placeholder="Örn. Siyah Bluz"
                  maxLength={TR_OWNER_PRODUCT_LIMITS.titleMax}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-[14px] font-semibold text-neutral-800">
                  Açıklama
                </span>
                <textarea
                  value={row.description}
                  onChange={(event) =>
                    onPatchRow(row.clientId, {
                      description: clampDescription(event.target.value),
                    })
                  }
                  className={`${panelFieldClass} min-h-24`}
                  maxLength={TR_OWNER_PRODUCT_LIMITS.descriptionMax}
                />
              </label>
              <div className="space-y-2">
                <p className="text-[14px] font-semibold text-neutral-800">
                  Kategori
                </p>
                <TrOwnerCategoryPicker
                  value={row.category}
                  onChange={(category) =>
                    onPatchRow(row.clientId, { category })
                  }
                />
              </div>
              <label className="block space-y-2">
                <span className="text-[14px] font-semibold text-neutral-800">
                  Fiyat (TL)
                </span>
                <input
                  value={row.priceTry}
                  onChange={(event) =>
                    onPatchRow(row.clientId, {
                      priceTry: sanitizeTryPriceInput(event.target.value),
                    })
                  }
                  className={panelFieldClass}
                  inputMode="decimal"
                  placeholder="890"
                />
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={row.discountEnabled}
                onClick={() =>
                  onPatchRow(row.clientId, {
                    discountEnabled: !row.discountEnabled,
                    salePriceTry: row.discountEnabled ? "" : row.salePriceTry,
                  })
                }
                className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3 text-left"
              >
                <span
                  className={`relative h-7 w-12 shrink-0 rounded-full ${
                    row.discountEnabled
                      ? "bg-[color:var(--panel-accent)]"
                      : "bg-neutral-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow ${
                      row.discountEnabled ? "translate-x-5" : ""
                    }`}
                  />
                </span>
                <span className="text-[14px] font-medium text-neutral-800">
                  İndirim var
                </span>
              </button>
              {row.discountEnabled ? (
                <label className="block space-y-2">
                  <span className="text-[14px] font-semibold text-neutral-800">
                    İndirimli fiyat (TL)
                  </span>
                  <input
                    value={row.salePriceTry}
                    onChange={(event) =>
                      onPatchRow(row.clientId, {
                        salePriceTry: sanitizeTryPriceInput(event.target.value),
                      })
                    }
                    className={panelFieldClass}
                    inputMode="decimal"
                    placeholder="690"
                  />
                  {row.priceTry &&
                  isValidTryPrice(row.priceTry) &&
                  row.salePriceTry &&
                  !isValidTryPrice(row.salePriceTry) ? (
                    <span className="text-[13px] text-red-700">
                      İndirimli fiyat, normal fiyattan düşük olmalı.
                    </span>
                  ) : null}
                </label>
              ) : null}
              <button
                type="button"
                className={panelSecondaryBtnClass}
                onClick={() =>
                  setOpenFeatures((current) =>
                    current === row.clientId ? null : row.clientId,
                  )
                }
              >
                {openFeatures === row.clientId
                  ? "Özellikleri gizle"
                  : "Ürün özellikleri"}
              </button>
              {openFeatures === row.clientId ? (
                <TrOwnerProductFeaturesFields
                  value={row.features ?? {}}
                  onChange={(features) =>
                    onPatchRow(row.clientId, { features })
                  }
                  fieldClass={panelFieldClass}
                />
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
