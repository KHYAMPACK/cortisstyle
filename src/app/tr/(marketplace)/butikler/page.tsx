"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  TrBoutiquesDirectory,
  type TrBoutiqueDirectoryEntry,
} from "@/components/tr/TrBoutiquesDirectory";
import { useTrMarketplaceCache } from "@/components/tr/TrMarketplaceCacheProvider";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import { getProductCoverImageFor } from "@/lib/tr/productImages";

function buildBoutiqueEntries(
  products: ReturnType<typeof useTrMarketplaceCache>["products"],
  boutiques: ReturnType<typeof useTrMarketplaceCache>["boutiques"],
): TrBoutiqueDirectoryEntry[] {
  const countByBoutique = new Map<string, number>();
  const coverByBoutique = new Map<string, string | null>();

  for (const product of products) {
    const id = product.boutique.id;
    countByBoutique.set(id, (countByBoutique.get(id) ?? 0) + 1);
    if (!coverByBoutique.has(id)) {
      const cover = getProductCoverImageFor("marketplace", product);
      if (cover && !isTrDemoIconSrc(cover)) {
        coverByBoutique.set(id, cover);
      }
    }
  }

  return boutiques.map((boutique) => ({
    boutique,
    productCount: countByBoutique.get(boutique.id),
    coverImage: coverByBoutique.get(boutique.id) ?? boutique.logoUrl,
  }));
}

function BoutiquesHeader() {
  return (
    <TrSectionHeader
      kicker="Butikler"
      title="Cadde"
      description="Bağımsız butikleri keşfedin ve vitrinlerine gidin."
      clearChrome
    />
  );
}

function TrBoutiquesPageBody() {
  const searchParams = useSearchParams();
  const { products, boutiques, status, error, refresh } =
    useTrMarketplaceCache();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const entries = useMemo(
    () => buildBoutiqueEntries(products, boutiques),
    [products, boutiques],
  );

  const q = searchParams.get("q") ?? "";
  const hasCache = boutiques.length > 0;

  if (error && !hasCache) {
    return (
      <div className="border-b border-blueprint-border px-5 py-8 md:px-10">
        <p className="text-[13px] text-neutral-600">{error}</p>
        <button
          type="button"
          onClick={() => refresh()}
          className="mt-4 border border-brand-primary bg-brand-primary px-5 py-2.5 text-[10px] tracking-[0.18em] text-white uppercase transition-colors hover:border-brand-primary-hover hover:bg-brand-primary-hover"
        >
          Yeniden dene
        </button>
      </div>
    );
  }

  return (
    <>
      {error && hasCache ? (
        <p
          className="border-b border-blueprint-border px-5 py-2 font-mono text-[10px] tracking-[0.14em] text-meta md:px-10"
          role="status"
        >
          {error}
        </p>
      ) : null}
      {status === "refreshing" && hasCache ? (
        <p
          className="border-b border-blueprint-border px-5 py-2 font-mono text-[10px] tracking-[0.14em] text-meta md:px-10"
          role="status"
        >
          Güncelleniyor…
        </p>
      ) : null}
      <TrBoutiquesDirectory entries={entries} initialQ={q} />
    </>
  );
}

function TrBoutiquesPageFallback() {
  const { products, boutiques } = useTrMarketplaceCache();
  const entries = useMemo(
    () => buildBoutiqueEntries(products, boutiques),
    [products, boutiques],
  );
  return <TrBoutiquesDirectory entries={entries} />;
}

export default function TrBoutiquesPage() {
  return (
    <div>
      <BoutiquesHeader />
      <Suspense fallback={<TrBoutiquesPageFallback />}>
        <TrBoutiquesPageBody />
      </Suspense>
    </div>
  );
}
