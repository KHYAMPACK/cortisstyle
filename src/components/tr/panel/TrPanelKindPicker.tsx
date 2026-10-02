"use client";

import { MoreHorizontal, Pencil } from "lucide-react";
import { useState } from "react";
import { TrPanelDrawer } from "@/components/tr/panel/TrPanelDrawer";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { TrPanelPopover } from "@/components/tr/panel/TrPanelPopover";
import {
  panelFieldClass,
  panelHintClass,
  panelPrimaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { trPanelProductKindsPath } from "@/lib/tr/paths";
import type { TrProductKind } from "@/lib/tr/productKinds/types";

/**
 * A product's kind (Ürün türü), laid out like the category picker: an empty state with
 * "Ürün Türü Seç", a drawer listing the boutique's kinds, and once chosen a row with a
 * "Değiştir / Kaldır" menu. Controlled: the editor keeps the value in its form.
 */
export function TrPanelKindPicker({
  kinds,
  value,
  onChange,
  disabled = false,
}: {
  kinds: readonly TrProductKind[];
  value: string | null;
  onChange: (next: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const selected = kinds.find((kind) => kind.id === value) ?? null;
  const query = search.trim().toLocaleLowerCase("tr");
  const visible = query
    ? kinds.filter((kind) => kind.name.toLocaleLowerCase("tr").includes(query))
    : kinds;

  const openDrawer = () => {
    setDraft(selected?.id ?? null);
    setSearch("");
    setOpen(true);
  };
  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      {kinds.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-[15px] font-semibold text-neutral-900">
            Henüz ürün türü tanımlanmadı.
          </p>
          <p className={`mt-1 ${panelHintClass}`}>
            Önce Tanımlamalar &rsaquo; Ürün türleri&apos;nden bir tür ekleyin.
          </p>
          <Link href={trPanelProductKindsPath()} className={`${panelPrimaryBtnClass} mt-4`}>
            Ürün Türleri
          </Link>
        </div>
      ) : !selected ? (
        <div className="py-6 text-center">
          <p className="text-[15px] font-semibold text-neutral-900">
            Henüz bir ürün türü seçmediniz.
          </p>
          <p className={`mt-1 ${panelHintClass}`}>
            Tür, doldurulacak özellikleri belirler.
          </p>
          <button
            type="button"
            className={`${panelPrimaryBtnClass} mt-4`}
            onClick={openDrawer}
            disabled={disabled}
          >
            Ürün Türü Seç
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openDrawer}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--panel-accent-deep)] hover:underline disabled:opacity-50"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              Türü Değiştir
            </button>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3">
            <span className="min-w-0 flex-1 truncate text-[14px] text-neutral-900">
              {selected.name}
            </span>
            <span className="shrink-0 text-[12.5px] text-neutral-500">
              {selected.attributes.length} özellik
            </span>
            <TrPanelPopover
              label="Ürün türü işlemleri"
              align="end"
              panelClassName="w-48 p-1.5"
              trigger={(props) => (
                <button
                  type="button"
                  {...props}
                  aria-label="Ürün türü işlemleri"
                  disabled={disabled}
                  className="grid h-8 w-8 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-50"
                >
                  <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                </button>
              )}
            >
              {(close) => (
                <ul className="text-[14px] text-neutral-800">
                  <li>
                    <button
                      type="button"
                      className="flex min-h-10 w-full items-center rounded-md px-3 text-left hover:bg-neutral-50"
                      onClick={() => {
                        close();
                        openDrawer();
                      }}
                    >
                      Değiştir
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-red-700 hover:bg-red-50"
                      onClick={() => {
                        close();
                        onChange(null);
                      }}
                    >
                      Kaldır
                    </button>
                  </li>
                </ul>
              )}
            </TrPanelPopover>
          </div>
        </>
      )}

      <TrPanelDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Ürün Türü Seç"
        dirty={draft !== (selected?.id ?? null)}
        onSave={apply}
        saveLabel="Uygula"
      >
        <div className="space-y-4">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ürün türü ara"
            className={panelFieldClass}
            aria-label="Ürün türü ara"
          />
          {visible.length === 0 ? (
            <p className={panelHintClass}>Aramanıza uyan ürün türü yok.</p>
          ) : (
            <ul className="space-y-1" role="radiogroup" aria-label="Ürün türü">
              {visible.map((kind) => (
                <li key={kind.id}>
                  <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-neutral-50">
                    <input
                      type="radio"
                      name="product-kind"
                      checked={draft === kind.id}
                      onChange={() => setDraft(kind.id)}
                      className="h-4 w-4 accent-[color:var(--panel-accent)]"
                    />
                    <span className="min-w-0 flex-1 truncate text-[14px] text-neutral-900">
                      {kind.name}
                    </span>
                    <span className="shrink-0 text-[12.5px] text-neutral-500">
                      {kind.attributes.length} özellik
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <p className={panelHintClass}>
            Türü değiştirmek ürünün kayıtlı bilgilerini silmez; yalnızca hangi alanların
            gösterileceği değişir.
          </p>
        </div>
      </TrPanelDrawer>
    </div>
  );
}
