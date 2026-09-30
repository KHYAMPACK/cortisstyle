"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { panelErrorClass } from "@/components/tr/panel/panelUi";
import { TrPanelEditor } from "@/components/tr/panel/TrPanelEditor";
import {
  TrPanelFadeIn,
  TrPanelLoading,
} from "@/components/tr/panel/TrPanelMotion";
import { TrFashionProductEditor } from "@/components/tr/fashion/panel/TrFashionProductEditor";
import { TrProductEditorForm } from "@/components/tr/panel/TrProductEditorForm";
import {
  boutiqueLocationAddress,
  TrSimpleProductEditor,
} from "@/components/tr/panel/TrSimpleProductEditor";
import { useAuth } from "@/context/AuthContext";
import { fetchOwnerProduct } from "@/lib/tr/ownerClient";
import { trPanelProductsPath } from "@/lib/tr/paths";
import type { TrProductCategories } from "@/lib/tr/categories/types";
import { EMPTY_PRODUCT_VARIANTS, type TrProductVariants } from "@/lib/tr/variants/types";
import {
  EMPTY_PRODUCT_PRIVATE,
  type TrProduct,
  type TrProductPrivate,
} from "@/types/tr-marketplace";

interface TrOwnerEditProductPageProps {
  productId: string;
  /**
   * `legacy` (from `?editor=eski`) opens the old autosaving fashion editor instead of
   * `TrFashionProductEditor`. A one-release fallback while the new editor settles in;
   * see docs/lilabutik-foundation-migration-plan.md (A3).
   */
  requestedFashionEditor?: "legacy" | null;
}

export function TrOwnerEditProductPage({
  productId,
  requestedFashionEditor = null,
}: TrOwnerEditProductPageProps) {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();
  const [product, setProduct] = useState<TrProduct | null>(null);
  const [ownerOnly, setOwnerOnly] = useState<TrProductPrivate>(EMPTY_PRODUCT_PRIVATE);
  const [productCategories, setProductCategories] =
    useState<TrProductCategories>({ ids: [], primaryId: null });
  const [variants, setVariants] = useState<TrProductVariants>(EMPTY_PRODUCT_VARIANTS);
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
        if (!cancelled) {
          setProduct(result.product);
          setOwnerOnly(result.ownerOnly);
          setProductCategories(result.categories);
          setVariants(result.variants);
        }
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

  // The product's type decides the editor. Products from before types existed
  // (or from a database without the column) are fashion products.
  const productType = product?.productType ?? "fashion";

  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <TrPanelEditor
            backHref={trPanelProductsPath()}
            parentLabel="Ürünler"
            title={
              productType === "simple"
                ? "Basit ürünü düzenle"
                : productType === "advanced"
                  ? "Gelişmiş ürünü düzenle"
                  : "Ürünü düzenle"
            }
            subject={product?.title}
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <TrPanelLoading key="edit-loading" label="Ürün yükleniyor…" />
              ) : error ? (
                <TrPanelFadeIn key="edit-error">
                  <p className={panelErrorClass}>{error}</p>
                </TrPanelFadeIn>
              ) : product && (productType === "simple" || productType === "advanced") ? (
                <TrPanelFadeIn key="edit-simple" shift={false}>
                  <TrSimpleProductEditor
                    boutiqueId={product.boutiqueId}
                    boutiqueSlug={activeBoutique.slug}
                    customDomain={activeBoutique.customDomain}
                    address={boutiqueLocationAddress(activeBoutique)}
                    product={product}
                    ownerOnly={ownerOnly}
                    categoryMode={activeBoutique.categoryMode}
                    initialCategories={productCategories}
                    initialVariants={variants}
                    onSaved={(saved) => {
                      setProduct(saved);
                    }}
                    onDeleted={() => {
                      router.push(trPanelProductsPath());
                    }}
                  />
                </TrPanelFadeIn>
              ) : product &&
                productType === "fashion" &&
                requestedFashionEditor === "legacy" ? (
                <TrPanelFadeIn key="edit-form" shift={false}>
                  <TrProductEditorForm
                    boutiqueId={product.boutiqueId}
                    boutiqueSlug={activeBoutique.slug}
                    initialProduct={product}
                    onSaved={(saved) => {
                      setProduct(saved);
                    }}
                    onDeleted={() => {
                      router.push(trPanelProductsPath());
                    }}
                  />
                </TrPanelFadeIn>
              ) : product && productType === "fashion" ? (
                <TrPanelFadeIn key="edit-fashion" shift={false}>
                  <TrFashionProductEditor
                    boutiqueId={product.boutiqueId}
                    boutiqueSlug={activeBoutique.slug}
                    initialProduct={product}
                    onSaved={(saved) => {
                      setProduct(saved);
                    }}
                    onDeleted={() => {
                      router.push(trPanelProductsPath());
                    }}
                  />
                </TrPanelFadeIn>
              ) : product ? (
                <TrPanelFadeIn key="edit-unsupported">
                  <p className={panelErrorClass}>
                    Bu ürün türü henüz düzenlenemiyor.
                  </p>
                </TrPanelFadeIn>
              ) : null}
            </AnimatePresence>
          </TrPanelEditor>
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}
