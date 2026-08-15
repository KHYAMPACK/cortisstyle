"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import {
  useTrBoutiqueCommerceScope,
  useTrScopedCart,
  useTrScopedFavorites,
} from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { useTrBoutiqueProductsOptional } from "@/components/tr/boutique/TrBoutiqueProductsContext";
import { TrSizeGateSheet } from "@/components/tr/TrSizeGateSheet";
import { saveBoutiqueCheckoutSelection } from "@/lib/tr/checkoutSelection";
import { resolveProductSizes } from "@/lib/tr/productOptions";
import { isProductSizeSellable } from "@/lib/tr/sizeStocks";
import {
  trBoutiqueCartPath,
  trBoutiqueCheckoutPath,
  trBoutiqueOrderTrackingPath,
  trBoutiqueProductPath,
} from "@/lib/tr/paths";
import { DEMO_SHOPPER_SHIPPED_ORDER_ID } from "@/lib/tr/commerce/demoShopperOrders";
import { cartLineKey, cartTotalKurus } from "@/types/tr-cart";
import { formatTryFromKurus } from "@/types/tr-marketplace";

function PanelShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Kapat"
        onClick={onClose}
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2 id={titleId} className="text-[13px] font-semibold tracking-[0.14em] uppercase">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center text-neutral-900 transition-opacity hover:opacity-60"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </motion.aside>
    </div>
  );
}

