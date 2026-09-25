"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { panelFieldClass } from "@/components/tr/panel/panelUi";
import {
  MANUAL_ORDER_LIMITS,
  manualLineKey,
  type ManualLine,
} from "@/lib/tr/orders/manualOrder";
import type { SellableUnit } from "@/lib/tr/orders/sellableUnits";
import { formatTryFromKurus } from "@/types/tr-marketplace";

/** One line of the order as the table shows it. `unit` is null when it can no longer be sold. */
export interface ManualLineRow {
  line: ManualLine;
  unit: SellableUnit | null;
  /** The product's name, kept even when its unit is gone. */
  title: string;
}

/** What is wrong with a row, in a sentence, or null. */
export function manualLineProblem(row: ManualLineRow): string | null {
  if (!row.unit) return "Bu ürün artık satışta değil; siparişten kaldırın.";
  if (row.unit.stock <= 0) return "Bu ürün tükendi; siparişten kaldırın.";
  if (row.line.quantity > row.unit.stock) {
    return `Stokta yalnızca ${row.unit.stock} adet var.`;
  }
  return null;
}

function Thumb({ imageUrl, title }: { imageUrl: string | null; title: string }) {
  return (
    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-[color:var(--panel-accent-soft)]">
      {imageUrl ? (
        <Image src={imageUrl} alt="" fill className="object-cover" sizes="40px" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[13px] font-semibold text-neutral-500">
          {title.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

/**
 * A quantity the owner types: the text can be empty or half-typed while editing and is
 * only committed (as a whole number within the limits) when the field is left.
 */
function QuantityInput({
  value,
  max,
  label,
  onCommit,
}: {
  value: number;
  max: number;
  label: string;
  onCommit: (quantity: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft === null) return;
    const parsed = Math.floor(Number(draft));
    setDraft(null);
    if (Number.isFinite(parsed)) onCommit(Math.min(max, Math.max(1, parsed)));
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      min={1}
      max={max}
      value={draft ?? String(value)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
      }}
      aria-label={label}
      className={`${panelFieldClass} w-24 tabular-nums`}
    />
  );
}

/** Ürün · Fiyat · Ürün Sayısı · Toplam Tutar, one row per line, each removable. */
export function TrManualOrderLines({
  rows,
  onQuantity,
  onRemove,
}: {
  rows: readonly ManualLineRow[];
  onQuantity: (line: ManualLine, quantity: number) => void;
  onRemove: (line: ManualLine) => void;
}) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-[13px]">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="rounded-l-md py-2.5 pl-3 font-medium">Ürün</th>
              <th className="w-32 py-2.5 font-medium">Fiyat</th>
              <th className="w-32 py-2.5 font-medium">Ürün Sayısı</th>
              <th className="w-32 py-2.5 font-medium">Toplam Tutar</th>
              <th className="w-12 rounded-r-md py-2.5" aria-label="Kaldır" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row) => {
              const { line, unit } = row;
              const problem = manualLineProblem(row);
              const label = `${row.title}${unit?.optionLabel ? ` ${unit.optionLabel}` : ""}`;
              return (
                <tr key={manualLineKey(line)} className="align-top">
                  <td className="py-3 pr-3 pl-3">
                    <span className="flex items-center gap-3">
                      <Thumb imageUrl={unit?.imageUrl ?? null} title={row.title} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-neutral-900">
                          {row.title}
                        </span>
                        {unit?.optionLabel ? (
                          <span className="block truncate text-[12px] text-neutral-500">
                            {unit.optionLabel}
                          </span>
                        ) : null}
                        {problem ? (
                          <span className="mt-0.5 block text-[12px] text-red-700" role="alert">
                            {problem}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 tabular-nums">
                    {unit ? (
                      <>
                        {unit.compareAtKurus ? (
                          <span className="block text-[12px] text-neutral-400 line-through">
                            {formatTryFromKurus(unit.compareAtKurus)}
                          </span>
                        ) : null}
                        <span className="text-neutral-900">
                          {formatTryFromKurus(unit.priceKurus)}
                        </span>
                      </>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    <QuantityInput
                      value={line.quantity}
                      max={MANUAL_ORDER_LIMITS.quantityMax}
                      label={`${label} adedi`}
                      onCommit={(quantity) => onQuantity(line, quantity)}
                    />
                  </td>
                  <td className="py-3 tabular-nums text-neutral-900">
                    {unit ? formatTryFromKurus(unit.priceKurus * line.quantity) : "—"}
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <button
                      type="button"
                      onClick={() => onRemove(line)}
                      aria-label={`${label} siparişten kaldır`}
                      className="grid h-8 w-8 place-items-center rounded-md text-red-600 transition-colors duration-150 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 motion-reduce:transition-none"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-3 pt-4 text-[13px] text-neutral-500">
        {rows.length === 0 ? "0 adet" : `1 - ${rows.length} / ${rows.length} adet`}
      </p>
    </div>
  );
}
