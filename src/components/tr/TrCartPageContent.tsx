"use client";

import Image from "next/image";
import Link from "next/link";
import { TrSandboxBanner } from "@/components/tr/TrSandboxBanner";
import { trBoutiquePath, trCheckoutPath, trHomePath, trProductPath } from "@/lib/tr/paths";
import { useTrCartStore } from "@/store/trCartStore";
import { cartTotalKurus, groupCartItemsByBoutique } from "@/types/tr-cart";
import { formatTryFromKurus } from "@/types/tr-marketplace";

export function TrCartPageContent() {
  const items = useTrCartStore((state) => state.items);
  const removeItem = useTrCartStore((state) => state.removeItem);
  const grouped = groupCartItemsByBoutique(items);
  const totalKurus = cartTotalKurus(items);

  if (items.length === 0) {
    return (
      <div className="space-y-6 px-5 py-10 md:px-10">
        <TrSandboxBanner />
        <p className="text-meta max-w-xl text-[12px] leading-relaxed">
          Sepetiniz boş. Ürün keşfine devam edebilir veya butik vitrinlerini inceleyebilirsiniz.
        </p>
        <Link
          href={trHomePath()}
          className="btn-primary inline-flex items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em]"
        >
          Alışverişe devam et
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 md:px-10 md:py-10">
      <TrSandboxBanner className="mb-8" />

      <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-8">
          {grouped.map((group) => (
            <section
              key={group.boutiqueId}
              className="border border-blueprint-border bg-canvas-paper"
            >
              <div className="border-b border-blueprint-border px-4 py-3">
                <Link
                  href={trBoutiquePath(group.boutiqueSlug)}
                  className="text-meta text-[10px] tracking-[0.22em] uppercase transition-colors hover:text-jet-black"
                >
                  Satıcı: {group.boutiqueName}
                </Link>
              </div>

              <ul className="divide-y divide-blueprint-border">
                {group.items.map((item) => (
                  <li key={item.productId} className="flex gap-4 p-4">
                    <Link
                      href={trProductPath(item.productId)}
                      className="relative h-24 w-20 shrink-0 overflow-hidden border border-blueprint-border bg-neutral-100"
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          unoptimized
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-meta">
                          {item.title}
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={trProductPath(item.productId)}
                        className="font-serif text-lg leading-tight text-neutral-950 hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="text-meta mt-1 text-[11px]">
                        {formatTryFromKurus(item.priceKurus)}
                        {item.size ? ` · Beden ${item.size}` : ""}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-meta mt-3 text-[10px] tracking-[0.16em] uppercase underline underline-offset-2 hover:text-jet-black"
                      >
                        Kaldır
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="border border-blueprint-border bg-canvas-paper p-5 lg:sticky lg:top-24">
          <p className="text-meta text-[10px] tracking-[0.22em] uppercase">Özet</p>
          <p className="mt-3 font-serif text-2xl tracking-[-0.02em] text-neutral-950">
            {formatTryFromKurus(totalKurus)}
          </p>
          <p className="text-meta mt-2 text-[11px] leading-relaxed">
            {items.length} ürün · {grouped.length} butik
          </p>
          <p className="text-meta mt-3 text-[11px] leading-relaxed">
            Birden fazla butikten alışveriş yapıyorsanız her satıcı ayrı kargo gönderebilir.
          </p>

          <Link
            href={trCheckoutPath()}
            className="btn-primary mt-6 inline-flex w-full items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em]"
          >
            Ödemeye geç
          </Link>
        </aside>
      </div>
    </div>
  );
}
