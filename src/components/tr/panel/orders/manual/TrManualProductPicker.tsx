"use client";

import { Search, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  panelFieldClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelModal } from "@/components/tr/panel/TrPanelModal";
import {
  filterSellableUnits,
  type SellableUnit,
} from "@/lib/tr/orders/sellableUnits";
import { formatTryFromKurus } from "@/types/tr-marketplace";

/** More rows than this are a search away, not a scroll away. */
const VISIBLE_ROWS = 50;

function Thumb({ unit }: { unit: SellableUnit }) {
  return (
    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-[color:var(--panel-accent-soft)]">
      {unit.imageUrl ? (
        <Image src={unit.imageUrl} alt="" fill className="object-cover" sizes="36px" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[12px] font-semibold text-neutral-500">
          {unit.title.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

/**
 * "Ürün Ekle": every product (a size of a product, a variant of a Gelişmiş ürün) that can
 * go on the order, searchable. Tick some and Kaydet adds them; ones already on the order
 * are marked, sold-out ones can't be ticked. Mount it fresh per open (the modal does).
 */
export function TrManualProductPicker({
  open,
  onClose,
  units,
  loading,
  addedKeys,
  initialQuery,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  units: readonly SellableUnit[];
  /** The catalog is still loading. */
  loading: boolean;
  /** Units already on the order. */
  addedKeys: ReadonlySet<string>;
  /** What the owner had typed in the order page's search box. */
  initialQuery: string;
  onAdd: (units: SellableUnit[]) => void;
}) {
  return (
    <TrPanelModal open={open} onClose={onClose} title="Ürün Ekle" size="lg">
      <PickerBody
        // A new query from the page starts a new selection.
        key={initialQuery}
        onClose={onClose}
        units={units}
        loading={loading}
        addedKeys={addedKeys}
        initialQuery={initialQuery}
        onAdd={onAdd}
      />
    </TrPanelModal>
  );
}

function PickerBody({
  onClose,
  units,
  loading,
  addedKeys,
  initialQuery,
  onAdd,
}: {
  onClose: () => void;
  units: readonly SellableUnit[];
  loading: boolean;
  addedKeys: ReadonlySet<string>;
  initialQuery: string;
  onAdd: (units: SellableUnit[]) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const matches = useMemo(() => filterSellableUnits(units, query), [units, query]);
  const shown = matches.slice(0, VISIBLE_ROWS);
  const selectable = shown.filter((unit) => unit.stock > 0 && !addedKeys.has(unit.key));
  const allSelected =
    selectable.length > 0 && selectable.every((unit) => selected.has(unit.key));

  function toggle(key: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      for (const unit of selectable) {
        if (allSelected) next.delete(unit.key);
        else next.add(unit.key);
      }
      return next;
    });
  }

  function submit() {
    onAdd(units.filter((unit) => selected.has(unit.key)));
    onClose();
  }

  return (
    <>
      <div className="border-b border-neutral-100 px-6 py-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ürün ara.."
            aria-label="Ürün ara"
            className={`${panelFieldClass} pl-9`}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Aramayı temizle"
              className="absolute top-1/2 right-2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-neutral-400 hover:text-neutral-700"
            >
              <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {loading && units.length === 0 ? (
        <p className="px-6 py-10 text-center text-[13.5px] text-neutral-500" role="status">
          Ürünler yükleniyor…
        </p>
      ) : shown.length === 0 ? (
        <p className="px-6 py-10 text-center text-[13.5px] text-neutral-500">
          {units.length === 0
            ? "Satışta ürün yok."
            : "Aramanıza uyan ürün yok."}
        </p>
      ) : (
        <div className="max-h-[45vh] overflow-y-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="sticky top-0 bg-neutral-50 text-neutral-600">
            <tr>
              <th className="w-12 px-6 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={selectable.length === 0}
                  onChange={toggleAll}
                  aria-label="Görünen ürünlerin tümünü seç"
                  className="h-4 w-4 accent-[color:var(--panel-accent)]"
                />
              </th>
              <th className="py-2.5 font-medium">Ürün</th>
              <th className="w-24 py-2.5 text-center font-medium">Stoklar</th>
              <th className="w-36 py-2.5 pr-6 font-medium">Satış Fiyatı</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {shown.map((unit) => {
              const added = addedKeys.has(unit.key);
              const soldOut = unit.stock <= 0;
              const disabled = added || soldOut;
              return (
                <tr
                  key={unit.key}
                  className={disabled ? "opacity-55" : "cursor-pointer hover:bg-[color:var(--panel-accent-soft)]"}
                  onClick={disabled ? undefined : () => toggle(unit.key)}
                >
                  <td className="px-6 py-3">
                    <input
                      type="checkbox"
                      checked={added || selected.has(unit.key)}
                      disabled={disabled}
                      onChange={() => toggle(unit.key)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`${unit.title}${unit.optionLabel ? ` ${unit.optionLabel}` : ""} seç`}
                      className="h-4 w-4 accent-[color:var(--panel-accent)]"
                    />
                  </td>
                  <td className="py-3">
                    <span className="flex items-center gap-3">
                      <Thumb unit={unit} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-neutral-900">
                          {unit.title}
                        </span>
                        {unit.optionLabel ? (
                          <span className="block truncate text-[12px] text-neutral-500">
                            {unit.optionLabel}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 text-center tabular-nums text-neutral-700">
                    {added ? "Eklendi" : soldOut ? "Tükendi" : unit.stock}
                  </td>
                  <td className="py-3 pr-6 tabular-nums">
                    {unit.compareAtKurus ? (
                      <span className="block text-[12px] text-neutral-400 line-through">
                        {formatTryFromKurus(unit.compareAtKurus)}
                      </span>
                    ) : null}
                    <span className="text-neutral-900">{formatTryFromKurus(unit.priceKurus)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-6 py-4">
        <p className="text-[13px] text-neutral-500">
          {matches.length === 0 ? "0 adet" : `1 - ${shown.length} / ${matches.length} adet`}
          {matches.length > shown.length ? " · aramayı daraltın" : ""}
        </p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className={panelSecondaryBtnClass}>
            İptal Et
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={selected.size === 0}
            className={panelPrimaryBtnClass}
          >
            Kaydet
          </button>
        </div>
      </div>
    </>
  );
}
