"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { trBoutiqueProductPath, trBoutiqueProductsPath } from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProduct } from "@/types/tr-marketplace";

/**
 * PopSockets-style inline header search: pill input that opens a
 * results panel on focus (matched products + a static "popular
 * searches" list). Structural UI match only — plain substring
 * filtering over the tenant's own catalog, no typo/"did you mean"
 * suggestion or real search ranking.
 */
interface TrNewTenantSearchBoxProps {
  boutiqueSlug: string;
  products: TrProduct[];
  className?: string;
}

const POPULAR_SEARCHES = ["magsafe", "asit yeşili", "kendi tasarım"] as const;

export function TrNewTenantSearchBox({
  boutiqueSlug,
  products,
  className = "",
}: TrNewTenantSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return [];
    return products
      .filter((p) => p.title.toLocaleLowerCase("tr").includes(q))
      .slice(0, 5);
  }, [products, query]);

  return (
    <div
      className={`relative ${className}`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <div className="flex h-10 items-center gap-2 rounded-full bg-[#F3F4F6] pl-4 pr-3">
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ara"
          className="w-full min-w-0 bg-transparent text-[14px] text-[#171717] outline-none placeholder:text-[#9CA3AF]"
        />
        <Search className="h-4 w-4 shrink-0 text-[#171717]" strokeWidth={1.75} />
      </div>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[320px] rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-lg">
          {query.trim() ? (
            <>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                Ürünler
              </p>
              {results.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {results.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={trBoutiqueProductPath(boutiqueSlug, product.id)}
                        className="flex items-center gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-[#FAFAFA]"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F0F0F0]">
                          {product.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] text-[#171717]">
                            {product.title}
                          </span>
                        </span>
                        <span className="shrink-0 text-[12px] font-semibold text-[#171717]">
                          {formatTryFromKurus(product.priceKurus)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[13px] text-[#9CA3AF]">
                  Sonuç bulunamadı.
                </p>
              )}
            </>
          ) : null}

          <p
            className={`text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF] ${
              query.trim() ? "mt-4" : ""
            }`}
          >
            Popüler Aramalar
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="rounded-full border border-[#E5E5E5] px-3 py-1 text-[12px] text-[#171717] transition-colors hover:border-[#171717]"
              >
                {term}
              </button>
            ))}
          </div>

          <Link
            href={trBoutiqueProductsPath(boutiqueSlug, { q: query.trim() || undefined })}
            className="mt-4 block text-center text-[12px] font-semibold text-[#171717] underline underline-offset-4"
          >
            Tüm sonuçları gör
          </Link>
        </div>
      ) : null}
    </div>
  );
}
