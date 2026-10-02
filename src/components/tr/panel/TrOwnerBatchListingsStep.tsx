"use client";

import { useState } from "react";
import { TrOwnerCategoryPicker } from "@/components/tr/panel/TrOwnerCategoryPicker";
import { TrOwnerProductFeaturesFields } from "@/components/tr/panel/TrOwnerProductFeaturesFields";
import {
  panelFieldClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { constructionCatalogFamily } from "@/lib/tr/fashion/garmentUploadTypes";
import {
  clampDescription,
  clampTitle,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import {
  batchRowCover,
  type ProductBatchCreateRow,
} from "@/lib/tr/productBatchCreateDraft";

/** Toplu ekle, step 2: name, description, category and Özellikler per product. */
export function TrOwnerBatchListingsStep({
  rows,
  onPatchRow,
}: {
  rows: ProductBatchCreateRow[];
  onPatchRow: (clientId: string, patch: Partial<ProductBatchCreateRow>) => void;
}) {
  const [openFeatures, setOpenFeatures] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {rows.map((row, index) => {
          const family = constructionCatalogFamily(null, row.category);
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
                      className="h-full w-full object-cover"
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
