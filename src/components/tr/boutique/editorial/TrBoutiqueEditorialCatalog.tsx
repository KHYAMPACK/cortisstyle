"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TrBoutiqueEditorialProductCard } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialProductCard";
import { useTrBoutiqueCatalog } from "@/components/tr/boutique/TrBoutiqueCatalogContext";
import { isAtelierEditorialSkin } from "@/lib/tr/boutiqueHome";
import { getTrCategoryLabel, isTrCategoryMatch } from "@/lib/tr/categories";
import { trBoutiqueProductsPath } from "@/lib/tr/paths";
import type { TrProduct } from "@/types/tr-marketplace";

type SortId = "default" | "price-asc" | "price-desc" | "new";

interface TrBoutiqueEditorialCatalogProps {
  products: TrProduct[];
  boutiqueSlug: string;
  boutiqueName: string;
}

function filterLabel(categoryId: string | null): string {
  if (!categoryId) return "Tüm ürünler";
  if (categoryId === "sale") return "İndirim";
  return getTrCategoryLabel(categoryId) ?? categoryId;
}

export function TrBoutiqueEditorialCatalog({
  products,
  boutiqueSlug,
  boutiqueName,
}: TrBoutiqueEditorialCatalogProps) {
  const atelier = isAtelierEditorialSkin(boutiqueSlug);
  const { activeCategory, selectCategory, registerCatalogElement } =
    useTrBoutiqueCatalog();
  const [sort, setSort] = useState<SortId>("default");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const onSearch = (event: Event) => {
      const detail = (event as CustomEvent<{ q: string }>).detail;
      setSearchQuery(detail?.q ?? "");
      setSort("default");
    };
    window.addEventListener("tr-editorial-search", onSearch);
    return () => window.removeEventListener("tr-editorial-search", onSearch);
  }, []);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.status === "available");

    if (activeCategory === "sale") {
      list = list.filter(
        (p) =>
          typeof p.compareAtPriceKurus === "number" &&
          p.compareAtPriceKurus > p.priceKurus,
      );
    } else if (activeCategory) {
      list = list.filter((p) =>
        isTrCategoryMatch(p.category, activeCategory),
      );
    }

    if (searchQuery) {
      list = list.filter((p) =>
        p.title.toLocaleLowerCase("tr").includes(searchQuery),
      );
    }

    const sorted = [...list];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.priceKurus - b.priceKurus);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.priceKurus - a.priceKurus);
        break;
      case "new":
        sorted.sort((a, b) => {
          const aNew = a.conditionLabel?.includes("Yeni") ? 1 : 0;
          const bNew = b.conditionLabel?.includes("Yeni") ? 1 : 0;
          if (aNew !== bNew) return bNew - aNew;
          return a.sortOrder - b.sortOrder;
        });
        break;
      default:
        sorted.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return sorted;
  }, [activeCategory, products, searchQuery, sort]);

  const plpHref = trBoutiqueProductsPath(boutiqueSlug, {
    ...(activeCategory === "sale" ? { indirim: true } : {}),
    ...(activeCategory && activeCategory !== "sale"
      ? { kategori: activeCategory }
      : {}),
    ...(searchQuery ? { q: searchQuery } : {}),
    ...(sort !== "default" ? { sira: sort } : {}),
  });

  return (
    <section
      ref={registerCatalogElement}
      id="katalog"
      aria-label="Ürün kataloğu"
      className="scroll-mt-20 border-t border-black/5 pb-16"
    >
      <div className="px-5 pt-10 text-center md:px-8 md:pt-12">
        {atelier ? (
          <>
            <h2 className="font-serif text-[1.75rem] font-light tracking-[-0.01em] text-neutral-950 md:text-[2.15rem]">
              Ürünler
            </h2>
            <div className="mt-3 flex justify-center">
              <Link
                href={plpHref}
                className="text-[11px] tracking-[0.18em] text-neutral-600 uppercase underline-offset-[6px] transition-colors hover:text-neutral-950 hover:underline"
              >
                Tümünü gör
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-[11px] tracking-[0.2em] text-neutral-500 uppercase">
              Anasayfa
              {activeCategory ? ` | ${filterLabel(activeCategory)}` : ""}
            </p>

            <div className="mt-4 flex justify-center">
              <Link
                href={plpHref}
                className="text-[11px] tracking-[0.14em] text-neutral-900 uppercase underline-offset-4 hover:underline"
              >
                Tüm ürünleri gör →
              </Link>
            </div>
          </>
        )}

        <div className="mt-6 flex flex-col items-stretch justify-between gap-3 border-y border-black/5 py-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2 text-[11px] tracking-[0.1em] text-neutral-600 uppercase">
            <span>Kategoriler</span>
            <span className="text-neutral-300">|</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                selectCategory(null, { scroll: false });
              }}
              className={
                !activeCategory ? "text-neutral-900" : "hover:text-neutral-900"
              }
            >
              Tümü
            </button>
            {searchQuery ? (
              <>
                <span className="text-neutral-300">|</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="normal-case tracking-normal text-neutral-900 underline-offset-2 hover:underline"
                >
                  “{searchQuery}” temizle
                </button>
              </>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-[11px] text-neutral-600">
            <span className="sr-only">Sıralama</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortId)}
              className="border border-neutral-200 bg-white px-2 py-1.5 text-[11px] tracking-[0.06em] outline-none focus:border-neutral-900"
            >
              <option value="default">Sıralama seçiniz</option>
              <option value="new">En yeniler</option>
              <option value="price-asc">Fiyat: düşükten yükseğe</option>
              <option value="price-desc">Fiyat: yüksekten düşüğe</option>
            </select>
          </label>
        </div>

        <p className="mt-4 text-[12px] tracking-[0.08em] text-neutral-500">
          {filtered.length} ürün
          {activeCategory ? ` · ${filterLabel(activeCategory)}` : ""}
        </p>
      </div>

      {filtered.length > 0 ? (
        <div
          className={`mt-6 grid grid-cols-2 px-3 md:grid-cols-3 md:px-6 lg:grid-cols-4 lg:px-8 ${
            atelier
              ? "gap-x-3 gap-y-10 md:gap-x-6 md:gap-y-14"
              : "gap-x-2 gap-y-6 md:gap-x-4"
          }`}
        >          {filtered.map((product, index) => (
            <TrBoutiqueEditorialProductCard
              key={product.id}
              product={product}
              boutiqueSlug={boutiqueSlug}
              boutiqueName={boutiqueName}
              priority={index < 4}
            />
          ))}
        </div>
      ) : (
        <p className="mt-10 px-5 text-center text-[13px] text-neutral-600 md:px-8">
          Bu filtrede ürün bulunamadı.
        </p>
      )}
    </section>
  );
}