function CartPanel() {
  const { boutiqueName, boutiqueSlug, closePanel } = useTrBoutiqueCommerceScope();
  const cart = useTrScopedCart();
  const router = useRouter();

  return (
    <PanelShell title={`${boutiqueName} Sepet`} onClose={closePanel}>
      <p className="mb-4 text-[11px] tracking-[0.08em] text-neutral-500 uppercase">
        Bu butiğe özel sepet · marketplace sepetinden ayrı
      </p>

      {cart.items.length === 0 ? (
        <p className="text-[13px] text-neutral-600">Sepetiniz boş.</p>
      ) : (
        <ul className="space-y-4">
          {cart.items.map((item) => (
            <li key={cartLineKey(item)} className="flex gap-3 border-b border-black/5 pb-4">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-neutral-100">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={trBoutiqueProductPath(item.boutiqueSlug, item.productId)}
                  onClick={closePanel}
                  className="line-clamp-2 text-[13px] text-neutral-900 hover:underline"
                >
                  {item.title}
                </Link>
                {item.size ? (
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Beden: {item.size}
                  </p>
                ) : null}
                <p className="mt-1 text-[13px] font-medium">
                  {formatTryFromKurus(item.priceKurus)}
                </p>
                <button
                  type="button"
                  onClick={() => cart.removeItem(item.productId, item.size)}
                  className="mt-2 text-[11px] text-neutral-500 underline-offset-2 hover:underline"
                >
                  Kaldır
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cart.items.length > 0 ? (
        <div className="mt-6 border-t border-black/5 pt-4">
          <div className="flex items-center justify-between text-[13px]">
            <span>Toplam</span>
            <span className="font-medium">
              {formatTryFromKurus(cartTotalKurus(cart.items))}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              closePanel();
              router.push(trBoutiqueCartPath(boutiqueSlug));
            }}
            className="mt-4 w-full bg-brand-primary px-4 py-3 text-[11px] tracking-[0.16em] text-white uppercase transition-colors hover:bg-brand-primary-hover"
          >
            Sepeti gör
          </button>
          <button
            type="button"
            onClick={() => {
              saveBoutiqueCheckoutSelection(
                boutiqueSlug,
                cart.items.map((item) => cartLineKey(item)),
              );
              closePanel();
              router.push(trBoutiqueCheckoutPath(boutiqueSlug));
            }}
            className="mt-2 w-full border border-neutral-900 bg-transparent px-4 py-3 text-[11px] tracking-[0.16em] text-neutral-900 uppercase transition-opacity hover:opacity-70"
          >
            Ödemeye geç
          </button>
        </div>
      ) : null}
    </PanelShell>
  );
}

function FavoritesPanel() {
  const { boutiqueName, boutiqueSlug, closePanel, openPanel } =
    useTrBoutiqueCommerceScope();
  const favorites = useTrScopedFavorites();
  const cart = useTrScopedCart();
  const catalog = useTrBoutiqueProductsOptional();
  const [sizeGateProductId, setSizeGateProductId] = useState<string | null>(
    null,
  );

  const sizeGateProduct = catalog?.products.find(
    (product) => product.id === sizeGateProductId,
  );
  const sizeGateSizes = sizeGateProduct
    ? resolveProductSizes(sizeGateProduct)
    : [];

  const addFavoriteToCart = (item: (typeof favorites.items)[number]) => {
    const product = catalog?.products.find(
      (entry) => entry.id === item.productId,
    );
    if (product && product.status !== "available") {
      return;
    }
    const sizes = product ? resolveProductSizes(product) : [];

    if (sizes.length > 1) {
      setSizeGateProductId(item.productId);
      return;
    }

    const size =
      sizes.length === 1
        ? sizes[0]!
        : product?.size?.trim() || null;

    if (
      size &&
      product &&
      !isProductSizeSellable({
        sizes,
        size,
        sizeStocks: product.sizeStocks,
        unitStock: product.stock,
      })
    ) {
      return;
    }
    if (!size && product && product.stock <= 0) {
      return;
    }

    cart.addItem({
      productId: item.productId,
      boutiqueId: item.boutiqueId,
      boutiqueName: item.boutiqueName,
      boutiqueSlug: item.boutiqueSlug,
      title: item.title,
      priceKurus: item.priceKurus,
      image: item.image,
      size,
    });
    openPanel("cart");
  };

  return (
    <PanelShell title={`${boutiqueName} Favoriler`} onClose={closePanel}>
      <p className="mb-4 text-[11px] tracking-[0.08em] text-neutral-500 uppercase">
        Bu butiğe özel favoriler · marketplace favorilerinden ayrı
      </p>

      {favorites.items.length === 0 ? (
        <p className="text-[13px] text-neutral-600">Henüz favori ürün yok.</p>
      ) : (
        <ul className="space-y-4">
          {favorites.items.map((item) => (
            <li key={item.productId} className="flex gap-3 border-b border-black/5 pb-4">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-neutral-100">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={trBoutiqueProductPath(boutiqueSlug, item.productId)}
                  onClick={closePanel}
                  className="line-clamp-2 text-[13px] text-neutral-900 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-[13px] font-medium">
                  {formatTryFromKurus(item.priceKurus)}
                </p>
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => addFavoriteToCart(item)}
                    className="text-[11px] tracking-[0.08em] text-neutral-900 uppercase underline-offset-2 hover:underline"
                  >
                    Sepete ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => favorites.removeItem(item.productId)}
                    className="text-[11px] text-neutral-500 underline-offset-2 hover:underline"
                  >
                    Kaldır
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <TrSizeGateSheet
        open={Boolean(sizeGateProduct)}
        onClose={() => setSizeGateProductId(null)}
        sizes={sizeGateSizes}
        sizeStocks={sizeGateProduct?.sizeStocks}
        productTitle={sizeGateProduct?.title ?? ""}
        whatsappPhone={sizeGateProduct?.boutique.whatsappPhone}
        onConfirm={(size) => {
          const item = favorites.items.find(
            (entry) => entry.productId === sizeGateProductId,
          );
          if (!item) {
            setSizeGateProductId(null);
            return;
          }
          cart.addItem({
            productId: item.productId,
            boutiqueId: item.boutiqueId,
            boutiqueName: item.boutiqueName,
            boutiqueSlug: item.boutiqueSlug,
            title: item.title,
            priceKurus: item.priceKurus,
            image: item.image,
            size,
          });
          setSizeGateProductId(null);
          openPanel("cart");
        }}
      />
    </PanelShell>
  );
}

function TrackingPanel() {
  const { boutiqueSlug, closePanel } = useTrBoutiqueCommerceScope();
  const trackingHref = trBoutiqueOrderTrackingPath(
    boutiqueSlug,
    DEMO_SHOPPER_SHIPPED_ORDER_ID,
  );

  return (
    <PanelShell title="Kargo Takip" onClose={closePanel}>
      <p className="text-[13px] leading-relaxed text-neutral-600">
        Demo kargo takibi. Canlı taşıyıcı entegrasyonu gelince gerçek gönderi
        numarası burada açılır.
      </p>
      <Link
        href={trackingHref}
        onClick={closePanel}
        className="mt-6 flex w-full items-center justify-center bg-neutral-900 px-4 py-3 text-[11px] tracking-[0.16em] text-white uppercase"
      >
        Demo takibi gör
      </Link>
    </PanelShell>
  );
}

function ReportPanel() {
  const { boutiqueName, closePanel } = useTrBoutiqueCommerceScope();
  const catalog = useTrBoutiqueProductsOptional();
  const phone = catalog?.boutique.whatsappPhone?.replace(/\D/g, "") ?? "";
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(`Merhaba ${boutiqueName}, sipariş / ürün hakkında yazıyorum.`)}`
    : null;

  return (
    <PanelShell title="Yardım" onClose={closePanel}>
      <p className="text-[13px] leading-relaxed text-neutral-600">
        Sipariş, kargo veya ürün ile ilgili sorularınız için {boutiqueName}{" "}
        ekibine WhatsApp’tan yazın.
      </p>
      {waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={closePanel}
          className="mt-6 flex w-full items-center justify-center bg-neutral-900 px-4 py-3 text-[11px] tracking-[0.16em] text-white uppercase"
        >
          WhatsApp ile yaz
        </a>
      ) : (
        <button
          type="button"
          onClick={closePanel}
          className="mt-6 w-full bg-neutral-900 px-4 py-3 text-[11px] tracking-[0.16em] text-white uppercase"
        >
          Tamam
        </button>
      )}
    </PanelShell>
  );
}

const HELP_REPLIES: Array<{ q: string; a: string }> = [
  {
    q: "Kargo ne kadar sürer?",
    a: "Sipariş onayından ve ödeme teyidinden sonra ürünler paketlenir. Demo kargo takibini Hesabım → Siparişler’den açabilirsiniz.",
  },
  {
    q: "İade var mı?",
    a: "İade ve cayma koşulları yasal metinler sayfasındadır. Sorunuz olursa WhatsApp’tan yazın.",
  },
  {
    q: "Ödeme güvenli mi?",
    a: "Kart ödemesi iyzico ile açılacak. Siparişiniz güvenle kaydedilir; ödeme onayı sonrası kargoya çıkar.",
  },
  {
    q: "Beden tablosu",
    a: "Ürün sayfasındaki beden seçeneklerini kullanın. Emin değilseniz WhatsApp’tan beden danışın.",
  },
];

function HelpPanel() {
  const { boutiqueName, boutiqueSlug, closePanel, openPanel } =
    useTrBoutiqueCommerceScope();
  const [messages, setMessages] = useState<Array<{ role: "bot" | "user"; text: string }>>(
    [
      {
        role: "bot",
        text: `Merhaba! ${boutiqueName} yardım asistanıyım. Kargo, iade veya sipariş hakkında sorabilirsiniz.`,
      },
    ],
  );

  const ask = (question: string, answer: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: question },
      { role: "bot", text: answer },
    ]);
  };

  return (
    <PanelShell title="Yardım Asistanı" onClose={closePanel}>
      <div className="space-y-3">
        {messages.map((entry, index) => (
          <div
            key={`${entry.role}-${index}`}
            className={`max-w-[90%] px-3 py-2 text-[13px] leading-relaxed ${
              entry.role === "bot"
                ? "bg-neutral-100 text-neutral-800"
                : "ml-auto bg-neutral-900 text-white"
            }`}
          >
            {entry.text}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {HELP_REPLIES.map((item) => (
          <button
            key={item.q}
            type="button"
            onClick={() => ask(item.q, item.a)}
            className="border border-black/10 px-2.5 py-1.5 text-[11px] text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900"
          >
            {item.q}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-black/5 pt-4">
        <Link
          href={trBoutiqueOrderTrackingPath(
            boutiqueSlug,
            DEMO_SHOPPER_SHIPPED_ORDER_ID,
          )}
          onClick={closePanel}
          className="text-left text-[12px] tracking-[0.08em] text-neutral-900 uppercase underline-offset-2 hover:underline"
        >
          Kargo takip →
        </Link>
        <button
          type="button"
          onClick={() => openPanel("report")}
          className="text-left text-[12px] tracking-[0.08em] text-neutral-900 uppercase underline-offset-2 hover:underline"
        >
          Sorun bildir →
        </button>
      </div>
    </PanelShell>
  );
}

export function TrBoutiqueEditorialCommercePanels() {
  const { activePanel } = useTrBoutiqueCommerceScope();

  return (
    <AnimatePresence>
      {activePanel === "cart" ? <CartPanel key="cart" /> : null}
      {activePanel === "favorites" ? <FavoritesPanel key="favorites" /> : null}
      {activePanel === "tracking" ? <TrackingPanel key="tracking" /> : null}
      {activePanel === "report" ? <ReportPanel key="report" /> : null}
      {activePanel === "help" ? <HelpPanel key="help" /> : null}
    </AnimatePresence>
  );
}
