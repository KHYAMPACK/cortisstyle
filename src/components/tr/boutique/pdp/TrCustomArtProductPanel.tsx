"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { TrBackButton } from "@/components/tr/TrBackButton";
import { TrFavoriteButton } from "@/components/tr/TrFavoriteButton";
import { TrMobileBuyBar } from "@/components/tr/TrMobileBuyBar";
import { TrProductGallery } from "@/components/tr/TrProductGallery";
import { TrPurchaseActions } from "@/components/tr/TrPurchaseActions";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { useTrScopedCart } from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { isProductCartCheckoutEnabled } from "@/lib/tr/cartCheckout";
import { resolveCustomArtPriceKurus } from "@/lib/tr/customArt/pricing";
import { uploadCustomerReferencePhoto } from "@/lib/tr/customArt/uploadClient";
import { beginBuyNowCheckout, type TrPurchaseIntent } from "@/lib/tr/buyNow";
import { getStorefrontGalleryImages } from "@/lib/tr/productImages";
import { resolveProductColors, resolveProductSizes } from "@/lib/tr/productOptions";
import { trBoutiquePath, trHomePath } from "@/lib/tr/paths";
import { useTrAddedToCartStore } from "@/store/trAddedToCartStore";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrCustomArtProductPanelProps {
  product: TrProductWithBoutique;
  branded: boolean;
  entry?: "cadde" | "store";
}

