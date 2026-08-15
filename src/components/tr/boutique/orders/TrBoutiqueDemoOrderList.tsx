"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { TrBoutiqueFindOrderModal } from "@/components/tr/boutique/orders/TrBoutiqueFindOrderModal";
import { useDemoShopperOrders } from "@/components/tr/boutique/orders/useDemoShopperOrders";
import { TrBoutiquePendingLink } from "@/components/tr/boutique/editorial/TrBoutiqueNavPending";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import { resolveBoutiqueThemeAccent } from "@/lib/tr/boutiqueBrand";
import {
  demoShopperOrderStatusLabel,
  formatDemoShopperDate,
  type DemoShopperOrder,
} from "@/lib/tr/commerce/demoShopperOrders";
import {
  trBoutiqueAuthPath,
  trBoutiqueOrderDetailPath,
} from "@/lib/tr/paths";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

export function TrBoutiqueDemoOrderList({
  boutique,
  orders: seed,
}: {
  boutique: TrBoutiquePublic;
  orders: DemoShopperOrder[];
}) {
  const accent = resolveBoutiqueThemeAccent(boutique);
  const { orders } = useDemoShopperOrders(boutique.slug, seed);
  const [findOpen, setFindOpen] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase }}
      >
        <TrBoutiquePendingLink
          href={trBoutiqueAuthPath(boutique.slug)}
          kind="account"
          className="text-[11px] tracking-[0.14em] text-neutral-500 uppercase transition-opacity hover:opacity-70"
        >
          ← Hesabım
        </TrBoutiquePendingLink>
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h1 className="font-serif text-3xl tracking-tight text-neutral-950 md:text-4xl">
            Siparişler
          </h1>
          <button
            type="button"
            onClick={() => setFindOpen(true)}
            className="min-h-11 self-start text-[13px] text-neutral-800 underline underline-offset-4 md:self-auto"
          >
            Sipariş bul
          </button>
        </div>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-neutral-600">
          Demo siparişler — gerçek gönderi yok. Canlı siparişler bağlanınca
          burası hesabınızdaki kayıtlarla dolacak.
        </p>
      </motion.div>

      <div className="mt-10 divide-y divide-black/10 border-y border-black/10">
        {orders.map((order, index) => {
          const thumb = order.items[0]?.image ?? null;
          return (
            <motion.article
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.32,
                ease: trPanelEase,
                delay: 0.04 + index * 0.06,
              }}
              className="py-6"
            >
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-neutral-950">
                    {demoShopperOrderStatusLabel(order.status)}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
                    Sipariş tarihi {formatDemoShopperDate(order.orderedAt)}
                    <br />
                    Sipariş no {order.displayNumber}
                  </p>
                </div>
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-neutral-100">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  ) : null}
                </div>
              </div>
              <TrBoutiquePendingLink
                href={trBoutiqueOrderDetailPath(boutique.slug, order.id)}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center border border-neutral-900 px-4 py-3 text-center text-[12px] tracking-[0.14em] text-neutral-900 uppercase transition-opacity hover:opacity-70"
              >
                Siparişi gör
              </TrBoutiquePendingLink>
            </motion.article>
          );
        })}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase, delay: 0.16 }}
        className="mt-10"
      >
        <h2 className="text-[15px] font-medium text-neutral-950">
          Siparişinizi bulamadınız mı?
        </h2>
        <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-neutral-600">
          Sipariş no ve teslimat posta kodu ile durumunu kontrol edebilirsiniz.
        </p>
        <button
          type="button"
          onClick={() => setFindOpen(true)}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center border border-neutral-900 px-4 py-3 text-[12px] tracking-[0.14em] text-neutral-900 uppercase transition-opacity hover:opacity-70 md:w-auto"
        >
          Sipariş bul
        </button>
      </motion.section>

      <TrBoutiqueFindOrderModal
        open={findOpen}
        onClose={() => setFindOpen(false)}
        boutiqueSlug={boutique.slug}
        accent={accent}
        orders={orders}
      />
    </div>
  );
}
