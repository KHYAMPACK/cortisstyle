"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  TrPanelFadeIn,
  TrPanelLoading,
} from "@/components/tr/panel/TrPanelMotion";
import { TrProductEditorForm } from "@/components/tr/panel/TrProductEditorForm";
import { useAuth } from "@/context/AuthContext";
import { fetchOwnerProduct } from "@/lib/tr/ownerClient";
import { trPanelProductsPath } from "@/lib/tr/paths";
import type { TrProduct } from "@/types/tr-marketplace";

interface TrOwnerEditProductPageProps {
  productId: string;
}

export function TrOwnerEditProductPage({ productId }: TrOwnerEditProductPageProps) {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();
  const [product, setProduct] = useState<TrProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isInitializing || !isAuthenticated) {
      setLoading(isInitializing);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchOwnerProduct(productId);
        if (!cancelled) setProduct(result.product);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Ürün yüklenemedi.",
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
  }, [isAuthenticated, isInitializing, productId]);

  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-6">
          <Link
            href={trPanelProductsPath()}
            className="inline-block text-[11px] tracking-[0.1em] text-neutral-500 uppercase"
          >
            ← Listeye dön
          </Link>
          <h2 className="font-serif text-xl tracking-tight text-neutral-950">
            Ürünü düzenle
          </h2>

          <AnimatePresence mode="wait">
            {loading ? (
              <TrPanelLoading key="edit-loading" label="Ürün yükleniyor…" />
            ) : error ? (
              <TrPanelFadeIn key="edit-error">
                <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                  {error}
                </p>
              </TrPanelFadeIn>
            ) : product ? (
              <TrPanelFadeIn key="edit-form">
                <TrProductEditorForm
                  boutiqueId={product.boutiqueId}
                  boutiqueSlug={activeBoutique.slug}
                  mode="edit"
                  initialProduct={product}
                  onSaved={(saved) => {
                    setProduct(saved);
                    router.push(trPanelProductsPath());
                  }}
                />
              </TrPanelFadeIn>
            ) : null}
          </AnimatePresence>
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
