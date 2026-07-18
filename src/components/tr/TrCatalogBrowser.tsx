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
      <div className="border-b border-blueprint-border px-5 py-5 md:px-10">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col gap-4 md:flex-row md:items-center"
        >
          <label className="relative block flex-1">
            <span className="sr-only">Ürün ara</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
              strokeWidth={1.5}
            />
            <input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onBlur={() => syncUrl(q, kategori)}
              placeholder="Ürün veya butik ara…"
              className="w-full border border-blueprint-border bg-white py-3 pr-4 pl-10 text-[13px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900"
            />
          </label>
          <button
            type="submit"
            className="shrink-0 border border-brand-primary bg-brand-primary px-6 py-3 text-[10px] tracking-[0.22em] text-white uppercase transition-colors hover:border-brand-primary-hover hover:bg-brand-primary-hover"
          >
            Ara
          </button>
        </form>

        <div
          className="mt-5 flex flex-wrap gap-2"
          role="listbox"
          aria-label="Kategoriler"
        >
          <button
            type="button"
            role="option"
            aria-selected={!kategori}
            onClick={() => handleCategory(null)}
            className={`border px-3 py-2 text-[10px] tracking-[0.18em] uppercase transition-colors ${
              !kategori
                ? "border-brand-primary bg-brand-primary text-white"
                : "border-blueprint-border bg-white text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
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
                className={`border px-3 py-2 text-[10px] tracking-[0.18em] uppercase transition-colors ${
                  active
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-blueprint-border bg-white text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
                }`}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        key={`${kategori}|${q}|${filtered.length}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: isPending ? 0.7 : 1, y: 0 }}
        transition={trPanelFadeTransition}
        className="px-0 pb-16"
      >
        <p className="text-meta px-5 py-4 text-[10px] tracking-[0.18em] uppercase md:px-10">
          {filtered.length} ürün
        </p>

        {filtered.length > 0 ? (
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
        ) : (
          <p className="px-5 py-12 text-[13px] text-neutral-600 md:px-10">
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
