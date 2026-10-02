"use client";

import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import {
  TrPanelDataTable,
  TrPanelDataTableCell,
  TrPanelDataTableRow,
} from "@/components/tr/panel/TrPanelDataTable";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import {
  TrPanelFilterChips,
  TrPanelFilterClear,
  TrPanelFilterSelect,
  TrPanelTableToolbar,
} from "@/components/tr/panel/TrPanelTableToolbar";
import {
  TrPanelFadeIn,
  TrPanelListSkeleton,
} from "@/components/tr/panel/TrPanelMotion";
import {
  panelEmptyClass,
  panelErrorClass,
  panelHintClass,
  panelPrimaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { CATEGORY_SORT_OPTIONS, categorySortLabel } from "@/lib/tr/categories/sortCriteria";
import { visibleCategoryRows } from "@/lib/tr/categories/tree";
import type { TrCategoryListEntry } from "@/lib/tr/categories/types";
import { toast } from "@/lib/tr/panel/toast";
import {
  fetchOwnerCategories,
  importOwnerCategoryTemplate,
} from "@/lib/tr/ownerClient";
import {
  trPanelDefinitionsPath,
  trPanelEditCategoryPath,
  trPanelNewCategoryPath,
} from "@/lib/tr/paths";

type SortFilter = "all" | "default" | (typeof CATEGORY_SORT_OPTIONS)[number]["id"];
type ProductsFilter = "all" | "with" | "empty";

const SORT_FILTER_OPTIONS: ReadonlyArray<{ id: SortFilter; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "default", label: "Varsayılan (seçilmemiş)" },
  ...CATEGORY_SORT_OPTIONS,
];

const PRODUCTS_FILTER_OPTIONS: ReadonlyArray<{ id: ProductsFilter; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "with", label: "Ürünü olan" },
  { id: "empty", label: "Boş" },
];

interface Loaded {
  boutiqueId: string;
  categories: TrCategoryListEntry[];
  /** A fashion boutique with no categories yet can start from the fashion tree. */
  importable: boolean;
}

