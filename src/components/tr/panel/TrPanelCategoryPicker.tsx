"use client";

import { MoreHorizontal, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { TrPanelDrawer } from "@/components/tr/panel/TrPanelDrawer";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { TrPanelPopover } from "@/components/tr/panel/TrPanelPopover";
import {
  panelFieldClass,
  panelHintClass,
  panelPrimaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { categoryPathLabel, flattenCategoryTree } from "@/lib/tr/categories/tree";
import type {
  TrCategoryListEntry,
  TrProductCategories,
} from "@/lib/tr/categories/types";
import { trPanelNewCategoryPath } from "@/lib/tr/paths";

/**
 * A product's categories: the assigned ones with an "Ana Kategori" badge, and a
 * drawer ("Kategorileri Düzenle") with the whole tree to tick from. Controlled — the
 * page keeps the value in its form and saves it with the product.
 */
export function TrPanelCategoryPicker({
  categories,
  value,
  onChange,
  disabled = false,
}: {
  categories: TrCategoryListEntry[];
  value: TrProductCategories;
  onChange: (next: TrProductCategories) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const known = useMemo(() => new Set(categories.map((entry) => entry.id)), [categories]);
  // A category deleted elsewhere can linger in the value; only show what still exists.
  const assigned = value.ids.filter((id) => known.has(id));

  const rows = useMemo(() => flattenCategoryTree(categories), [categories]);
  const query = search.trim().toLocaleLowerCase("tr");
  const visibleRows = query
    ? rows.filter(({ category }) =>
        categoryPathLabel(categories, category.id)
          .toLocaleLowerCase("tr")
          .includes(query),
      )
    : rows;

  const openDrawer = () => {
    setDraft(assigned);
    setSearch("");
    setOpen(true);
  };

  const apply = () => {
    const primaryId =
      value.primaryId && draft.includes(value.primaryId)
        ? value.primaryId
        : (draft[0] ?? null);
    onChange({ ids: draft, primaryId });
    setOpen(false);
  };

  const dirty =
    draft.length !== assigned.length || draft.some((id) => !assigned.includes(id));

  const makePrimary = (id: string) => onChange({ ids: assigned, primaryId: id });
  const remove = (id: string) => {
    const ids = assigned.filter((entry) => entry !== id);
    onChange({
      ids,
      primaryId: value.primaryId === id ? (ids[0] ?? null) : value.primaryId,
    });
  };

  return (
    <div className="space-y-4">
      {categories.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-[15px] font-semibold text-neutral-900">
            Henüz kategori tanımlanmadı.
          </p>
          <p className={`mt-1 ${panelHintClass}`}>
            Önce Tanımlamalar &rsaquo; Kategoriler&apos;den bir kategori ekleyin.
          </p>
          <Link
            href={trPanelNewCategoryPath()}
            className={`${panelPrimaryBtnClass} mt-4`}
          >
            Kategori Ekle
          </Link>
        </div>
      ) : assigned.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-[15px] font-semibold text-neutral-900">
            Henüz bir kategori eklemediniz.
          </p>
          <p className={`mt-1 ${panelHintClass}`}>
            Ürünlerinize ait kategorileri girin.
          </p>
          <button
            type="button"
            className={`${panelPrimaryBtnClass} mt-4`}
            onClick={openDrawer}
            disabled={disabled}
          >
            Kategori Ekle
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
              Kategorileri Düzenle
            </button>
          </div>
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
            {assigned.map((id) => {
              const primary = id === value.primaryId;
              return (
                <li key={id} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1 truncate text-[14px] text-neutral-900">
                    {categoryPathLabel(categories, id)}
                  </span>
                  {primary ? (
                    <span className="shrink-0 rounded-md border border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-soft)] px-2 py-0.5 text-[12px] font-semibold text-[color:var(--panel-accent-deep)]">
                      Ana Kategori
                    </span>
                  ) : null}
                  <TrPanelPopover
                    label="Kategori işlemleri"
                    align="end"
                    panelClassName="w-48 p-1.5"
                    trigger={(props) => (
                      <button
                        type="button"
                        {...props}
                        aria-label="Kategori işlemleri"
                        disabled={disabled}
                        className="grid h-8 w-8 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-50"
                      >
                        <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                      </button>
                    )}
                  >
                    {(close) => (
                      <ul className="text-[14px] text-neutral-800">
                        {primary ? null : (
                          <li>
                            <button
                              type="button"
                              className="flex min-h-10 w-full items-center rounded-md px-3 text-left hover:bg-neutral-50"
                              onClick={() => {
                                close();
                                makePrimary(id);
                              }}
                            >
                              Ana kategori yap
                            </button>
                          </li>
                        )}
                        <li>
                          <button
                            type="button"
                            className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-red-700 hover:bg-red-50"
                            onClick={() => {
                              close();
                              remove(id);
                            }}
                          >
                            Kaldır
                          </button>
                        </li>
                      </ul>
                    )}
                  </TrPanelPopover>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <TrPanelDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Kategorileri Düzenle"
        dirty={dirty}
        onSave={apply}
        saveLabel="Uygula"
      >
        <div className="space-y-4">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Kategori ara"
            className={panelFieldClass}
            aria-label="Kategori ara"
          />
          {visibleRows.length === 0 ? (
            <p className={panelHintClass}>Aramanıza uyan kategori yok.</p>
          ) : (
            <ul className="space-y-1">
              {visibleRows.map(({ category, depth }) => {
                const checked = draft.includes(category.id);
                return (
                  <li key={category.id}>
                    <label
                      className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-neutral-50"
                      style={{ paddingLeft: `${8 + (query ? 0 : depth * 20)}px` }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setDraft((current) =>
                            checked
                              ? current.filter((id) => id !== category.id)
                              : [...current, category.id],
                          )
                        }
                        className="h-4 w-4 accent-[color:var(--panel-accent)]"
                      />
                      <span className="min-w-0 flex-1 truncate text-[14px] text-neutral-900">
                        {query
                          ? categoryPathLabel(categories, category.id)
                          : category.name}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </TrPanelDrawer>
    </div>
  );
}
