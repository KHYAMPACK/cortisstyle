"use client";

import { TrPanelBusyButton } from "@/components/tr/panel/TrPanelBusyButton";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrCampaignTypeChooser } from "@/components/tr/panel/discounts/TrCampaignTypeChooser";
import {
  panelBackLinkClass,
  panelEmptyClass,
  panelErrorClass,
  panelPageTitleClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelListSkeleton,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import {
  fetchOwnerDiscountCampaigns,
  fetchOwnerProducts,
  peekOwnerProducts,
  updateOwnerProduct,
} from "@/lib/tr/ownerClient";
import type { TrDiscountCampaign } from "@/lib/tr/discounts/types";
import {
  trPanelEditCampaignPath,
  trPanelEditProductPath,
  trPanelPath,
} from "@/lib/tr/paths";
import { formatTryFromKurus, type TrProduct } from "@/types/tr-marketplace";

function campaignSummary(campaign: TrDiscountCampaign): string {
  if (campaign.discountType === "percent") return `%${campaign.percentOff} indirim`;
  if (campaign.discountType === "fixed") {
    return `${formatTryFromKurus(campaign.amountOffKurus ?? 0)} indirim`;
  }
  return "Ücretsiz kargo";
}

function CampaignsList({ boutiqueId }: { boutiqueId: string }) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<TrDiscountCampaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chooserOpen, setChooserOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchOwnerDiscountCampaigns(boutiqueId)
      .then((result) => {
        if (!cancelled) setCampaigns(result);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Kampanyalar yüklenemedi.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[19px] font-semibold text-neutral-900">Kampanyalar</h3>
        <button
          type="button"
          onClick={() => setChooserOpen(true)}
          className={panelPrimaryBtnClass}
        >
          Kampanya Ekle
        </button>
      </div>

      {error && !campaigns ? (
        <p className={panelErrorClass}>{error}</p>
      ) : !campaigns ? (
        <TrPanelListSkeleton rows={3} label="Kampanyalar yükleniyor" />
      ) : campaigns.length === 0 ? (
        <div className={panelEmptyClass}>
          <p className="font-semibold text-neutral-900">Henüz kampanya eklemediniz.</p>
          <p className="mt-1">Koşullara göre otomatik uygulanan bir indirim oluşturun.</p>
        </div>
      ) : (
        <TrPanelFadeIn>
          <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <ul className="divide-y divide-neutral-100">
              {campaigns.map((campaign) => (
                <li
                  key={campaign.id}
                  onClick={() => router.push(trPanelEditCampaignPath(campaign.id))}
                  onPointerEnter={() =>
                    router.prefetch(trPanelEditCampaignPath(campaign.id))
                  }
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[color:var(--panel-accent-soft)]/60 motion-reduce:transition-none"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-neutral-900">
                      {campaign.title}
                    </p>
                    <p className="mt-0.5 text-[13px] text-neutral-500">
                      {campaign.kind === "automatic" ? "Otomatik İndirim" : "İndirim Kodu"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-[color:var(--panel-accent-soft)] px-2.5 py-1 text-[13px] font-semibold text-neutral-800">
                      {campaignSummary(campaign)}
                    </span>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[13px] font-semibold ${
                        campaign.active
                          ? "bg-emerald-50 text-emerald-900"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {campaign.active ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </TrPanelFadeIn>
      )}

      <TrCampaignTypeChooser open={chooserOpen} onClose={() => setChooserOpen(false)} />
    </section>
  );
}

function ProductSalesList({ boutiqueId }: { boutiqueId: string }) {
  const cached = peekOwnerProducts(boutiqueId);
  const [products, setProducts] = useState<TrProduct[]>(cached?.products ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchOwnerProducts(boutiqueId)
      .then((result) => {
        if (!cancelled) setProducts(result.products);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Ürün indirimleri yüklenemedi.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  const onSale = products.filter(
    (product) =>
      typeof product.compareAtPriceKurus === "number" &&
      product.compareAtPriceKurus > product.priceKurus,
  );

  const [clearingId, setClearingId] = useState<string | null>(null);
  const clearSale = async (product: TrProduct) => {
    setSaving(true);
    setClearingId(product.id);
    setError(null);
    try {
      await updateOwnerProduct(product.id, { compareAtPriceTry: null });
      const result = await fetchOwnerProducts(boutiqueId);
      setProducts(result.products);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "İndirim kaldırılamadı.");
    } finally {
      setSaving(false);
      setClearingId(null);
    }
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[19px] font-semibold text-neutral-900">Ürün indirimleri</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
          Ürün düzenlerken eski fiyat girerek indirim açın.
        </p>
      </div>

      {error ? <p className={panelErrorClass}>{error}</p> : null}

      {loading && products.length === 0 ? (
        <TrPanelListSkeleton rows={2} label="Ürün indirimleri yükleniyor" />
      ) : onSale.length === 0 ? (
        <p className={panelEmptyClass}>Aktif ürün indirimi yok.</p>
      ) : (
        <TrPanelStagger className="space-y-3">
          {onSale.map((product) => (
            <motion.div key={product.id} variants={trPanelStaggerItem}>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-4 shadow-sm sm:p-5">
                <Link href={trPanelEditProductPath(product.id)} className="min-w-0 flex-1">
                  <p className="text-[16px] font-semibold text-neutral-900">{product.title}</p>
                  <p className="mt-1 text-[14px] text-neutral-600">
                    {formatTryFromKurus(product.priceKurus)}
                    {product.compareAtPriceKurus ? (
                      <span className="ml-2 text-neutral-400 line-through">
                        {formatTryFromKurus(product.compareAtPriceKurus)}
                      </span>
                    ) : null}
                  </p>
                </Link>
                <TrPanelBusyButton
                  busy={clearingId === product.id}
                  busyLabel="Kaldırılıyor…"
                  disabled={saving}
                  onClick={() => void clearSale(product)}
                  className={panelSecondaryBtnClass}
                >
                  İndirimi kaldır
                </TrPanelBusyButton>
              </div>
            </motion.div>
          ))}
        </TrPanelStagger>
      )}
    </section>
  );
}

export function TrOwnerCampaignsPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-6">
          <div>
            <Link href={trPanelPath()} className={panelBackLinkClass}>
              ← Giriş
            </Link>
            <h2 className={panelPageTitleClass}>İndirimler</h2>
          </div>
          <CampaignsList boutiqueId={activeBoutique.id} />
          <ProductSalesList boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
