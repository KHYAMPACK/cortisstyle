"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { TrProductCard } from "@/components/tr/TrProductCard";
import { TR_BOUTIQUE_CATEGORIES } from "@/lib/tr/categories";
import { trProductsPath } from "@/lib/tr/paths";
import { trPanelFadeTransition } from "@/components/tr/panel/TrPanelMotion";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrCatalogBrowserProps {
  products: TrProductWithBoutique[];
  initialQ?: string;
  initialKategori?: string;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("tr");
}

export function TrCatalogBrowser({
  products,
  initialQ = "",
  initialKategori = "",
}: TrCatalogBrowserProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [kategori, setKategori] = useState(initialKategori);

  useEffect(() => {
    setQ(initialQ);
    setKategori(initialKategori);
  }, [initialQ, initialKategori]);

  const syncUrl = (nextQ: string, nextKategori: string) => {
    startTransition(() => {
      router.replace(
        trProductsPath({
          q: nextQ || undefined,
          kategori: nextKategori || undefined,
        }),
        { scroll: false },
      );
    });
  };

  const filtered = useMemo(() => {
    const query = normalize(q);
    return products.filter((product) => {
      if (kategori && product.category !== kategori) return false;
      if (!query) return true;
      const haystack = normalize(
        `${product.title} ${product.boutique.name}`,
      );
      return haystack.includes(query);
    });
  }, [products, q, kategori]);

  const handleCategory = (id: string | null) => {
    const next = id ?? "";
    setKategori(next);
    syncUrl(q, next);
  };

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    syncUrl(q, kategori);
  };

  return (
    <div>
      <div className="border-b border-black/10 px-5 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSearchSubmit} className="relative">
            <label className="relative block">
              <span className="sr-only">Ürün ara</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400"
                strokeWidth={1.5}
              />
              <input
                type="search"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                onBlur={() => syncUrl(q, kategori)}
                placeholder="Ürün veya butik ara…"
                className="w-full border border-black/15 bg-white py-3.5 pr-20 pl-11 text-center font-cadde-nav text-[13px] tracking-[0.08em] text-jet-black outline-none transition-colors placeholder:text-neutral-400 focus:border-jet-black md:text-[14px]"
              />
            </label>
            <button
              type="submit"
              className="absolute top-1/2 right-2 -translate-y-1/2 px-3 py-2 font-cadde-nav text-[10px] font-semibold tracking-[0.22em] text-cadde-red uppercase transition-opacity hover:opacity-60"
            >
              Ara
            </button>
          </form>

          <div
            className="mt-6 flex flex-wrap justify-center gap-2"
            role="listbox"
            aria-label="Kategoriler"
          >
            <button
              type="button"
              role="option"
              aria-selected={!kategori}
              onClick={() => handleCategory(null)}
              className={`border px-3.5 py-2 font-cadde-nav text-[10px] tracking-[0.18em] uppercase transition-colors ${
                !kategori
                  ? "border-jet-black bg-jet-black text-white"
                  : "border-black/15 bg-white text-neutral-600 hover:border-jet-black hover:text-jet-black"
              }`}
            >
              Tümü
            </button>
            {TR_BOUTIQUE_CATEGORIES.map((entry) => {
              const active = kategori === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => handleCategory(entry.id)}
                  className={`border px-3.5 py-2 font-cadde-nav text-[10px] tracking-[0.18em] uppercase transition-colors ${
                    active
                      ? "border-jet-black bg-jet-black text-white"
                      : "border-black/15 bg-white text-neutral-600 hover:border-jet-black hover:text-jet-black"
                  }`}
                >
                  {entry.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <motion.div
        key={`${kategori}|${q}|${filtered.length}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: isPending ? 0.7 : 1, y: 0 }}
        transition={trPanelFadeTransition}
        className="pb-16"
      >
        <p className="px-5 py-5 text-center font-cadde-nav text-[10px] tracking-[0.22em] text-neutral-500 uppercase md:px-10">
          {filtered.length} ürün
        </p>

        {filtered.length > 0 ? (
          <div className="mx-auto max-w-6xl px-0 md:px-6 lg:px-10">
            <div className="grid grid-cols-2 gap-x-[2px] gap-y-0 bg-white md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((product, index) => (
                <TrProductCard
                  key={product.id}
                  product={product}
                  showBoutique
                  variant="marketplace"
                  priority={index < 4}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="mx-auto max-w-md px-5 py-12 text-center text-[13px] text-neutral-600 md:px-10">
            Bu filtrelerle ürün bulunamadı.{" "}
            <button
              type="button"
              onClick={() => {
                setQ("");
                setKategori("");
                syncUrl("", "");
              }}
              className="underline underline-offset-2 hover:text-neutral-900"
            >
              Filtreleri temizle
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
}
