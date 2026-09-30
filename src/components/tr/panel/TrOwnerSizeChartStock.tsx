"use client";

import { useState } from "react";
import type { TrSizeChartId } from "@/lib/tr/productOptions";
import {
  NUMERIC_EXPANDED_SIZES,
  sizesForChart,
} from "@/lib/tr/productOptions";
import {
  missingChartSizes,
  sizesForStockInputs,
  sizesInStockInputs,
} from "@/lib/tr/sizeStockInputs";

export {
  emptyStockInputsForChart,
  sizesFromStockInputs,
  stockInputsFromSizeStocks,
} from "@/lib/tr/sizeStockInputs";
import {
  sanitizeStockInput,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import {
  panelAddChipClass,
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
  panelStepperBtnClass,
} from "@/components/tr/panel/panelUi";

const CHART_OPTIONS: Array<{ id: TrSizeChartId; label: string; hint: string }> =
  [
    {
      id: "letter",
      label: "Harf (XS–3XL)",
      hint: "Üst giyim / standart beden",
    },
    {
      id: "numeric",
      label: "Numara (24–40)",
      hint: "Pantolon / jean ölçüsü",
    },
    {
      id: "none",
      label: "Beden yok",
      hint: "Tek stok yeterli",
    },
  ];

interface TrOwnerSizeChartStockProps {
  chart: TrSizeChartId;
  onChartChange?: (chart: TrSizeChartId) => void;
  stockInputs: Record<string, string>;
  onStockInputsChange: (next: Record<string, string>) => void;
  /** Single stock when chart is none. */
  stock?: string;
  onStockChange?: (value: string) => void;
  /** Allow “+ Beden ekle” for sizes outside the default chart. */
  allowCustomSizes?: boolean;
  /** @deprecated Both surfaces use the large accessible UI. */
  variant?: "wizard" | "editor";
  /** Extra colors: stock rows only — chart is shared with the primary SKU. */
  hideChart?: boolean;
  heading?: string;
  /**
   * Edit an existing garment: list only the sizes in `stockInputs` (no chart defaults
   * added), let every size be removed, and offer the chart's missing sizes as chips.
   */
  onlyListedSizes?: boolean;
}

function parsedStockQty(raw: string): number {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

function bumpStock(raw: string, delta: 1 | -1): string {
  const next = parsedStockQty(raw) + delta;
  return String(
    Math.min(
      TR_OWNER_PRODUCT_LIMITS.stockMax,
      Math.max(TR_OWNER_PRODUCT_LIMITS.stockMin, next),
    ),
  );
}

function StockQtyField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  const qty = parsedStockQty(value);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <button
        type="button"
        disabled={qty <= TR_OWNER_PRODUCT_LIMITS.stockMin}
        onClick={() => onChange(bumpStock(value, -1))}
        className={panelStepperBtnClass}
        aria-label={`${label} azalt`}
      >
        −
      </button>
      <input
        value={value}
        onChange={(event) => onChange(sanitizeStockInput(event.target.value))}
        className={`${panelFieldClass} min-w-0 flex-1 text-center tabular-nums`}
        inputMode="numeric"
        maxLength={4}
        aria-label={label}
      />
      <button
        type="button"
        disabled={qty >= TR_OWNER_PRODUCT_LIMITS.stockMax}
        onClick={() => onChange(bumpStock(value, 1))}
        className={panelStepperBtnClass}
        aria-label={`${label} artır`}
      >
        +
      </button>
    </div>
  );
}

