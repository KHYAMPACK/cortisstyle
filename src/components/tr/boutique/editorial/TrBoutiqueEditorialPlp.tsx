"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { TrBoutiqueAtelierPlp } from "@/components/tr/boutique/editorial/TrBoutiqueAtelierPlp";
import { TrBoutiqueEditorialProductCard } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialProductCard";
import { isAtelierEditorialSkin } from "@/lib/tr/boutiqueHome";
import { getTrCategoryLabel, isTrCategoryMatch } from "@/lib/tr/categories";
import { trBoutiquePath, trBoutiqueProductsPath } from "@/lib/tr/paths";
import { resolveProductColors } from "@/lib/tr/productOptions";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

type SortId = "default" | "price-asc" | "price-desc" | "new";

interface TrBoutiqueEditorialPlpProps {
  boutique: TrBoutiquePublic;
  products: TrProduct[];
}

function breadcrumbLabel(kategori: string | null, sale: boolean): string {
  if (sale) return "İndirim";
  if (!kategori) return "Tüm ürünler";
  return (getTrCategoryLabel(kategori) ?? kategori).toLocaleUpperCase("tr");
}

function isOnSale(product: TrProduct): boolean {
  return (
    typeof product.compareAtPriceKurus === "number" &&
    product.compareAtPriceKurus > product.priceKurus
  );
}

export function TrBoutiqueEditorialPlp({
  boutique,
  products,
}: TrBoutiqueEditorialPlpProps) {
  if (isAtelierEditorialSkin(boutique.slug)) {
    return <TrBoutiqueAtelierPlp boutique={boutique} products={products} />;
  }

  return (
    <TrBoutiqueClassicEditorialPlp boutique={boutique} products={products} />
  );
}

