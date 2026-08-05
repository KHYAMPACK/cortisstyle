"use client";

import type { TrSizeChartId } from "@/lib/tr/productOptions";
import { sizesForChart } from "@/lib/tr/productOptions";
import { sanitizeStockInput } from "@/lib/tr/ownerProductConstraints";
import {
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
} from "@/components/tr/panel/panelUi";

const CHART_OPTIONS: Array<{ id: TrSizeChartId; label: string; hint: string }> =
  [
    {
      id: "letter",
      label: "Harf (XS–XL)",
      hint: "Üst giyim / standart beden",
    },
    {
      id: "numeric",
      label: "Numara (26–40)",
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
  /** @deprecated Both surfaces use the large accessible UI. */
  variant?: "wizard" | "editor";
}

export function TrOwnerSizeChartStock({
  chart,
  onChartChange,
  stockInputs,
  onStockInputsChange,
  stock = "1",
  onStockChange,
}: TrOwnerSizeChartStockProps) {
  const chartSizes = sizesForChart(chart);

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
                    ? "text-white"
                    : "bg-white text-neutral-800 ring-1 ring-[color:var(--panel-accent-border)]"
                }`}
                style={
                  active
                    ? { backgroundColor: "var(--panel-accent)" }
                    : undefined
                }
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
            {chartSizes.map((size) => (
              <label
                key={size}
                className="flex items-center gap-4 rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white px-4 py-3"
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
              </label>
            ))}
          </div>
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
  for (const size of Object.keys(out)) {
    const n = sizeStocks[size];
    if (typeof n === "number" && Number.isFinite(n)) {
      out[size] = String(Math.max(0, Math.floor(n)));
    }
  }
  return out;
}
