"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  panelBackLinkClass,
  panelEmptyClass,
  panelErrorClass,
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelPageTitleClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelLoading,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import {
  createOwnerDiscountCode,
  fetchOwnerDiscountCodes,
  fetchOwnerProducts,
  setOwnerDiscountCodeActive,
  updateOwnerProduct,
} from "@/lib/tr/ownerClient";
import { trPanelEditProductPath, trPanelPath } from "@/lib/tr/paths";
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
        <TrPanelFadeIn key="camp-ready" className="space-y-6">
          {error ? <p className={panelErrorClass}>{error}</p> : null}

          <section className="space-y-3">
            <div>
              <h3 className="text-[19px] font-semibold text-neutral-900">
                Ürün indirimleri
              </h3>
              <p className={`mt-1 ${panelHintClass}`}>
                Ürün düzenlerken eski fiyat girerek indirim açın.
              </p>
            </div>
            {onSale.length === 0 ? (
              <p className={panelEmptyClass}>
                Aktif ürün indirimi yok.
              </p>
            ) : (
              <TrPanelStagger className="space-y-3">
                {onSale.map((product) => (
                  <motion.div key={product.id} variants={trPanelStaggerItem}>
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-4 shadow-sm sm:p-5">
                      <Link
                        href={trPanelEditProductPath(product.id)}
                        className="min-w-0 flex-1"
                      >
                        <p className="text-[18px] font-semibold text-neutral-900">
                          {product.title}
                        </p>
                        <p className="mt-1 text-[15px] text-neutral-600">
                          {formatTryFromKurus(product.priceKurus)}
                          {product.compareAtPriceKurus ? (
                            <span className="ml-2 text-neutral-400 line-through">
                              {formatTryFromKurus(product.compareAtPriceKurus)}
                            </span>
                          ) : null}
                        </p>
                      </Link>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void clearSale(product)}
                        className={panelSecondaryBtnClass}
                      >
                        İndirimi kaldır
                      </button>
                    </div>
                  </motion.div>
                ))}
              </TrPanelStagger>
            )}
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-[19px] font-semibold text-neutral-900">
                Kupon kodları
              </h3>
              <p className={`mt-1 ${panelHintClass}`}>
                Müşterilerin kullanabileceği indirim kodu oluşturun.
              </p>
            </div>

            <form
              onSubmit={(event) => void createCoupon(event)}
              className={`${panelSectionClass} sm:flex sm:flex-wrap sm:items-end sm:gap-4`}
            >
              <label className="block min-w-[10rem] flex-1 space-y-2">
                <span className={panelLabelClass}>Kod</span>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className={panelFieldClass}
                  placeholder="YAZ10"
                  required
                />
              </label>
              <label className="mt-4 block w-full space-y-2 sm:mt-0 sm:w-28">
                <span className={panelLabelClass}>% indirim</span>
                <input
                  value={percentOff}
                  onChange={(event) => setPercentOff(event.target.value)}
                  className={panelFieldClass}
                  inputMode="numeric"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className={`${panelPrimaryBtnClass} mt-4 w-full sm:mt-0 sm:w-auto`}
                style={{ backgroundColor: "var(--panel-accent)" }}
              >
                Kupon ekle
              </button>
            </form>

            {codes.length === 0 ? (
              <p className={panelEmptyClass}>Henüz kupon yok.</p>
            ) : (
              <TrPanelStagger className="space-y-3">
                {codes.map((entry) => (
                  <motion.div key={entry.id} variants={trPanelStaggerItem}>
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-4 shadow-sm sm:p-5">
                      <div className="min-w-0">
                        <p className="text-[18px] font-semibold tracking-wide text-neutral-900">
                          {entry.code}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-[color:var(--panel-accent-soft)] px-2.5 py-1 text-[14px] font-semibold text-neutral-800">
                            {entry.percentOff != null
                              ? `%${entry.percentOff}`
                              : entry.amountOffKurus
                                ? formatTryFromKurus(entry.amountOffKurus)
                                : "—"}
                          </span>
                          <span
                            className={`rounded-lg px-2.5 py-1 text-[14px] font-semibold ${
                              entry.active
                                ? "bg-emerald-50 text-emerald-900"
                                : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {entry.active ? "Aktif" : "Pasif"}
                          </span>
                          <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-[14px] font-medium text-neutral-700">
                            {entry.usedCount} kullanım
                          </span>
                        </div>
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
                        className={panelSecondaryBtnClass}
                      >
                        {entry.active ? "Pasifleştir" : "Aktifleştir"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </TrPanelStagger>
            )}
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
        <div className="space-y-5">
          <div>
            <Link href={trPanelPath()} className={panelBackLinkClass}>
              ← Ana sayfa
            </Link>
            <h2 className={panelPageTitleClass}>Kampanyalar</h2>
          </div>
          <CampaignsBoard boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
