"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrProductCard } from "@/components/tr/TrProductCard";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { useTrMarketplaceCache } from "@/components/tr/TrMarketplaceCacheProvider";
import { trHomePath } from "@/lib/tr/paths";
import { trPanelFadeTransition } from "@/components/tr/panel/TrPanelMotion";

const SUGGESTION_LIMIT = 8;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("tr");
}

export function TrSearchPage() {
  const { products, refresh } = useTrMarketplaceCache();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const query = normalize(q);

  const filtered = useMemo(() => {
    if (!query) return [];
    return products.filter((product) => {
      const haystack = normalize(`${product.title} ${product.boutique.name}`);
      return haystack.includes(query);
    });
  }, [products, query]);

  const suggestions = useMemo(
    () => products.slice(0, SUGGESTION_LIMIT),
    [products],
  );

  const showingSuggestions = !query;
  const list = showingSuggestions ? suggestions : filtered;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-ice-floor">
      <div className="flex shrink-0 items-center justify-start px-5 pt-20 pb-4 md:px-16 md:pt-24">
        <TrSoftNavLink
          href={trHomePath()}
          className="ml-12 font-cadde-nav text-[10px] font-semibold tracking-[0.22em] text-neutral-500 uppercase transition-colors hover:text-cadde-red md:ml-14"
        >
          Kapat
        </TrSoftNavLink>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pt-6 pb-16 md:px-10 md:pt-12">
        <label className="block">
          <span className="sr-only">Ne arıyorsunuz?</span>
          <p className="text-center font-cadde-nav text-[11px] tracking-[0.28em] text-neutral-400 uppercase md:text-[12px]">
            Ne arıyorsunuz?
          </p>
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="mt-4 w-full border-0 border-b border-black/15 bg-transparent py-3 text-center font-cadde-display text-2xl uppercase tracking-[0.04em] text-jet-black outline-none focus:border-cadde-red md:text-4xl"
          />
        </label>

        <motion.div
          key={showingSuggestions ? "suggest" : `q:${query}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={trPanelFadeTransition}
          className="mt-14"
        >
          <p className="font-cadde-nav text-[10px] tracking-[0.22em] text-neutral-500 uppercase">
            {showingSuggestions
              ? "İlginizi çekebilir"
              : filtered.length > 0
                ? `${filtered.length} sonuç`
                : "Sonuç yok"}
          </p>

          {!showingSuggestions && filtered.length === 0 ? (
            <p className="mt-6 text-center text-[13px] text-neutral-600">
              “{q.trim()}” için parça bulunamadı.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-x-[2px] gap-y-0 bg-white md:grid-cols-3 lg:grid-cols-4">
              {list.map((product, index) => (
                <TrProductCard
                  key={product.id}
                  product={product}
                  showBoutique
                  variant="marketplace"
                  priority={index < 4}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
