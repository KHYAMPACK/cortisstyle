"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import {
  TrPanelFadeIn,
  TrPanelListSkeleton,
} from "@/components/tr/panel/TrPanelMotion";
import {
  panelBackLinkClass,
  panelEmptyClass,
  panelErrorClass,
  panelFieldClass,
  panelHintClass,
  panelPrimaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { categorySortLabel } from "@/lib/tr/categories/sortCriteria";
import { flattenCategoryTree } from "@/lib/tr/categories/tree";
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
  const query = search.trim().toLocaleLowerCase("tr");
  const rows = useMemo(() => {
    if (!ready) return [];
    const tree = flattenCategoryTree(ready.categories);
    if (!query) return tree;
    // While searching, show the matches flat: their parents may not match.
    return tree
      .filter(({ category }) =>
        category.name.toLocaleLowerCase("tr").includes(query),
      )
      .map((row) => ({ ...row, depth: 0 }));
  }, [ready, query]);

  const header = (
    <div className="space-y-1">
      <Link href={trPanelDefinitionsPath()} className={panelBackLinkClass}>
        ← Tanımlamalar
      </Link>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[1.25rem] font-semibold tracking-tight text-neutral-900 sm:text-[1.375rem]">
          Kategoriler
        </h2>
        {ready ? (
          <Link href={trPanelNewCategoryPath()} className={panelPrimaryBtnClass}>
            Kategori Ekle
          </Link>
        ) : null}
      </div>
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
          <div className="relative max-w-sm">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tabloda arama yapın"
              className={`${panelFieldClass} pl-9`}
              aria-label="Kategorilerde ara"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="hidden grid-cols-[minmax(0,1fr)_16rem_6rem] gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[12px] font-semibold tracking-wide text-neutral-500 lg:grid">
              <span>Ad</span>
              <span>Sıralama Ölçütü</span>
              <span className="text-right">Ürünler</span>
            </div>
            {rows.length === 0 ? (
              <p className="px-4 py-10 text-center text-[14px] text-neutral-500">
                Aramanıza uyan kategori yok.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {rows.map(({ category, depth }) => (
                  <li
                    key={category.id}
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest("a")) return;
                      router.push(trPanelEditCategoryPath(category.id));
                    }}
                    onPointerEnter={() =>
                      router.prefetch(trPanelEditCategoryPath(category.id))
                    }
                    className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 px-4 py-3 transition-colors duration-150 hover:bg-[color:var(--panel-accent-soft)]/60 motion-reduce:transition-none lg:grid-cols-[minmax(0,1fr)_16rem_6rem]"
                  >
                    <span
                      className="min-w-0 truncate"
                      style={{ paddingLeft: `${depth * 20}px` }}
                    >
                      <Link
                        href={trPanelEditCategoryPath(category.id)}
                        className="text-[14px] font-semibold text-neutral-900 hover:underline"
                      >
                        {category.name}
                      </Link>
                    </span>
                    <span className="text-right text-[13px] text-neutral-600 tabular-nums lg:order-3">
                      {category.productCount} ürün
                    </span>
                    <span className="col-span-2 text-[13px] text-neutral-500 lg:order-2 lg:col-span-1">
                      {categorySortLabel(category.sortCriterion) || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
