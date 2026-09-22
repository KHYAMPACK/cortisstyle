"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { TrNewTenantProductCard } from "@/components/tr/boutique/newtenant/TrNewTenantProductCard";
import { isTrCategoryMatch } from "@/lib/tr/categories";
import { resolveProductColors } from "@/lib/tr/productOptions";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

/**
 * Product listing page — structural match for PopSockets' "Grips"
 * category page (big centered title, sort/filter bar with result
 * count, 4-col grid with bag/heart icons overlaid on the image).
 * Bespoke to this tenant like the header/home/PDP — does not reuse
 * TrBoutiqueEditorialPlp's classic/atelier layouts.
 */
interface TrNewTenantPlpProps {
  boutique: TrBoutiquePublic;
  products: TrProduct[];
}

type SortId = "default" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortId, string> = {
  default: "Önerilen",
  "price-asc": "Fiyat: Artan",
  "price-desc": "Fiyat: Azalan",
};

const CATEGORY_TITLES: Record<string, string> = {
  "magsafe-tutucu": "MagSafe Tutucular",
  "ozel-tasarim": "Kendi Tasarımını Yap",
};

export function TrNewTenantPlp({ boutique, products }: TrNewTenantPlpProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const kategori = searchParams.get("kategori")?.trim() || null;
  const q = searchParams.get("q")?.trim().toLocaleLowerCase("tr") || "";
  const renkParam = searchParams.get("renk")?.trim() || "";
  const siraParam = (searchParams.get("sira")?.trim() || "default") as SortId;

  const [sortOpen, setSortOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);

  const colorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) {
      for (const color of resolveProductColors(product)) {
        if (!map.has(color.name)) map.set(color.name, color.hex);
      }
    }
    return [...map.entries()].map(([name, hex]) => ({ name, hex }));
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.status === "available");
    if (kategori) list = list.filter((p) => isTrCategoryMatch(p.category, kategori));
    if (q) list = list.filter((p) => p.title.toLocaleLowerCase("tr").includes(q));
    if (renkParam) {
      list = list.filter((p) =>
        resolveProductColors(p).some((c) => c.name === renkParam),
      );
    }
    const sorted = [...list];
    if (siraParam === "price-asc") sorted.sort((a, b) => a.priceKurus - b.priceKurus);
    else if (siraParam === "price-desc") sorted.sort((a, b) => b.priceKurus - a.priceKurus);
    else sorted.sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted;
  }, [kategori, products, q, renkParam, siraParam]);

  const replaceParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const title = kategori ? CATEGORY_TITLES[kategori] ?? "Tutucular" : "Tüm Tutucular";

  return (
    <div className="bg-white pb-16">
      <h1 className="pt-10 text-center text-[36px] font-bold tracking-tight text-[#171717] md:pt-14 md:text-[48px]">
        {title}
      </h1>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-3 border-y border-[#E5E5E5] px-5 py-3 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="flex items-center gap-5 text-[13px] font-semibold text-[#171717]">
          <div
            className="relative"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setSortOpen(false);
            }}
          >
            <button
              type="button"
              onClick={() => {
                setSortOpen((v) => !v);
                setColorOpen(false);
              }}
              className="inline-flex items-center gap-1 transition-opacity hover:opacity-60"
            >
              Sırala <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
            {sortOpen ? (
              <div className="absolute left-0 top-full z-20 mt-2 min-w-[160px] rounded-lg border border-[#E5E5E5] bg-white py-2 shadow-lg">
                {(Object.keys(SORT_LABELS) as SortId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      replaceParams({ sira: id === "default" ? null : id });
                      setSortOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-[13px] font-medium text-[#171717] hover:bg-[#FAFAFA]"
                  >
                    {SORT_LABELS[id]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {colorOptions.length > 0 ? (
            <div
              className="relative"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setColorOpen(false);
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setColorOpen((v) => !v);
                  setSortOpen(false);
                }}
                className="inline-flex items-center gap-1 transition-opacity hover:opacity-60"
              >
                Renk <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              {colorOpen ? (
                <div className="absolute left-0 top-full z-20 mt-2 min-w-[160px] rounded-lg border border-[#E5E5E5] bg-white py-2 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      replaceParams({ renk: null });
                      setColorOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-[13px] font-medium text-[#171717] hover:bg-[#FAFAFA]"
                  >
                    Tümü
                  </button>
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => {
                        replaceParams({ renk: color.name });
                        setColorOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] font-medium text-[#171717] hover:bg-[#FAFAFA]"
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-[#E5E5E5]"
                        style={{ background: color.hex }}
                      />
                      {color.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="text-[13px] text-[#6B7280]">{filtered.length} Sonuç</p>
      </div>

      {filtered.length > 0 ? (
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <TrNewTenantProductCard
                key={product.id}
                product={product}
                boutique={boutique}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="px-5 py-16 text-center text-[14px] text-[#6B7280]">
          Bu filtrelerle ürün bulunamadı.
        </p>
      )}
    </div>
  );
}
