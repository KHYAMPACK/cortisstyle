"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  Home,
  Search,
  ShoppingBag,
  User,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  useTrBoutiqueCommerceScope,
  useTrScopedCart,
  useTrScopedFavorites,
} from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { TrBoutiquePendingLink } from "@/components/tr/boutique/editorial/TrBoutiqueNavPending";
import type { TrBoutiqueSkeletonKind } from "@/components/tr/boutique/editorial/TrBoutiqueSkeletons";
import {
  trBoutiqueAuthPath,
  trBoutiqueCartPath,
  trBoutiqueFavoritesPath,
  trBoutiquePath,
  trBoutiqueProductsPath,
} from "@/lib/tr/paths";

const EASE = [0.22, 1, 0.36, 1] as const;

export type AtelierPageId =
  | "home"
  | "products"
  | "favorites"
  | "cart"
  | "account";

type AtelierPageItem = {
  id: AtelierPageId;
  label: string;
  icon: LucideIcon;
  href: string;
  kind: TrBoutiqueSkeletonKind;
};

function buildPages(slug: string): AtelierPageItem[] {
  return [
    {
      id: "home",
      label: "Anasayfa",
      icon: Home,
      href: trBoutiquePath(slug),
      kind: "home",
    },
    {
      id: "products",
      label: "Ürünler",
      icon: Search,
      href: trBoutiqueProductsPath(slug),
      kind: "products",
    },
    {
      id: "favorites",
      label: "Favoriler",
      icon: Heart,
      href: trBoutiqueFavoritesPath(slug),
      kind: "account",
    },
    {
      id: "cart",
      label: "Sepet",
      icon: ShoppingBag,
      href: trBoutiqueCartPath(slug),
      kind: "cart",
    },
    {
      id: "account",
      label: "Hesap",
      icon: User,
      href: trBoutiqueAuthPath(slug),
      kind: "account",
    },
  ];
}

export function resolveAtelierPageId(
  pathname: string,
  slug: string,
): AtelierPageId {
  const normalized = pathname.replace(/\/$/, "") || "/";
  const base = `/tr/${slug}`;

  if (
    normalized.includes("/sepet") ||
    normalized.includes("/odeme") ||
    normalized.endsWith("/cart")
  ) {
    return "cart";
  }
  if (normalized.includes("/favoriler")) return "favorites";
  if (normalized.includes("/giris") || normalized.includes("/hesap")) {
    return "account";
  }
  if (normalized.includes("/urunler") || normalized.includes("/urun/")) {
    return "products";
  }
  if (normalized === base || normalized === "/") return "home";
  if (normalized.startsWith(`${base}/`)) return "home";
  return "home";
}

interface TrBoutiqueAtelierPageMorphProps {
  boutiqueSlug: string;
  /**
   * `icons` = always icons (mobile PF chrome).
   * `morph` = active page expands to text (desktop).
   */
  mode?: "icons" | "morph";
  className?: string;
}

/**
 * Atelier page switcher: morph label on desktop, compact icons on mobile.
 */
export function TrBoutiqueAtelierPageMorph({
  boutiqueSlug,
  mode = "morph",
  className = "",
}: TrBoutiqueAtelierPageMorphProps) {
  const pathname = usePathname();
  const commerce = useTrBoutiqueCommerceScope();
  const favorites = useTrScopedFavorites();
  const cart = useTrScopedCart();
  const pages = buildPages(boutiqueSlug);
  const routeId = resolveAtelierPageId(pathname, boutiqueSlug);
  const [optimisticId, setOptimisticId] = useState<AtelierPageId | null>(null);
  const iconsOnly = mode === "icons";

  useEffect(() => {
    setOptimisticId(null);
  }, [pathname]);

  const activeId = optimisticId ?? routeId;
  const favCount = favorites.hydrated ? favorites.itemCount : 0;
  const cartCount = cart.hydrated ? cart.itemCount : 0;

  const onSelect = (page: AtelierPageItem) => {
    if (page.id === activeId) {
      if (page.id === "favorites") {
        commerce.openPanel("favorites");
      }
      return;
    }
    setOptimisticId(page.id);
  };

  return (
    <nav
      aria-label="Sayfalar"
      className={`flex items-center gap-0 ${className}`}
    >
      {pages.map((page) => {
        const active = page.id === activeId;
        const showLabel = !iconsOnly && active;
        const Icon = page.icon;
        const badge =
          page.id === "favorites" && favCount > 0
            ? favCount
            : page.id === "cart" && cartCount > 0
              ? cartCount
              : 0;

        return (
          <div
            key={page.id}
            className="relative flex shrink-0 items-center justify-center"
          >
            <TrBoutiquePendingLink
              href={page.href}
              kind={page.kind}
              onNavigate={() => onSelect(page)}
              aria-label={
                badge > 0 ? `${page.label} (${badge})` : page.label
              }
              className={`relative inline-flex h-9 items-center justify-center text-neutral-900 transition-[min-width,padding,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-70 md:h-11 ${
                showLabel
                  ? "min-w-[4.75rem] px-2 sm:min-w-[5.75rem] sm:px-3"
                  : "w-8 sm:w-9 md:w-11"
              } ${active && iconsOnly ? "opacity-100" : ""}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {showLabel ? (
                  <motion.span
                    key={`${page.id}-label`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: EASE }}
                    className="whitespace-nowrap font-serif text-[13px] tracking-[0.1em] uppercase sm:text-[14px] md:text-[15px]"
                  >
                    {page.label}
                  </motion.span>
                ) : (
                  <motion.span
                    key={`${page.id}-icon`}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.18, ease: EASE }}
                    className="relative inline-flex"
                  >
                    <Icon
                      className={`h-5 w-5 ${active && iconsOnly ? "opacity-100" : ""}`}
                      strokeWidth={active && iconsOnly ? 1.75 : 1.5}
                      aria-hidden
                    />
                    {badge > 0 ? (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center bg-brand-primary px-1 text-[9px] text-white">
                        {badge}
                      </span>
                    ) : null}
                  </motion.span>
                )}
              </AnimatePresence>
            </TrBoutiquePendingLink>
          </div>
        );
      })}
    </nav>
  );
}