export function TrCustomArtProductPanel({
  product,
  branded,
  entry = "store",
}: TrCustomArtProductPanelProps) {
  const sizes = useMemo(() => resolveProductSizes(product), [product]);
  const colors = useMemo(() => resolveProductColors(product), [product]);
  const checkoutEnabled = isProductCartCheckoutEnabled(product);
  const cart = useTrScopedCart();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length === 1 ? sizes[0]! : null,
  );
  const [selectedStyle, setSelectedStyle] = useState(
    colors.length === 1 ? colors[0]! : null,
  );
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(
    null,
  );
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const priceKurus = useMemo(() => {
    if (selectedSize) {
      return (
        resolveCustomArtPriceKurus(product, selectedSize) ?? product.priceKurus
      );
    }
    return product.priceKurus;
  }, [product, selectedSize]);

  const galleryProduct = useMemo(
    () => ({
      ...product,
      images: getStorefrontGalleryImages(product),
    }),
    [product],
  );

  const styleRequired = colors.length > 0;
  const sizeRequired = sizes.length > 0;
  const photoRequired = true;
  const selectionRequired =
    (sizeRequired && !selectedSize) ||
    (styleRequired && !selectedStyle) ||
    (photoRequired && !referenceImageUrl);

  const openAddedSheet = useTrAddedToCartStore((state) => state.open);

  const buildLine = () => ({
    productId: product.id,
    boutiqueId: product.boutiqueId,
    boutiqueName: product.boutique.name,
    boutiqueSlug: product.boutique.slug,
    title: product.title,
    priceKurus,
    image: referenceImageUrl ?? galleryProduct.images[0] ?? null,
    size: selectedSize,
    referenceImageUrl,
    referenceId,
    styleOption: selectedStyle?.name ?? null,
  });

  const handleUpload = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const result = await uploadCustomerReferencePhoto({
        boutiqueId: product.boutiqueId,
        productId: product.id,
        file,
      });
      setReferenceImageUrl(result.url);
      setReferenceId(result.referenceId);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Fotoğraf yüklenemedi.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePurchaseIntent = (intent: TrPurchaseIntent = "add") => {
    if (selectionRequired) return;
    const line = buildLine();
    if (intent === "buyNow") {
      cart.addItem(line);
      router.push(beginBuyNowCheckout(line));
      return;
    }
    cart.addItem(line);
    openAddedSheet({
      productId: product.id,
      title: product.title,
      priceKurus,
      image: line.image,
      size: selectedSize,
      color: selectedStyle?.name ?? null,
      boutiqueName: product.boutique.name,
    });
  };

  const backHref =
    entry === "cadde" ? trHomePath() : trBoutiquePath(product.boutique.slug);

  const wrapperClass = branded
    ? "mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10"
    : "";

  return (
    <div className={branded ? "" : "border-b border-blueprint-border"}>
      <div className={wrapperClass}>
        <div className="mb-6 flex items-center justify-between gap-3">
          <TrBackButton fallbackHref={backHref} />
          <TrFavoriteButton product={product} />
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <TrProductGallery product={galleryProduct} />
            <p className="mt-3 text-[12px] text-neutral-500">
              Örnek tablo görselleri — sizin baskınız seçtiğiniz fotoğraftan
              üretilir.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[10px] tracking-[0.22em] text-neutral-500 uppercase">
                Kişiye özel tablo
              </p>
              <h1 className="mt-2 font-serif text-3xl tracking-tight text-neutral-950 md:text-4xl">
                {product.title}
              </h1>
              {product.description ? (
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
                  {product.description}
                </p>
              ) : null}
              <p className="mt-4 text-2xl font-semibold tabular-nums text-neutral-950">
                {formatTryFromKurus(priceKurus)}
              </p>
            </div>

            <section className="space-y-3">
              <h2 className="text-[11px] font-semibold tracking-[0.18em] text-neutral-800 uppercase">
                1 · Fotoğrafını yükle
              </h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleUpload(file);
                  event.target.value = "";
                }}
              />
              {referenceImageUrl ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-black/10 bg-neutral-50">
                  <Image
                    src={referenceImageUrl}
                    alt="Yüklediğiniz fotoğraf"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 480px"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute right-3 bottom-3 min-h-11 rounded-lg bg-white/95 px-4 py-2 text-[12px] font-medium text-neutral-800 shadow-sm"
                  >
                    Değiştir
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/15 bg-neutral-50 px-4 py-6 text-center transition-colors hover:border-black/30"
                >
                  <span className="text-[14px] font-medium text-neutral-800">
                    {uploading ? "Yükleniyor…" : "Fotoğraf seç veya sürükle"}
                  </span>
                  <span className="text-[12px] text-neutral-500">
                    JPG, PNG veya WebP · en fazla 10 MB
                  </span>
                </button>
              )}
              {uploadError ? (
                <p className="text-[13px] text-red-700">{uploadError}</p>
              ) : null}
            </section>

            {sizes.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-[11px] font-semibold tracking-[0.18em] text-neutral-800 uppercase">
                  2 · Boyut seç
                </h2>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const active = selectedSize === size;
                    const sizePrice =
                      resolveCustomArtPriceKurus(product, size) ??
                      product.priceKurus;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-h-11 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                          active
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-black/15 bg-white text-neutral-800 hover:border-black/30"
                        }`}
                      >
                        {size}
                        <span className="ml-2 tabular-nums opacity-80">
                          {formatTryFromKurus(sizePrice)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {colors.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-[11px] font-semibold tracking-[0.18em] text-neutral-800 uppercase">
                  {sizes.length > 0 ? "3" : "2"} · Stil seç
                </h2>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => {
                    const active = selectedStyle?.name === color.name;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedStyle(color)}
                        className={`min-h-11 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                          active
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-black/15 bg-white text-neutral-800 hover:border-black/30"
                        }`}
                      >
                        {color.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {checkoutEnabled ? (
              <TrPurchaseActions
                productId={product.id}
                boutiqueId={product.boutiqueId}
                boutiqueName={product.boutique.name}
                boutiqueSlug={product.boutique.slug}
                title={product.title}
                priceKurus={priceKurus}
                image={referenceImageUrl ?? galleryProduct.images[0] ?? null}
                size={selectedSize}
                color={selectedStyle?.name ?? null}
                referenceImageUrl={referenceImageUrl}
                referenceId={referenceId}
                styleOption={selectedStyle?.name ?? null}
                status={product.status}
                selectionRequired={selectionRequired}
                onRequestSelection={handlePurchaseIntent}
                whatsappPhone={product.boutique.whatsappPhone}
                className="hidden lg:flex"
              />
            ) : (
              <TrSoftNavLink
                href={trBoutiquePath(product.boutique.slug)}
                className="btn-primary inline-flex min-h-12 w-full items-center justify-center px-6 py-3.5 text-[11px] tracking-[0.18em]"
              >
                Mağazaya dön
              </TrSoftNavLink>
            )}

            {selectionRequired ? (
              <p className="text-[13px] text-neutral-500">
                Sipariş vermek için fotoğraf
                {sizeRequired ? ", boyut" : ""}
                {styleRequired ? " ve stil" : ""} seçin.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {checkoutEnabled ? (
        <TrMobileBuyBar>
          <TrPurchaseActions
            productId={product.id}
            boutiqueId={product.boutiqueId}
            boutiqueName={product.boutique.name}
            boutiqueSlug={product.boutique.slug}
            title={product.title}
            priceKurus={priceKurus}
            image={referenceImageUrl ?? galleryProduct.images[0] ?? null}
            size={selectedSize}
            color={selectedStyle?.name ?? null}
            referenceImageUrl={referenceImageUrl}
            referenceId={referenceId}
            styleOption={selectedStyle?.name ?? null}
            status={product.status}
            selectionRequired={selectionRequired}
            onRequestSelection={handlePurchaseIntent}
            whatsappPhone={product.boutique.whatsappPhone}
          />
        </TrMobileBuyBar>
      ) : null}
    </div>
  );
}
