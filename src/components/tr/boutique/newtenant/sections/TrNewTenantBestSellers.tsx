import Link from "next/link";
import { newtenantBtnOutline } from "@/components/tr/boutique/newtenant/newtenantTheme";
import { trBoutiqueProductPath, trBoutiqueProductsPath } from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProduct } from "@/types/tr-marketplace";

/**
 * Product grid — structural match for PopSockets' "Best Sellers"
 * section (heading, card grid, centered "Shop Best Sellers" pill
 * below). Real seeded products, no fabricated best-seller ranking.
 */
interface TrNewTenantBestSellersProps {
  boutiqueSlug: string;
  products: TrProduct[];
}

export function TrNewTenantBestSellers({
  boutiqueSlug,
  products,
}: TrNewTenantBestSellersProps) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
      <h2 className="mb-8 text-center text-[22px] font-bold text-[#171717]">
        Öne Çıkanlar
      </h2>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {products.slice(0, 8).map((product) => (
          <Link
            key={product.id}
            href={trBoutiqueProductPath(boutiqueSlug, product.id)}
            className="group block"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl border border-[#E5E5E5] bg-white">
              {product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#F5F5F5] text-[12px] text-[#9CA3AF]">
                  Görsel yakında
                </div>
              )}
            </div>
            <p className="mt-3 truncate text-[13px] font-medium text-[#171717]">
              {product.title}
            </p>
            <p className="text-[13px] font-semibold text-[#171717]">
              {formatTryFromKurus(product.priceKurus)}
            </p>
          </Link>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link
          href={trBoutiqueProductsPath(boutiqueSlug)}
          className={newtenantBtnOutline}
        >
          Tümünü Gör
        </Link>
      </div>
    </section>
  );
}
