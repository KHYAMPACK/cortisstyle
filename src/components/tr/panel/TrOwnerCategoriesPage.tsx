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
import type {
  TrCategoryListEntry,
  TrCategoryMode,
} from "@/lib/tr/categories/types";
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
  mode: TrCategoryMode;
  categories: TrCategoryListEntry[];
  /** The built-in tree can be imported ("Hazır kategorileri içe aktar"). */
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
  // Imported but not switched over yet: the list is shown, not edited.
  const editable = ready?.mode === "custom";
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
        {ready?.mode === "custom" ? (
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
      ) : ready.mode !== "custom" && ready.importable ? (
        <TrPanelFadeIn>
          <div className={panelEmptyClass}>
            <p className="font-semibold text-neutral-900">
              Bu butik hazır kategori ağacını kullanıyor.
            </p>
            <p className={`mt-1 ${panelHintClass}`}>
              Hazır ağacı bu butiğin kendi kategorileri olarak içe aktarabilirsiniz;
              her ürün bugünkü kategorisine bağlanır. Mağaza bu adımla değişmez:
              kendi kategorilerine geçiş ayrıca yapılır.
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
      ) : ready.mode !== "custom" && ready.categories.length === 0 ? (
        <TrPanelFadeIn>
          <div className={panelEmptyClass}>
            <p className="font-semibold text-neutral-900">
              Bu butik hazır kategori ağacını kullanıyor.
            </p>
            <p className={`mt-1 ${panelHintClass}`}>
              Özel kategoriler bu butik için etkin değil. Etkinleştirmek için destek
              ekibiyle iletişime geçin.
            </p>
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
          {ready.mode !== "custom" ? (
            <p className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-950`}>
              Kategoriler içe aktarıldı. Mağaza, kendi kategorilerine geçilene kadar
              hazır ağacı kullanmaya devam eder; o zamana kadar bu liste yalnızca
              görüntülenir.
            </p>
          ) : null}
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
                      if (!editable) return;
                      if ((event.target as HTMLElement).closest("a")) return;
                      router.push(trPanelEditCategoryPath(category.id));
                    }}
                    onPointerEnter={() => {
                      if (editable) router.prefetch(trPanelEditCategoryPath(category.id));
                    }}
                    className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_16rem_6rem] ${
                      editable
                        ? "cursor-pointer transition-colors duration-150 hover:bg-[color:var(--panel-accent-soft)]/60 motion-reduce:transition-none"
                        : ""
                    }`}
                  >
                    <span
                      className="min-w-0 truncate"
                      style={{ paddingLeft: `${depth * 20}px` }}
                    >
                      {editable ? (
                        <Link
                          href={trPanelEditCategoryPath(category.id)}
                          className="text-[14px] font-semibold text-neutral-900 hover:underline"
                        >
                          {category.name}
                        </Link>
                      ) : (
                        <span className="text-[14px] font-semibold text-neutral-900">
                          {category.name}
                        </span>
                      )}
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