export function TrOwnerSizeChartStock({
  chart,
  onChartChange,
  stockInputs,
  onStockInputsChange,
  stock = "1",
  onStockChange,
  allowCustomSizes = false,
  hideChart = false,
  heading,
  onlyListedSizes = false,
}: TrOwnerSizeChartStockProps) {
  const chartSizes = onlyListedSizes
    ? sizesInStockInputs(stockInputs)
    : sizesForStockInputs(chart, stockInputs);
  const addableChartSizes = onlyListedSizes
    ? missingChartSizes(chart, stockInputs)
    : [];
  const [addingSize, setAddingSize] = useState(false);
  const [newSize, setNewSize] = useState("");
  const missingExpandedSizes =
    chart === "numeric"
      ? NUMERIC_EXPANDED_SIZES.filter((size) => stockInputs[size] === undefined)
      : [];

  const expandNumericSizes = () => {
    const next = { ...stockInputs };
    for (const size of NUMERIC_EXPANDED_SIZES) {
      if (next[size] === undefined) next[size] = "0";
    }
    onStockInputsChange(next);
  };

  const commitSize = () => {
    const size = newSize.trim().toLocaleUpperCase("en");
    if (!size) return;
    if (Object.keys(stockInputs).some((key) => key.toUpperCase() === size)) {
      setAddingSize(false);
      setNewSize("");
      return;
    }
    onStockInputsChange({ ...stockInputs, [size]: stockInputs[size] ?? "0" });
    setAddingSize(false);
    setNewSize("");
  };

  const removeSize = (size: string) => {
    const next = { ...stockInputs };
    delete next[size];
    // Keep chart defaults present as "0" so the row stays until chart change.
    const defaults = new Set(sizesForChart(chart));
    if (!onlyListedSizes && defaults.has(size)) {
      next[size] = "0";
    }
    onStockInputsChange(next);
  };

  return (
    <div className="space-y-6">
      {hideChart ? null : (
      <div className="space-y-3">
        <p className={panelLabelClass}>Beden tablosu</p>
        <p className={panelHintClass}>
          Harf veya numara seçin — her beden için stok yazın veya + / − ile
          ayarlayın. 0 = stokta yok (ürün sayfasında “gelince haber ver”
          görünür).
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {CHART_OPTIONS.map((option) => {
            const active = chart === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChartChange?.(option.id)}
                className={`rounded-xl px-4 py-4 text-left text-[16px] font-semibold transition-colors ${
                  active
                    ? "bg-[color:var(--panel-accent)] text-white hover:bg-[color:var(--panel-accent-hover)]"
                    : "bg-white text-neutral-800 ring-1 ring-[color:var(--panel-accent-border)] hover:bg-[color:var(--panel-accent-soft)]"
                }`}
              >
                <span className="block">{option.label}</span>
                <span
                  className={`mt-1 block text-[14px] font-normal ${
                    active ? "text-white/90" : "text-neutral-500"
                  }`}
                >
                  {option.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {heading ? <p className={panelLabelClass}>{heading}</p> : null}

      {chart === "none" ? (
        onStockChange ? (
          <div className="space-y-2">
            <p className={panelLabelClass}>Stok adedi</p>
            <StockQtyField
              value={stock}
              onChange={onStockChange}
              label="Stok adedi"
            />
          </div>
        ) : null
      ) : (
        <div className="space-y-3">
          <p className={panelLabelClass}>Beden stokları</p>
          <div className="space-y-3">
            {chartSizes.map((size) => {
              const isDefault = sizesForChart(chart).includes(size);
              const isExpandedNumeric = NUMERIC_EXPANDED_SIZES.includes(size);
              const canRemove =
                onlyListedSizes ||
                (!isDefault && (allowCustomSizes || isExpandedNumeric));
              return (
                <div
                  key={size}
                  className="flex items-center gap-3 rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white px-4 py-3"
                >
                  <span className="w-16 shrink-0 text-[18px] font-semibold text-neutral-900">
                    {size}
                  </span>
                  <StockQtyField
                    value={stockInputs[size] ?? ""}
                    onChange={(next) =>
                      onStockInputsChange({
                        ...stockInputs,
                        [size]: next,
                      })
                    }
                    label={`${size} stok`}
                  />
                  {canRemove ? (
                    <button
                      type="button"
                      className="min-h-11 shrink-0 text-[15px] font-semibold text-red-700"
                      onClick={() => removeSize(size)}
                    >
                      Kaldır
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          {chartSizes.length === 0 ? (
            <p className={panelHintClass}>
              Henüz beden yok. Aşağıdan ekleyin ya da “Beden yok” seçin.
            </p>
          ) : null}

          {addableChartSizes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {addableChartSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={panelAddChipClass}
                  onClick={() => onStockInputsChange({ ...stockInputs, [size]: "0" })}
                >
                  + {size}
                </button>
              ))}
            </div>
          ) : null}

          {missingExpandedSizes.length > 0 ? (
            <button
              type="button"
              className={panelAddChipClass}
              onClick={expandNumericSizes}
            >
              Daha büyük bedenler (42–52)
            </button>
          ) : null}

          {allowCustomSizes ? (
            <div className="space-y-3 pt-1">
              {!addingSize ? (
                <button
                  type="button"
                  className={panelAddChipClass}
                  onClick={() => setAddingSize(true)}
                >
                  + Beden ekle
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    value={newSize}
                    onChange={(event) => setNewSize(event.target.value)}
                    placeholder="Örn. XXL veya 54"
                    className={`${panelFieldClass} min-w-[140px] flex-1`}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitSize();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={panelPrimaryBtnClass}
                    onClick={commitSize}
                  >
                    Ekle
                  </button>
                  <button
                    type="button"
                    className={panelSecondaryBtnClass}
                    onClick={() => {
                      setAddingSize(false);
                      setNewSize("");
                    }}
                  >
                    Vazgeç
                  </button>
                </div>
              )}
              <p className={panelHintClass}>
                Tabloda olmayan beden ekleyebilirsiniz (XXL, 54 vb.).
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
