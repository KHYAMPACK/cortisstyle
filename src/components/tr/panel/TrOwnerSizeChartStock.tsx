"use client";

import { useState } from "react";
import type { TrSizeChartId } from "@/lib/tr/productOptions";
import { sizesForChart, sortProductSizes } from "@/lib/tr/productOptions";
import { sanitizeStockInput } from "@/lib/tr/ownerProductConstraints";
import {
  panelAddChipClass,
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
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
  onChartChange: (chart: TrSizeChartId) => void;
  stockInputs: Record<string, string>;
  onStockInputsChange: (next: Record<string, string>) => void;
  /** Single stock when chart is none. */
  stock?: string;
  onStockChange?: (value: string) => void;
  /** Allow “+ Beden ekle” for sizes outside the default chart. */
  allowCustomSizes?: boolean;
  /** @deprecated Both surfaces use the large accessible UI. */
  variant?: "wizard" | "editor";
}

function displaySizesForChart(
  chart: TrSizeChartId,
  stockInputs: Record<string, string>,
): string[] {
  if (chart === "none") return [];
  const chartSizes = sizesForChart(chart);
  const extras = Object.keys(stockInputs).filter(
    (size) => size.trim() && !chartSizes.includes(size),
  );
  return sortProductSizes([...chartSizes, ...extras]);
}

export function TrOwnerSizeChartStock({
  chart,
  onChartChange,
  stockInputs,
  onStockInputsChange,
  stock = "1",
  onStockChange,
  allowCustomSizes = false,
}: TrOwnerSizeChartStockProps) {
  const chartSizes = displaySizesForChart(chart, stockInputs);
  const [addingSize, setAddingSize] = useState(false);
  const [newSize, setNewSize] = useState("");

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
    if (defaults.has(size)) {
      next[size] = "0";
    }
    onStockInputsChange(next);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className={panelLabelClass}>Beden tablosu</p>
        <p className={panelHintClass}>
          Harf veya numara seçin — her beden için stok yazın. 0 = stokta yok
          (ürün sayfasında “gelince haber ver” görünür).
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {CHART_OPTIONS.map((option) => {
            const active = chart === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChartChange(option.id)}
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

      {chart === "none" ? (
        onStockChange ? (
          <label className="block space-y-2">
            <span className={panelLabelClass}>Stok adedi</span>
            <input
              value={stock}
              onChange={(event) =>
                onStockChange(sanitizeStockInput(event.target.value))
              }
              className={panelFieldClass}
              inputMode="numeric"
              maxLength={4}
              required
            />
          </label>
        ) : null
      ) : (
        <div className="space-y-3">
          <p className={panelLabelClass}>Beden stokları</p>
          <div className="space-y-3">
            {chartSizes.map((size) => {
              const isCustom = !sizesForChart(chart).includes(size);
              return (
                <label
                  key={size}
                  className="flex items-center gap-3 rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white px-4 py-3"
                >
                  <span className="w-16 shrink-0 text-[18px] font-semibold text-neutral-900">
                    {size}
                  </span>
                  <input
                    value={stockInputs[size] ?? ""}
                    onChange={(event) => {
                      const value = sanitizeStockInput(event.target.value);
                      onStockInputsChange({
                        ...stockInputs,
                        [size]: value,
                      });
                    }}
                    className={panelFieldClass}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="0"
                    aria-label={`${size} stok`}
                  />
                  {allowCustomSizes && isCustom ? (
                    <button
                      type="button"
                      className="shrink-0 text-[15px] font-semibold text-red-700"
                      onClick={() => removeSize(size)}
                    >
                      Kaldır
                    </button>
                  ) : null}
                </label>
              );
            })}
          </div>

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
                    placeholder="Örn. XXL veya 42"
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
                Tabloda olmayan beden ekleyebilirsiniz (XXL, 42 vb.).
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function emptyStockInputsForChart(
  chart: TrSizeChartId,
  fill = "0",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const size of sizesForChart(chart)) {
    out[size] = fill;
  }
  return out;
}

export function stockInputsFromSizeStocks(
  chart: TrSizeChartId,
  sizeStocks: Record<string, number> | null | undefined,
): Record<string, string> {
  const out = emptyStockInputsForChart(chart, "0");
  if (!sizeStocks) return out;
  for (const [size, n] of Object.entries(sizeStocks)) {
    if (!size.trim()) continue;
    if (typeof n === "number" && Number.isFinite(n)) {
      out[size] = String(Math.max(0, Math.floor(n)));
    }
  }
  return out;
}

/** Sizes to persist: chart defaults plus any custom keys in the stock inputs. */
export function sizesFromStockInputs(
  chart: TrSizeChartId,
  stockInputs: Record<string, string>,
): string[] {
  if (chart === "none") return [];
  return displaySizesForChart(chart, stockInputs);
}