function CategoriesList({ boutiqueId }: { boutiqueId: string }) {
  const router = useRouter();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // Parent categories start collapsed; a chevron opens one.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [sortFilter, setSortFilter] = useState<SortFilter>("all");
  const [productsFilter, setProductsFilter] = useState<ProductsFilter>("all");
  const filterCount = (sortFilter !== "all" ? 1 : 0) + (productsFilter !== "all" ? 1 : 0);

  useEffect(() => {
    let cancelled = false;
    fetchOwnerCategories(boutiqueId)
      .then((result) => {
        if (!cancelled) {
          setError(null);
          setLoaded({ boutiqueId, ...result });
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Kategoriler yüklenemedi.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId, reloadKey]);

  const runImport = async () => {
    setImporting(true);
    try {
      const { created, assigned } = await importOwnerCategoryTemplate(boutiqueId);
      toast.success(`${created} kategori aktarıldı, ${assigned} ürün bağlandı.`);
      setReloadKey((key) => key + 1);
    } catch (importError) {
      toast.error(importError, "Hazır kategoriler aktarılamadı.");
    } finally {
      setImporting(false);
    }
  };

  const ready = loaded?.boutiqueId === boutiqueId ? loaded : null;
  const rows = useMemo(() => {
    if (!ready) return [];
    // Filters list their matches flat, like a search.
    const match =
      filterCount === 0
        ? undefined
        : (category: TrCategoryListEntry) =>
            (sortFilter === "all" ||
              (sortFilter === "default"
                ? category.sortCriterion == null
                : category.sortCriterion === sortFilter)) &&
            (productsFilter === "all" ||
              (productsFilter === "with" ? category.productCount > 0 : category.productCount === 0));
    return visibleCategoryRows(ready.categories, expanded, search, match);
  }, [ready, expanded, search, filterCount, sortFilter, productsFilter]);
  const parentIds = useMemo(
    () =>
      new Set(
        (ready?.categories ?? [])
          .map((category) => category.parentId)
          .filter((id): id is string => Boolean(id)),
      ),
    [ready],
  );
  const allExpanded = parentIds.size > 0 && [...parentIds].every((id) => expanded.has(id));

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const header = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={trPanelDefinitionsPath()}
          aria-label="Tanımlamalar sayfasına dön"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors duration-150 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] motion-reduce:transition-none"
        >
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        </Link>
        <h2 className="truncate text-[1.25rem] font-semibold tracking-tight text-neutral-900 sm:text-[1.375rem]">
          Kategoriler
        </h2>
      </div>
      {ready ? (
        <Link href={trPanelNewCategoryPath()} className={panelPrimaryBtnClass}>
          Kategori Ekle
        </Link>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-5">
      {header}

      {error && !ready ? (
        <p className={panelErrorClass}>{error}</p>
      ) : !ready ? (
        <TrPanelListSkeleton rows={4} label="Kategoriler yükleniyor" />
      ) : ready.importable ? (
        <TrPanelFadeIn>
          <div className={panelEmptyClass}>
            <p className="font-semibold text-neutral-900">
              Henüz kategori eklemediniz.
            </p>
            <p className={`mt-1 ${panelHintClass}`}>
              Hazır moda kategorileriyle başlayabilirsiniz (elbise, üst giyim, alt
              giyim…); mevcut ürünler bugünkü kategorilerine bağlanır. Sonra
              istediğiniz gibi düzenleyebilir veya kendi kategorilerinizi
              ekleyebilirsiniz.
            </p>
            <button
              type="button"
              className={`${panelPrimaryBtnClass} mt-4`}
              disabled={importing}
              onClick={() => void runImport()}
            >
              {importing ? "Aktarılıyor…" : "Hazır kategorileri içe aktar"}
            </button>
          </div>
        </TrPanelFadeIn>
      ) : ready.categories.length === 0 ? (
        <TrPanelFadeIn>
          <div className={panelEmptyClass}>
            <p className="font-semibold text-neutral-900">
              Henüz kategori eklemediniz.
            </p>
            <p className={`mt-1 ${panelHintClass}`}>
              Ürünlerinize ait kategorileri girin.
            </p>
            <Link
              href={trPanelNewCategoryPath()}
              className={`${panelPrimaryBtnClass} mt-4`}
            >
              Kategori Ekle
            </Link>
          </div>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn className="space-y-3" shift={false}>
          <TrPanelTableToolbar
            search={search}
            onSearchChange={setSearch}
            searchLabel="Kategorilerde ara"
            filterCount={filterCount}
            filters={
              <div className="space-y-4">
                <TrPanelFilterSelect
                  label="Sıralama ölçütü"
                  options={SORT_FILTER_OPTIONS}
                  value={sortFilter}
                  onChange={setSortFilter}
                />
                <TrPanelFilterChips
                  label="Ürünler"
                  options={PRODUCTS_FILTER_OPTIONS}
                  value={productsFilter}
                  onChange={setProductsFilter}
                />
                <TrPanelFilterClear
                  active={filterCount > 0}
                  onClear={() => {
                    setSortFilter("all");
                    setProductsFilter("all");
                  }}
                />
              </div>
            }
          >
            {parentIds.size > 0 && !search.trim() && filterCount === 0 ? (
              <button
                type="button"
                onClick={() => setExpanded(allExpanded ? new Set() : new Set(parentIds))}
                className="text-[13px] font-semibold text-[color:var(--panel-accent-deep)] hover:underline"
              >
                {allExpanded ? "Tümünü daralt" : "Tümünü genişlet"}
              </button>
            ) : null}
          </TrPanelTableToolbar>

          <TrPanelDataTable
            contained={false}
            headers={["Ad", "Sıralama Ölçütü", <span key="n" className="block text-right">Ürünler</span>]}
            empty={rows.length === 0 ? "Aramanıza veya filtrelere uyan kategori yok." : undefined}
            footer={`${ready.categories.length} kategori`}
          >
            {rows.map(({ category, depth, hasChildren, parentPath }) => {
              const href = trPanelEditCategoryPath(category.id);
              const open = expanded.has(category.id);
              return (
                <TrPanelDataTableRow
                  key={category.id}
                  onActivate={() => router.push(href)}
                  onPointerEnter={() => router.prefetch(href)}
                >
                  <TrPanelDataTableCell>
                    <div
                      className="flex items-center gap-1.5"
                      style={{ paddingLeft: `${depth * 24}px` }}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggle(category.id)}
                          aria-expanded={open}
                          aria-label={`${category.name} alt kategorilerini ${open ? "gizle" : "göster"}`}
                          className="grid h-6 w-6 shrink-0 place-items-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                        >
                          {open ? (
                            <ChevronDown className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                          ) : (
                            <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                          )}
                        </button>
                      ) : (
                        <span className="w-6 shrink-0" aria-hidden />
                      )}
                      <span className="min-w-0">
                        <Link
                          href={href}
                          className="block truncate text-[14px] text-neutral-900 hover:underline"
                        >
                          {category.name}
                        </Link>
                        {parentPath ? (
                          <span className="block truncate text-[12.5px] text-neutral-500">
                            {parentPath}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </TrPanelDataTableCell>
                  <TrPanelDataTableCell className="text-neutral-600">
                    {categorySortLabel(category.sortCriterion) || "—"}
                  </TrPanelDataTableCell>
                  <TrPanelDataTableCell className="text-right text-neutral-600 tabular-nums">
                    {category.productCount} ürün
                  </TrPanelDataTableCell>
                </TrPanelDataTableRow>
              );
            })}
          </TrPanelDataTable>
        </TrPanelFadeIn>
      )}
    </div>
  );
}

export function TrOwnerCategoriesPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <CategoriesList boutiqueId={activeBoutique.id} />
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}
