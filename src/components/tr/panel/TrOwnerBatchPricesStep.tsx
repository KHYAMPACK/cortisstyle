"use client";

import { panelFieldClass } from "@/components/tr/panel/panelUi";
import {
  isValidTryPrice,
  sanitizeTryPriceInput,
} from "@/lib/tr/ownerProductConstraints";
import {
  batchRowCover,
  type ProductBatchCreateRow,
} from "@/lib/tr/productBatchCreateDraft";

function saleNotBelowList(row: ProductBatchCreateRow): boolean {
  if (!row.discountEnabled || !row.salePriceTry.trim()) return false;
  if (!isValidTryPrice(row.priceTry)) return false;
  if (!isValidTryPrice(row.salePriceTry)) return true;
  const price = Number(row.priceTry.replace(",", "."));
  const sale = Number(row.salePriceTry.replace(",", "."));
  return sale >= price;
}

export function TrOwnerBatchPricesStep({
  rows,
  onPatchRow,
}: {
  rows: ProductBatchCreateRow[];
  onPatchRow: (clientId: string, patch: Partial<ProductBatchCreateRow>) => void;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const cover = batchRowCover(row);
        const name = row.title.trim() || `Ürün ${index + 1}`;
        return (
          <section
            key={row.clientId}
            className="rounded-xl border border-neutral-200/80 bg-white p-3 sm:p-4"
          >
            <div className="flex items-start gap-3">
              <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-[color:var(--panel-accent-soft)]">
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
              <div className="min-w-0 flex-1 space-y-3">
                <p className="truncate text-[15px] font-semibold text-neutral-900">
                  {name}
                </p>
                <label className="block space-y-1.5">
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
                    aria-label={`${name} fiyat`}
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
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2.5 text-left"
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
                  <label className="block space-y-1.5">
                    <span className="text-[14px] font-semibold text-neutral-800">
                      İndirimli fiyat (TL)
                    </span>
                    <input
                      value={row.salePriceTry}
                      onChange={(event) =>
                        onPatchRow(row.clientId, {
                          salePriceTry: sanitizeTryPriceInput(
                            event.target.value,
                          ),
                        })
                      }
                      className={panelFieldClass}
                      inputMode="decimal"
                      placeholder="690"
                      aria-label={`${name} indirimli fiyat`}
                    />
                    {saleNotBelowList(row) ? (
                      <span className="text-[13px] text-red-700">
                        İndirimli fiyat, normal fiyattan düşük olmalı.
                      </span>
                    ) : null}
                  </label>
                ) : null}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
