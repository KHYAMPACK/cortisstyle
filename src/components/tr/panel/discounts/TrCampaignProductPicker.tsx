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
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProduct } from "@/types/tr-marketplace";

/** More rows than this are a search away, not a scroll away. */
const VISIBLE_ROWS = 50;

function Thumb({ product }: { product: TrProduct }) {
  const image = product.images[0];
  return (
    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-[color:var(--panel-accent-soft)]">
      {image ? (
        <Image src={image} alt="" fill className="object-cover" sizes="36px" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[12px] font-semibold text-neutral-500">
          {product.title.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

/**
 * A campaign's "Belirli Ürünler" scope: every product, searchable, ticked ones are
 * what the campaign reaches. Mount it fresh per open (the modal does).
 */
export function TrCampaignProductPicker({
  open,
  onClose,
  products,
  loading,
  selectedIds,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  products: readonly TrProduct[];
  loading: boolean;
  selectedIds: readonly string[];
  onApply: (ids: string[]) => void;
}) {
  return (
    <TrPanelModal open={open} onClose={onClose} title="Ürün Seç" size="lg">
      <PickerBody
        onClose={onClose}
        products={products}
        loading={loading}
        selectedIds={selectedIds}
        onApply={onApply}
      />
    </TrPanelModal>
  );
}

function PickerBody({
  onClose,
  products,
  loading,
  selectedIds,
  onApply,
}: {
  onClose: () => void;
  products: readonly TrProduct[];
  loading: boolean;
  selectedIds: readonly string[];
  onApply: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set(selectedIds));

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => product.title.toLowerCase().includes(q));
  }, [products, query]);
  const shown = matches.slice(0, VISIBLE_ROWS);
  const allShownSelected = shown.length > 0 && shown.every((p) => selected.has(p.id));

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllShown() {
    setSelected((current) => {
      const next = new Set(current);
      for (const product of shown) {
        if (allShownSelected) next.delete(product.id);
        else next.add(product.id);
      }
      return next;
    });
  }

  function submit() {
    onApply([...selected]);
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

      {loading && products.length === 0 ? (
        <p className="px-6 py-10 text-center text-[13.5px] text-neutral-500" role="status">
          Ürünler yükleniyor…
        </p>
      ) : shown.length === 0 ? (
        <p className="px-6 py-10 text-center text-[13.5px] text-neutral-500">
          {products.length === 0 ? "Ürün yok." : "Aramanıza uyan ürün yok."}
        </p>
      ) : (
        <div className="max-h-[45vh] overflow-y-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="sticky top-0 bg-neutral-50 text-neutral-600">
              <tr>
                <th className="w-12 px-6 py-2.5">
                  <input
                    type="checkbox"
                    checked={allShownSelected}
                    onChange={toggleAllShown}
                    aria-label="Görünen ürünlerin tümünü seç"
                    className="h-4 w-4 accent-[color:var(--panel-accent)]"
                  />
                </th>
                <th className="py-2.5 font-medium">Ürün</th>
                <th className="w-36 py-2.5 pr-6 font-medium">Satış Fiyatı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {shown.map((product) => (
                <tr
                  key={product.id}
                  className="cursor-pointer hover:bg-[color:var(--panel-accent-soft)]"
                  onClick={() => toggle(product.id)}
                >
                  <td className="px-6 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggle(product.id)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`${product.title} seç`}
                      className="h-4 w-4 accent-[color:var(--panel-accent)]"
                    />
                  </td>
                  <td className="py-3">
                    <span className="flex items-center gap-3">
                      <Thumb product={product} />
                      <span className="min-w-0 truncate font-medium text-neutral-900">
                        {product.title}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 pr-6 tabular-nums text-neutral-700">
                    {formatTryFromKurus(product.priceKurus)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-6 py-4">
        <p className="text-[13px] text-neutral-500">
          {selected.size === 0 ? "0 ürün seçili" : `${selected.size} ürün seçili`}
          {matches.length > shown.length ? " · aramayı daraltın" : ""}
        </p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className={panelSecondaryBtnClass}>
            İptal Et
          </button>
          <button type="button" onClick={submit} className={panelPrimaryBtnClass}>
            Uygula
          </button>
        </div>
      </div>
    </>
  );
}