function TrBoutiqueClassicEditorialPlp({
  boutique,
  products,
}: TrBoutiqueEditorialPlpProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const kategori = searchParams.get("kategori")?.trim() || null;
  const saleOnly = searchParams.get("indirim") === "1" || kategori === "sale";
  const categoryFilter = saleOnly
    ? null
    : kategori === "sale"
      ? null
      : kategori;
  const q = searchParams.get("q")?.trim().toLocaleLowerCase("tr") || "";
  const renkParam = searchParams.get("renk")?.trim() || "";
  const siraParam = (searchParams.get("sira")?.trim() || "default") as SortId;

  const [renkOpen, setRenkOpen] = useState(false);
  const [filtreOpen, setFiltreOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(
    searchParams.get("q")?.trim() ?? "",
  );

  // Keep draft in sync when URL changes (nav / clear)
  useEffect(() => {
    setSearchDraft(searchParams.get("q")?.trim() ?? "");
  }, [searchParams]);

  const colorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) {
      for (const color of resolveProductColors(product)) {
        if (!map.has(color.name)) map.set(color.name, color.hex);
      }
    }
    return [...map.entries()]
      .map(([name, hex]) => ({ name, hex }))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [products]);

  const categoryOptions = useMemo(() => {
    const ids = new Set(
      products
        .map((p) => p.category?.trim())
        .filter((value): value is string => Boolean(value)),
    );
    return [...ids]
      .map((id) => ({ id, label: getTrCategoryLabel(id) ?? id }))
      .sort((a, b) => a.label.localeCompare(b.label, "tr"));
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.status === "available");

    if (saleOnly) {
      list = list.filter(isOnSale);
    } else if (categoryFilter) {
      list = list.filter((p) =>
        isTrCategoryMatch(p.category, categoryFilter),
      );
    }

    if (q) {
      list = list.filter((p) =>
        p.title.toLocaleLowerCase("tr").includes(q),
      );
    }

    if (renkParam) {
      list = list.filter((p) =>
        resolveProductColors(p).some((c) => c.name === renkParam),
      );
    }

    const sorted = [...list];
    switch (siraParam) {
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
  }, [categoryFilter, products, q, renkParam, saleOnly, siraParam]);

  const replaceParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const crumb = breadcrumbLabel(
    saleOnly ? null : categoryFilter,
    saleOnly,
  );

  return (
    <div className="bg-white pb-16">
      <div className="px-5 pt-8 text-center md:px-8 md:pt-10">
        <nav
          aria-label="Sayfa yolu"
          className="text-[11px] tracking-[0.2em] text-neutral-500 uppercase"
        >
          <Link
            href={trBoutiquePath(boutique.slug)}
            className="transition-opacity hover:opacity-60"
          >
            Anasayfa
          </Link>
          <span className="mx-2 text-neutral-300">|</span>
          <span className="text-neutral-900">{crumb}</span>
        </nav>

        <form
          className="mx-auto mt-6 flex w-full max-w-xl gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            replaceParams({ q: searchDraft.trim() || null });
          }}
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Ürün ara</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
              strokeWidth={1.5}
            />
            <input
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Ara"
              className="w-full border border-neutral-300 bg-white py-3 pr-3 pl-10 text-[14px] outline-none focus:border-neutral-900"
            />
          </label>
          <button
            type="submit"
            className="bg-neutral-900 px-5 py-3 text-[11px] tracking-[0.14em] text-white uppercase"
          >
            Ara
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 border-y border-black/5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex flex-wrap items-center gap-4 text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setRenkOpen((open) => !open);
                  setFiltreOpen(false);
                }}
                className="inline-flex items-center gap-1 transition-opacity hover:opacity-60"
                aria-expanded={renkOpen}
              >
                Renk
                <span aria-hidden className="text-[9px]">
                  ▾
                </span>
              </button>
              {renkOpen ? (
                <div className="absolute top-full left-0 z-20 mt-2 min-w-[160px] border border-black/10 bg-white py-2 text-left shadow-sm">
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-[11px] tracking-[0.08em] hover:bg-neutral-50"
                    onClick={() => {
                      replaceParams({ renk: null });
                      setRenkOpen(false);
                    }}
                  >
                    Tümü
                  </button>
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] tracking-[0.08em] hover:bg-neutral-50 ${
                        renkParam === color.name ? "font-semibold" : ""
                      }`}
                      onClick={() => {
                        replaceParams({ renk: color.name });
                        setRenkOpen(false);
                      }}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-black/15"
                        style={{ backgroundColor: color.hex }}
                        aria-hidden
                      />
                      {color.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setFiltreOpen((open) => !open);
                  setRenkOpen(false);
                }}
                className="inline-flex items-center gap-1 transition-opacity hover:opacity-60"
                aria-expanded={filtreOpen}
              >
                Filtreler
                <span aria-hidden className="text-[9px]">
                  ▾
                </span>
              </button>
              {filtreOpen ? (
                <div className="absolute top-full left-0 z-20 mt-2 min-w-[180px] border border-black/10 bg-white py-2 text-left shadow-sm">
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-[11px] tracking-[0.08em] hover:bg-neutral-50"
                    onClick={() => {
                      replaceParams({
                        kategori: null,
                        indirim: null,
                      });
                      setFiltreOpen(false);
                    }}
                  >
                    Tüm ürünler
                  </button>
                  <button
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-[11px] tracking-[0.08em] hover:bg-neutral-50 ${
                      saleOnly ? "font-semibold" : ""
                    }`}
                    onClick={() => {
                      replaceParams({
                        kategori: null,
                        indirim: "1",
                      });
                      setFiltreOpen(false);
                    }}
                  >
                    İndirimdekiler
                  </button>
                  <button
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-[11px] tracking-[0.08em] hover:bg-neutral-50 ${
                      siraParam === "new" && !saleOnly && !categoryFilter
                        ? "font-semibold"
                        : ""
                    }`}
                    onClick={() => {
                      replaceParams({
                        kategori: null,
                        indirim: null,
                        sira: "new",
                      });
                      setFiltreOpen(false);
                    }}
                  >
                    Yeni ürünler
                  </button>
                  <div className="my-1 border-t border-black/5" />
                  {categoryOptions.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className={`block w-full px-3 py-2 text-left text-[11px] tracking-[0.08em] hover:bg-neutral-50 ${
                        categoryFilter === entry.id ? "font-semibold" : ""
                      }`}
                      onClick={() => {
                        replaceParams({
                          kategori: entry.id,
                          indirim: null,
                        });
                        setFiltreOpen(false);
                      }}
                    >
                      {entry.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {renkParam || saleOnly || categoryFilter || q ? (
              <Link
                href={trBoutiqueProductsPath(boutique.slug)}
                className="normal-case tracking-normal text-neutral-500 underline-offset-2 hover:underline"
              >
                Temizle
              </Link>
            ) : null}
          </div>

          <label className="flex items-center justify-center gap-2 text-[11px] text-neutral-600 sm:justify-end">
            <span className="sr-only">Sıralama</span>
            <select
              value={siraParam}
              onChange={(event) =>
                replaceParams({
                  sira:
                    event.target.value === "default"
                      ? null
                      : event.target.value,
                })
              }
              className="border border-neutral-200 bg-white px-2 py-1.5 text-[11px] tracking-[0.06em] outline-none focus:border-neutral-900"
            >
              <option value="default">Sıralama Seçiniz</option>
              <option value="new">En yeniler</option>
              <option value="price-asc">Fiyat: düşükten yükseğe</option>
              <option value="price-desc">Fiyat: yüksekten düşüğe</option>
            </select>
          </label>
        </div>

        <p className="mt-4 text-[12px] tracking-[0.08em] text-neutral-500">
          {filtered.length} Ürün
          {q ? ` · “${q}”` : ""}
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-x-2 gap-y-6 px-3 md:gap-x-4 md:px-6 lg:grid-cols-4 lg:px-8">
          {filtered.map((product, index) => (
            <TrBoutiqueEditorialProductCard
              key={product.id}
              product={product}
              boutiqueSlug={boutique.slug}
              boutiqueName={boutique.name}
              priority={index < 4}
            />
          ))}
        </div>
      ) : (
        <p className="mt-10 px-5 text-center text-[13px] text-neutral-600 md:px-8">
          Bu filtrede ürün bulunamadı.
        </p>
      )}
    </div>
  );
}
