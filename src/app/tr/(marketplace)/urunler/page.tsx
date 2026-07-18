"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TrCatalogBrowser } from "@/components/tr/TrCatalogBrowser";
import { useTrMarketplaceCache } from "@/components/tr/TrMarketplaceCacheProvider";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";

function ProductsHeader() {
  return (
    <TrSectionHeader
      kicker="Ürünler"
      title="Tüm parçalar"
      description="Kategori ve arama ile Cadde’deki ürünleri keşfedin."
    />
  );
}

function TrProductsPageBody() {
  const searchParams = useSearchParams();
  const { products, status, error, refresh } = useTrMarketplaceCache();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const q = searchParams.get("q") ?? "";
  const kategori = searchParams.get("kategori") ?? "";
  const hasCache = products.length > 0;

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
      <TrCatalogBrowser
        products={products}
        initialQ={q}
        initialKategori={kategori}
      />
    </>
  );
}

function TrProductsPageFallback() {
  const { products } = useTrMarketplaceCache();
  return <TrCatalogBrowser products={products} />;
}

export default function TrProductsPage() {
  return (
    <div>
      <ProductsHeader />
      <Suspense fallback={<TrProductsPageFallback />}>
        <TrProductsPageBody />
      </Suspense>
    </div>
  );
}
