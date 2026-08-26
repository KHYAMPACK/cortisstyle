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
import {
  requestOwnerListingDraft,
} from "@/lib/tr/ownerClient";
import {
  clampDescription,
  clampTitle,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import {
  applyBatchListingDraft,
  type ProductBatchCreateRow,
} from "@/lib/tr/productBatchCreateDraft";
import { batchRowCover, batchRowFamily } from "@/lib/tr/productBatchCreateFlow";

export function TrOwnerBatchListingsStep({
  boutiqueId,
  rows,
  packingById,
  onPatchRow,
  manualMode = false,
}: {
  boutiqueId: string;
  rows: ProductBatchCreateRow[];
  packingById?: Record<string, boolean>;
  onPatchRow: (clientId: string, patch: Partial<ProductBatchCreateRow>) => void;
  manualMode?: boolean;
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
        onPatchRow(row.clientId, applyBatchListingDraft(row, row.listingDraft));
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
          backImageUrl: row.images[1]?.trim() || undefined,
          detailImageUrl: row.images[2]?.trim() || undefined,
          category: row.category,
          uploadType: row.uploadType,
          inferConstructionFamily: !row.uploadType,
        });
        onPatchRow(row.clientId, applyBatchListingDraft(row, draft));
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
      {manualMode ? null : (
        <>
      <button
        type="button"
        className={`${panelPrimaryBtnClass} w-full sm:w-auto`}
        disabled={filling}
        onClick={() => void fillAll()}
      >
        {filling ? "Dolduruluyor…" : "Hepsini AI ile doldur"}
      </button>
      <p className={panelHintClass}>
        İsim, açıklama, özellik ve kategori fotoğraftan AI ile gelir. İsterseniz
        elle düzeltin.
      </p>
        </>
      )}
      {error ? <p className={panelErrorClass}>{error}</p> : null}

      <div className="space-y-4">
        {rows.map((row, index) => {
          const family = batchRowFamily(row);
          const packing = Boolean(packingById?.[row.clientId]);
          const cover = batchRowCover(row);
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
                      Packshot hazırlanıyor — metni şimdi yazabilirsiniz.
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
                {manualMode || !family ? (
                  <TrOwnerCategoryPicker
                    value={row.category}
                    onChange={(category) =>
                      onPatchRow(row.clientId, { category })
                    }
                  />
                ) : family === "elbise" ? (
                  <p className="rounded-xl bg-[color:var(--panel-accent-soft)] px-4 py-3 text-[15px] text-neutral-800">
                    Elbise
                  </p>
                ) : family === "ust-giyim" || family === "alt-giyim" ? (
                  <>
                    <p className={panelHintClass}>
                      AI fotoğraftan seçti. Gerekirse düzeltin.
                    </p>
                    <TrOwnerCategoryPicker
                      value={row.category}
                      onChange={(category) =>
                        onPatchRow(row.clientId, { category })
                      }
                      parentId={family}
                    />
                  </>
                ) : (
                  <TrOwnerCategoryPicker
                    value={row.category}
                    onChange={(category) =>
                      onPatchRow(row.clientId, { category })
                    }
                  />
                )}
              </div>
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
                  variant="dress"
                  family={family ?? "elbise"}
                  shopCategory={row.category}
                />
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
