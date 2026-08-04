"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  TrPanelFadeIn,
  TrPanelLoading,
} from "@/components/tr/panel/TrPanelMotion";
import {
  createOwnerDiscountCode,
  fetchOwnerDiscountCodes,
  fetchOwnerProducts,
  setOwnerDiscountCodeActive,
  updateOwnerProduct,
} from "@/lib/tr/ownerClient";
import {
  trPanelEditProductPath,
  trPanelPath,
} from "@/lib/tr/paths";
import {
  formatTryFromKurus,
  type TrDiscountCode,
  type TrProduct,
} from "@/types/tr-marketplace";

function CampaignsBoard({ boutiqueId }: { boutiqueId: string }) {
  const [products, setProducts] = useState<TrProduct[]>([]);
  const [codes, setCodes] = useState<TrDiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("10");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [productResult, codeResult] = await Promise.all([
          fetchOwnerProducts(boutiqueId),
          fetchOwnerDiscountCodes(boutiqueId),
        ]);
        if (cancelled) return;
        setProducts(productResult.products);
        setCodes(codeResult);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Kampanyalar yüklenemedi.",
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

  const reload = async () => {
    const [productResult, codeResult] = await Promise.all([
      fetchOwnerProducts(boutiqueId),
      fetchOwnerDiscountCodes(boutiqueId),
    ]);
    setProducts(productResult.products);
    setCodes(codeResult);
  };

  const onSale = products.filter(
    (product) =>
      typeof product.compareAtPriceKurus === "number" &&
      product.compareAtPriceKurus > product.priceKurus,
  );

  const clearSale = async (product: TrProduct) => {
    setSaving(true);
    setError(null);
    try {
      await updateOwnerProduct(product.id, {
        title: product.title,
        description: product.description,
        priceTry: product.priceKurus / 100,
        compareAtPriceTry: null,
        sizes: product.sizes,
        colors: product.colors,
        category: product.category,
        images: product.images,
        marketplaceImages: product.marketplaceImages,
        stock: product.stock,
        status: product.status,
      });
      await reload();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "İndirim kaldırılamadı.",
      );
    } finally {
      setSaving(false);
    }
  };

  const createCoupon = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const percent = Number(percentOff);
      await createOwnerDiscountCode(boutiqueId, {
        code,
        percentOff: percent,
      });
      setCode("");
      await reload();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Kupon oluşturulamadı.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <TrPanelLoading key="camp-loading" label="Kampanyalar yükleniyor…" />
      ) : (
        <TrPanelFadeIn key="camp-ready" className="space-y-8">
          {error ? (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
              {error}
            </p>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-[12px] tracking-[0.14em] text-neutral-700 uppercase">
              Ürün indirimleri
            </h3>
            {onSale.length === 0 ? (
              <p className="border border-black/10 bg-white px-4 py-6 text-[13px] text-neutral-600">
                Aktif ürün indirimi yok. Ürün düzenlerken &quot;Eski fiyat&quot;
                alanını doldurun.
              </p>
            ) : (
              <ul className="divide-y divide-black/10 border border-black/10 bg-white">
                {onSale.map((product) => (
                  <li
                    key={product.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <Link
                      href={trPanelEditProductPath(product.id)}
                      className="min-w-0 flex-1 text-[14px] text-neutral-900 hover:underline"
                    >
                      {product.title}
                      <span className="mt-1 block text-[11px] text-neutral-500">
                        {formatTryFromKurus(product.priceKurus)}
                        {product.compareAtPriceKurus
                          ? ` · liste ${formatTryFromKurus(product.compareAtPriceKurus)}`
                          : ""}
                      </span>
                    </Link>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void clearSale(product)}
                      className="border border-black/15 px-3 py-2 text-[11px] tracking-[0.08em] uppercase disabled:opacity-50"
                    >
                      İndirimi kaldır
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-[12px] tracking-[0.14em] text-neutral-700 uppercase">
              Kupon kodları
            </h3>
            <form
              onSubmit={(event) => void createCoupon(event)}
              className="flex flex-wrap items-end gap-3 border border-black/10 bg-white px-4 py-4"
            >
              <label className="space-y-1">
                <span className="block text-[10px] tracking-[0.1em] text-neutral-500 uppercase">
                  Kod
                </span>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="border border-black/15 px-3 py-2 text-[13px]"
                  placeholder="YAZ10"
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="block text-[10px] tracking-[0.1em] text-neutral-500 uppercase">
                  % indirim
                </span>
                <input
                  value={percentOff}
                  onChange={(event) => setPercentOff(event.target.value)}
                  className="w-20 border border-black/15 px-3 py-2 text-[13px]"
                  inputMode="numeric"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-4 py-2.5 text-[10px] tracking-[0.14em] disabled:opacity-50"
              >
                Kupon ekle
              </button>
            </form>

            {codes.length === 0 ? (
              <p className="text-[13px] text-neutral-600">Henüz kupon yok.</p>
            ) : (
              <ul className="divide-y divide-black/10 border border-black/10 bg-white">
                {codes.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium tracking-[0.08em] text-neutral-900">
                        {entry.code}
                      </p>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        {entry.percentOff != null
                          ? `%${entry.percentOff}`
                          : entry.amountOffKurus
                            ? formatTryFromKurus(entry.amountOffKurus)
                            : "—"}{" "}
                        · {entry.active ? "Aktif" : "Pasif"} ·{" "}
                        {entry.usedCount} kullanım
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        void setOwnerDiscountCodeActive(
                          boutiqueId,
                          entry.id,
                          !entry.active,
                        ).then(reload)
                      }
                      className="border border-black/15 px-3 py-2 text-[11px] tracking-[0.08em] uppercase disabled:opacity-50"
                    >
                      {entry.active ? "Pasifleştir" : "Aktifleştir"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-neutral-500">
              Not: Kuponlar panelde yönetilir; ödeme sayfasına bağlama sonraki
              adımda eklenecek.
            </p>
          </section>
        </TrPanelFadeIn>
      )}
    </AnimatePresence>
  );
}

export function TrOwnerCampaignsPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-4">
          <div>
            <Link
              href={trPanelPath()}
              className="inline-block text-[11px] tracking-[0.1em] text-neutral-500 uppercase"
            >
              ← Ana sayfa
            </Link>
            <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950">
              Kampanyalar
            </h2>
            <p className="mt-1 text-[13px] text-neutral-600">
              Ürün indirimleri ve kupon kodları.
            </p>
          </div>
          <CampaignsBoard boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
