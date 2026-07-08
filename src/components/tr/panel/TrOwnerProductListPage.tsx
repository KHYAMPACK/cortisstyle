"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { fetchOwnerProducts } from "@/lib/tr/ownerClient";
import {
  trPanelEditProductPath,
  trPanelNewProductPath,
  trPanelPath,
} from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProduct } from "@/types/tr-marketplace";

const STATUS_LABEL: Record<string, string> = {
  available: "Satışta",
  sold: "Satıldı",
  hidden: "Gizli",
};

function ProductList({ boutiqueId }: { boutiqueId: string }) {
  const [products, setProducts] = useState<TrProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchOwnerProducts(boutiqueId);
        if (!cancelled) setProducts(result.products);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Ürünler yüklenemedi.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  if (loading) {
    return <p className="text-[13px] text-neutral-600">Ürünler yükleniyor…</p>;
  }

  if (error) {
    return (
      <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-neutral-600">
          {products.length} ürün
        </p>
        <Link
          href={trPanelNewProductPath()}
          className="btn-primary px-4 py-3 text-[10px] tracking-[0.14em]"
        >
          Yeni ürün
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="border border-black/10 bg-white px-4 py-8 text-[13px] text-neutral-600">
          Henüz ürün yok. İlk ürününüzü ekleyin.
        </p>
      ) : (
        <ul className="divide-y divide-black/10 border border-black/10 bg-white">
          {products.map((product) => {
            const cover = product.images[0] ?? null;
            return (
              <li key={product.id}>
                <Link
                  href={trPanelEditProductPath(product.id)}
                  className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-neutral-50"
                >
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-neutral-100">
                    {cover ? (
                      <Image
                        src={cover}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] text-neutral-900">
                      {product.title}
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-500">
                      {formatTryFromKurus(product.priceKurus)} ·{" "}
                      {STATUS_LABEL[product.status] ?? product.status}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function TrOwnerProductListPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Link
                href={trPanelPath()}
                className="inline-block text-[11px] tracking-[0.1em] text-neutral-500 uppercase"
              >
                ← Ana sayfa
              </Link>
              <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950">
                Ürünler
              </h2>
            </div>
          </div>
          <ProductList boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
