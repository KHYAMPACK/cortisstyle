"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, Menu, Search, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  useTrBoutiqueCommerceScope,
  useTrScopedFavorites,
} from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import {
  TrBoutiquePendingLink,
  useTrBoutiqueNavPendingOptional,
} from "@/components/tr/boutique/editorial/TrBoutiqueNavPending";
import { TrBoutiqueAtelierPageMorph } from "@/components/tr/boutique/editorial/TrBoutiqueAtelierPageMorph";
import { useStorefrontTaxonomy } from "@/components/tr/boutique/TrBoutiqueTaxonomy";
import { TrCartLink } from "@/components/tr/TrCartLink";
import {
  EDITORIAL_SALE_RED,
  getEditorialContent,
  isAtelierEditorialSkin,
  type EditorialDemoContent,
  type EditorialNavItem,
} from "@/lib/tr/boutiqueHome";
import {
  resolveBoutiqueBrandLabel,
  resolveBoutiqueLogoUrl,
} from "@/lib/tr/boutiqueBrand";
import type { TrStorefrontTaxonomy } from "@/lib/tr/categories/taxonomy";
import { DEMO_SHOPPER_SHIPPED_ORDER_ID } from "@/lib/tr/commerce/demoShopperOrders";
import {
  trBoutiqueAuthPath,
  trBoutiqueOrderTrackingPath,
  trBoutiquePath,
  trBoutiqueProductsPath,
} from "@/lib/tr/paths";
import { shippingFeeConfigOf } from "@/lib/tr/shipping/quoteShipping";
import { freeShippingPromoCopy } from "@/lib/tr/shipping/shippingCopy";
import { useAuth } from "@/context/AuthContext";
import { getTrAccountChromeLabel } from "@/lib/tr/userDisplayName";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrBoutiqueEditorialHeaderProps {
  boutique: TrBoutiquePublic;
}

type MegaFeatured = {
  label: string;
  image?: string;
  href: string;
};

function navItemHref(slug: string, item: EditorialNavItem): string {
  if (item.categoryId === "sale" || item.accent === "sale") {
    return trBoutiqueProductsPath(slug, { indirim: true });
  }
  if (item.id === "new") {
    return trBoutiqueProductsPath(slug, { sira: "new" });
  }
  if (item.categoryId) {
    return trBoutiqueProductsPath(slug, { kategori: item.categoryId });
  }
  return trBoutiqueProductsPath(slug);
}

function categoryProductsHref(slug: string, categoryId: string): string {
  if (categoryId === "sale") {
    return trBoutiqueProductsPath(slug, { indirim: true });
  }
  return trBoutiqueProductsPath(slug, { kategori: categoryId });
}

function resolveShopTiles(content: EditorialDemoContent) {
  if (content.shopCategories && content.shopCategories.length > 0) {
    return content.shopCategories;
  }
  return [
    ...content.featuredPair.map((item) => ({
      categoryId: item.categoryId,
      label: item.label,
      image: item.image,
    })),
    ...content.categoryTiles.map((item) => ({
      categoryId: item.categoryId,
      label: item.label,
      image: item.image,
    })),
  ];
}

function navItemDisplayLabel(
  item: EditorialNavItem,
  taxonomy: TrStorefrontTaxonomy,
): string {
  if (item.accent === "sale" || item.categoryId === "sale" || item.id === "new") {
    return item.label;
  }
  if (item.categoryId) {
    return taxonomy.displayLabel(item.categoryId, item.label);
  }
  return item.label;
}

function buildMegaFeatured(
  slug: string,
  item: EditorialNavItem,
  content: EditorialDemoContent,
  taxonomy: TrStorefrontTaxonomy,
): MegaFeatured[] {
  const tiles = resolveShopTiles(content);
  const trends = content.trends?.items ?? [];
  const primaryHref = navItemHref(slug, item);
  const itemLabel = navItemDisplayLabel(item, taxonomy);

  const matched =
    tiles.find((tile) => tile.categoryId === item.categoryId) ??
    tiles.find((tile) =>
      item.id === "new" ? false : tile.label === item.label,
    );

  const trendMatch =
    trends.find((trend) => trend.target === item.categoryId) ?? trends[0];
  const trendAlt =
    trends.find((trend) => trend.id !== trendMatch?.id) ?? trends[1];

  if (item.accent === "sale" || item.categoryId === "sale") {
    const saleTile =
      tiles.find((tile) => tile.categoryId === "sale") ?? matched;
    const next = nextShopCategoryTile(null, tiles, taxonomy, ["sale"]);
    return [
      {
        label: saleTile?.label ?? "İndirim",
        image: saleTile?.image ?? trendMatch?.image,
        href: trBoutiqueProductsPath(slug, { indirim: true }),
      },
      {
        label: next
          ? taxonomy.displayLabel(next.categoryId, next.label)
          : "Yeni",
        image: next?.image ?? trendAlt?.image,
        href: next
          ? categoryProductsHref(slug, next.categoryId)
          : trBoutiqueProductsPath(slug, { sira: "new" }),
      },
    ].filter((entry) => entry.label);
  }

  if (item.id === "new") {
    return tiles.slice(0, 2).map((tile) => ({
      label: taxonomy.displayLabel(tile.categoryId, tile.label),
      image: tile.image,
      href: categoryProductsHref(slug, tile.categoryId),
    }));
  }

  const parentImage = matched?.image ?? trendMatch?.image;
  const next = nextShopCategoryTile(item.categoryId, tiles, taxonomy);

  return [
    {
      label: taxonomy.displayLabel(
        matched?.categoryId ?? item.categoryId,
        matched?.label ?? itemLabel,
      ),
      image: parentImage,
      href: primaryHref,
    },
    {
      label: next
        ? taxonomy.displayLabel(next.categoryId, next.label)
        : (trendAlt?.title ?? "Koleksiyon"),
      image: next?.image ?? trendAlt?.image,
      href: next
        ? categoryProductsHref(slug, next.categoryId)
        : trBoutiqueProductsPath(slug),
    },
  ];
}

/** Next main category tile with a different photo (wraps around the root list). */
function nextShopCategoryTile(
  currentId: string | null | undefined,
  tiles: Array<{ categoryId: string; label: string; image?: string }>,
  taxonomy: TrStorefrontTaxonomy,
  excludeIds: string[] = [],
): { categoryId: string; label: string; image?: string } | null {
  const roots = taxonomy.roots().filter(
    (root) => !excludeIds.includes(root.id),
  );
  if (roots.length === 0) {
    return (
      tiles.find(
        (tile) =>
          tile.categoryId !== currentId &&
          !excludeIds.includes(tile.categoryId),
      ) ?? null
    );
  }

  const currentIndex = roots.findIndex((root) => root.id === currentId);
  const nextRoot =
    roots[(currentIndex >= 0 ? currentIndex + 1 : 0) % roots.length]!;
  if (nextRoot.id === currentId && roots.length > 1) {
    const fallback = roots.find((root) => root.id !== currentId)!;
    const tile =
      tiles.find((entry) => entry.categoryId === fallback.id) ?? null;
    return {
      categoryId: fallback.id,
      label: fallback.label,
      image: tile?.image,
    };
  }

  const tile = tiles.find((entry) => entry.categoryId === nextRoot.id);
  return {
    categoryId: nextRoot.id,
    label: nextRoot.label,
    image: tile?.image,
  };
}

function buildMegaLinks(
  slug: string,
  item: EditorialNavItem,
  content: EditorialDemoContent,
  taxonomy: TrStorefrontTaxonomy,
): Array<{ label: string; href: string }> {
  const tiles = resolveShopTiles(content);
  const primaryHref = navItemHref(slug, item);

  if (item.accent === "sale" || item.categoryId === "sale") {
    return [
      { label: "Tüm indirimler", href: primaryHref },
      ...taxonomy.roots().map((root) => ({
        label: root.label,
        href: trBoutiqueProductsPath(slug, {
          kategori: root.id,
          indirim: true,
        }),
      })),
    ];
  }

  if (item.id === "new") {
    return [
      { label: "Tüm yeniler", href: primaryHref },
      ...taxonomy.roots().map((root) => ({
        label: root.label,
        href: trBoutiqueProductsPath(slug, {
          kategori: root.id,
          sira: "new",
        }),
      })),
    ];
  }

  const children = item.categoryId
    ? taxonomy.navChildren(item.categoryId)
    : [];

  const shopAll = item.categoryId
    ? taxonomy.shopAllLabel(item.categoryId)
    : (() => {
        const label = navItemDisplayLabel(item, taxonomy);
        return `Tüm ${label.charAt(0).toLocaleLowerCase("tr-TR")}${label.slice(1)}`;
      })();

  if (children.length > 0) {
    return [
      { label: shopAll, href: primaryHref },
      ...children.map((child) => ({
        label: child.label,
        href: categoryProductsHref(slug, child.id),
      })),
    ];
  }

  return [
    { label: shopAll, href: primaryHref },
    {
      label: "İndirimdekiler",
      href: trBoutiqueProductsPath(slug, { indirim: true }),
    },
  ];
}

function navItemCanDrill(
  slug: string,
  item: EditorialNavItem,
  content: EditorialDemoContent,
  taxonomy: TrStorefrontTaxonomy,
): boolean {
  return buildMegaLinks(slug, item, content, taxonomy).length > 1;
}

export function TrBoutiqueEditorialHeader({
  boutique,
}: TrBoutiqueEditorialHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const commerce = useTrBoutiqueCommerceScope();
  const favorites = useTrScopedFavorites();
  const navPending = useTrBoutiqueNavPendingOptional();
  const taxonomy = useStorefrontTaxonomy();
  const content = getEditorialContent(boutique, taxonomy);
  const logoUrl = resolveBoutiqueLogoUrl(boutique);
  const atelier = isAtelierEditorialSkin(boutique.slug);
  const onCheckoutPage = /\/odeme(\/|$)/.test(pathname);
  const shippingPromoCopy = freeShippingPromoCopy(shippingFeeConfigOf(boutique));
  const showShippingPromo =
    atelier && shippingPromoCopy !== null && !onCheckoutPage;
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileDrillId, setMobileDrillId] = useState<string | null>(null);
  const [megaId, setMegaId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const megaCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const favCount = favorites.hydrated ? favorites.itemCount : 0;
  const productsPath = trBoutiqueProductsPath(boutique.slug);
  const onProductsPage =
    pathname.includes("/urunler") || pathname.includes("/kategori/");
  const hideCategoryNav =
    atelier && /\/(giris|hesap|adresler|sepet|favoriler)(\/|$)/.test(pathname);
  const brandTitle = resolveBoutiqueBrandLabel(boutique.slug, boutique.name);
  const accountLabel = getTrAccountChromeLabel(user, isAuthenticated);
  const openMegaItem =
    atelier && megaId
      ? (content.nav.find((item) => item.id === megaId) ?? null)
      : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      setMobileDrillId(null);
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (mobileDrillId) {
          setMobileDrillId(null);
          return;
        }
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen, mobileDrillId]);

  useEffect(() => {
    if (hideCategoryNav) setMegaId(null);
  }, [hideCategoryNav]);

  useEffect(() => {
    if (!megaId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMegaId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [megaId]);

  useEffect(() => {
    return () => {
      if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
    };
  }, []);

  const clearMegaClose = () => {
    if (megaCloseTimer.current) {
      clearTimeout(megaCloseTimer.current);
      megaCloseTimer.current = null;
    }
  };

  const openMega = (id: string) => {
    clearMegaClose();
    setMegaId(id);
  };

  const scheduleMegaClose = () => {
    clearMegaClose();
    megaCloseTimer.current = setTimeout(() => setMegaId(null), 120);
  };

  const navigateTo = (href: string) => {
    setMenuOpen(false);
    setMobileDrillId(null);
    setMegaId(null);
    if (navPending) {
      navPending.beginNavigation(href, { kind: "products" });
      return;
    }
    router.push(href);
  };

  const selectNav = (item: EditorialNavItem) => {
    navigateTo(navItemHref(boutique.slug, item));
  };

  const openMobileDrill = (item: EditorialNavItem) => {
    if (atelier && navItemCanDrill(boutique.slug, item, content, taxonomy)) {
      setMobileDrillId(item.id);
      return;
    }
    selectNav(item);
  };

  const mobileDrillItem =
    mobileDrillId != null
      ? (content.nav.find((item) => item.id === mobileDrillId) ?? null)
      : null;
  const mobileDrillLinks = mobileDrillItem
    ? buildMegaLinks(boutique.slug, mobileDrillItem, content, taxonomy)
    : [];
  const mobileDrillFeatured = mobileDrillItem
    ? buildMegaFeatured(boutique.slug, mobileDrillItem, content, taxonomy)[0]
    : null;

  const iconBtn =
    "inline-flex h-10 w-10 shrink-0 items-center justify-center text-neutral-900 transition-opacity hover:opacity-60 md:h-11 md:w-11";

  const icons = (
    <div className="relative z-10 flex items-center justify-end gap-0.5 md:gap-1">
      {!onProductsPage ? (
        <TrBoutiquePendingLink
          href={productsPath}
          kind="products"
          className={iconBtn}
          aria-label="Ara — ürünler"
        >
          <Search className="h-5 w-5" strokeWidth={1.5} />
        </TrBoutiquePendingLink>
      ) : null}

      <TrBoutiquePendingLink
        href={trBoutiqueAuthPath(boutique.slug)}
        kind="account"
        className={iconBtn}
        aria-label={accountLabel}
      >
        <User className="h-5 w-5" strokeWidth={1.5} />
      </TrBoutiquePendingLink>

      <button
        type="button"
        className={`relative ${iconBtn}`}
        aria-label={favCount > 0 ? `Favoriler (${favCount})` : "Favoriler"}
        onClick={() => commerce.openPanel("favorites")}
      >
        <Heart className="h-5 w-5" strokeWidth={1.5} />
        {favCount > 0 ? (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center bg-brand-primary px-1 text-[9px] text-white">
            {favCount}
          </span>
        ) : null}
      </button>

      <TrCartLink size="lg" />
    </div>
  );

  const logo = (
    <TrBoutiquePendingLink
      href={trBoutiquePath(boutique.slug)}
      kind="home"
      className={
        atelier
          ? "flex items-center gap-2.5 md:gap-3"
          : "absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      }
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={boutique.name}
          width={160}
          height={160}
          className={`w-auto object-contain ${
            atelier
              ? "h-11 max-h-12 sm:h-12 md:h-[3.25rem] lg:h-14"
              : "h-9 sm:h-10 md:h-12 lg:h-14"
          }`}
          unoptimized
          priority
        />
      ) : null}
      {atelier ? (
        <span className="font-serif text-[15px] font-light tracking-[0.08em] text-neutral-950 sm:text-[17px] md:text-[1.65rem] lg:text-[1.9rem]">
          {brandTitle}
        </span>
      ) : !logoUrl ? (
        <span className="font-serif text-lg tracking-[0.14em] uppercase md:text-xl">
          {brandTitle}
        </span>
      ) : null}
    </TrBoutiquePendingLink>
  );

  const menu =
    menuOpen && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[100]">
            <button
              type="button"
              aria-label="Menüyü kapat"
              className="absolute inset-0 bg-black/20 md:bg-black/20"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className={`absolute inset-y-0 left-0 flex w-full flex-col md:w-1/2 md:max-w-xl ${
                atelier
                  ? "bg-[#FAFAF8] md:shadow-[0_18px_50px_rgba(42,36,48,0.12)]"
                  : "bg-white md:shadow-xl"
              }`}
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-black/5 px-4 md:h-16">
                {atelier && mobileDrillItem ? (
                  <button
                    type="button"
                    onClick={() => setMobileDrillId(null)}
                    className="inline-flex items-center gap-1 text-left transition-opacity hover:opacity-70"
                    aria-label="Geri"
                  >
                    <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                    <span className="text-[13px] tracking-[0.08em] uppercase">
                      {navItemDisplayLabel(mobileDrillItem, taxonomy)}
                    </span>
                  </button>
                ) : (
                  <p className="font-serif text-lg tracking-[0.06em]">
                    {brandTitle}
                  </p>
                )}
                <button
                  type="button"
                  className={iconBtn}
                  aria-label="Menüyü kapat"
                  onClick={() => setMenuOpen(false)}
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>

              <nav
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2"
                aria-label="Kategoriler"
              >
                {atelier && mobileDrillItem ? (
                  <>
                    <ul>
                      {mobileDrillLinks.map((link) => (
                        <li
                          key={`${link.href}-${link.label}`}
                          className="border-b border-black/5"
                        >
                          <button
                            type="button"
                            onClick={() => navigateTo(link.href)}
                            className="flex w-full items-center justify-between gap-3 py-5 text-left transition-opacity hover:opacity-70"
                          >
                            <span className="text-[20px] leading-none font-light tracking-[0.04em] text-neutral-950 uppercase md:text-[26px]">
                              {link.label}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {mobileDrillFeatured?.image ? (
                      <button
                        type="button"
                        onClick={() => navigateTo(mobileDrillFeatured.href)}
                        className="relative mt-8 mb-10 aspect-[4/5] w-full overflow-hidden bg-neutral-100 text-left"
                      >
                        <Image
                          src={mobileDrillFeatured.image}
                          alt=""
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 480px"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                        <span className="absolute inset-x-0 bottom-0 px-4 pb-4 text-[13px] tracking-[0.12em] text-white uppercase">
                          {mobileDrillFeatured.label}
                        </span>
                      </button>
                    ) : (
                      <div className="pb-10" />
                    )}
                  </>
                ) : (
                  <>
                    <ul>
                      {content.nav.map((item) => {
                        const canDrill =
                          atelier &&
                          navItemCanDrill(boutique.slug, item, content, taxonomy);
                        return (
                          <li key={item.id} className="border-b border-black/5">
                            <button
                              type="button"
                              onClick={() =>
                                canDrill
                                  ? openMobileDrill(item)
                                  : selectNav(item)
                              }
                              className="flex w-full items-center justify-between gap-3 py-5 text-left transition-opacity hover:opacity-70"
                            >
                              <span
                                className={
                                  atelier
                                    ? "block text-[26px] leading-none font-light tracking-[0.04em] uppercase md:text-[32px]"
                                    : "block text-[28px] leading-none font-semibold tracking-[-0.02em] uppercase md:text-[34px]"
                                }
                                style={
                                  item.accent === "sale"
                                    ? {
                                        color: atelier
                                          ? "var(--boutique-accent)"
                                          : EDITORIAL_SALE_RED,
                                      }
                                    : { color: "#111" }
                                }
                              >
                                {navItemDisplayLabel(item, taxonomy)}
                              </span>
                              {canDrill ? (
                                <ChevronRight
                                  className="h-5 w-5 shrink-0 text-neutral-400"
                                  strokeWidth={1.5}
                                  aria-hidden
                                />
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mt-6 space-y-1 pb-10">
                      <TrBoutiquePendingLink
                        href={trBoutiqueAuthPath(boutique.slug)}
                        kind="account"
                        onNavigate={() => setMenuOpen(false)}
                        className="block py-3 text-[12px] tracking-[0.14em] text-neutral-600 uppercase"
                      >
                        {isAuthenticated ? accountLabel : "Giriş / Hesap"}
                      </TrBoutiquePendingLink>
                      <TrBoutiquePendingLink
                        href={trBoutiqueOrderTrackingPath(
                          boutique.slug,
                          DEMO_SHOPPER_SHIPPED_ORDER_ID,
                        )}
                        onNavigate={() => setMenuOpen(false)}
                        className="block py-3 text-[12px] tracking-[0.14em] text-neutral-600 uppercase"
                      >
                        Kargo takip
                      </TrBoutiquePendingLink>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          commerce.openPanel("report");
                        }}
                        className="block w-full py-3 text-left text-[12px] tracking-[0.14em] text-neutral-600 uppercase"
                      >
                        Sorun bildir
                      </button>
                    </div>
                  </>
                )}
              </nav>
            </div>
          </div>,
          document.body,
        )
      : null;

  const megaLinks = openMegaItem
    ? buildMegaLinks(boutique.slug, openMegaItem, content, taxonomy)
    : [];
  const megaFeatured = openMegaItem
    ? buildMegaFeatured(boutique.slug, openMegaItem, content, taxonomy)
    : [];

  return (
    <header
      data-atelier-chrome=""
      className={`sticky top-0 z-50 backdrop-blur-md ${
        atelier
          ? "border-b border-black/[0.05] bg-[#FAFAF8]/90"
          : "border-b border-black/5 bg-white/95"
      }`}
    >
      {showShippingPromo ? (
        <p
          className="truncate px-3 py-1.5 text-center text-[10px] tracking-[0.14em] text-white uppercase sm:text-[11px]"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          {shippingPromoCopy}
        </p>
      ) : null}
      {atelier ? (
        <div className="flex items-center justify-center border-b border-black/[0.04] px-3 py-3 md:hidden">
          {logo}
        </div>
      ) : null}

      <div
        className={`relative mx-auto flex w-full min-w-0 max-w-7xl items-center px-3 sm:px-4 md:px-8 ${
          atelier
            ? "h-14 justify-between md:h-20 lg:h-[5.5rem]"
            : "h-14 justify-between md:h-[4.5rem] lg:h-20"
        }`}
      >
        {atelier ? (
          <>
            <button
              type="button"
              className={`${iconBtn} relative z-10 md:hidden`}
              aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <div className="relative z-10 ml-auto flex min-w-0 items-center justify-end overflow-x-clip md:hidden">
              <TrBoutiqueAtelierPageMorph
                boutiqueSlug={boutique.slug}
                mode="icons"
              />
            </div>

            {/* Desktop: logo + name left · morph center */}
            <div className="relative z-10 hidden min-w-0 shrink items-center md:flex">
              {logo}
            </div>
            <div className="pointer-events-none absolute inset-0 z-[5] hidden items-center justify-center px-36 lg:px-44 md:flex">
              <div className="pointer-events-auto">
                <TrBoutiqueAtelierPageMorph
                  boutiqueSlug={boutique.slug}
                  mode="morph"
                />
              </div>
            </div>
            <div
              className="pointer-events-none invisible hidden w-[11rem] shrink-0 md:block md:w-52 lg:w-60"
              aria-hidden
            />
          </>
        ) : (
          <>
            <button
              type="button"
              className={`${iconBtn} relative z-10`}
              aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Menu className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
            </button>
            {logo}
            {icons}
          </>
        )}
      </div>

      {!hideCategoryNav ? (
      <div
        className={
          atelier
            ? "relative hidden border-t border-black/[0.04] md:block"
            : "hidden border-t border-black/5 md:block"
        }
        onMouseLeave={atelier ? scheduleMegaClose : undefined}
      >
        <nav aria-label="Kategoriler">
          <ul
            className={`mx-auto flex max-w-7xl items-center overflow-x-auto px-4 py-3 lg:px-8 ${
              atelier
                ? "justify-start gap-6 sm:justify-center sm:gap-8 lg:gap-10"
                : "justify-center gap-6 lg:gap-8"
            }`}
          >
            {content.nav.map((item) => {
              const isOpen = megaId === item.id;
              return (
                <li
                  key={item.id}
                  className="shrink-0"
                  onMouseEnter={
                    atelier ? () => openMega(item.id) : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (atelier) {
                        if (megaId === item.id) {
                          selectNav(item);
                          return;
                        }
                        openMega(item.id);
                        return;
                      }
                      selectNav(item);
                    }}
                    aria-expanded={atelier ? isOpen : undefined}
                    aria-haspopup={atelier ? "true" : undefined}
                    className={`uppercase ${
                      atelier
                        ? "relative text-[11px] tracking-[0.22em] text-neutral-700 after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.22,1,0.36,1)] hover:after:scale-x-100 lg:text-[12px]"
                        : "text-[11px] tracking-[0.16em] transition-opacity hover:opacity-60 lg:text-[12px]"
                    } ${atelier && isOpen ? "after:scale-x-100" : ""}`}
                    style={
                      item.accent === "sale"
                        ? {
                            color: atelier
                              ? "var(--boutique-accent)"
                              : EDITORIAL_SALE_RED,
                          }
                        : undefined
                    }
                  >
                    {navItemDisplayLabel(item, taxonomy)}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <AnimatePresence>
          {atelier && openMegaItem ? (
            <motion.div
              key={openMegaItem.id}
              role="region"
              aria-label={`${navItemDisplayLabel(openMegaItem, taxonomy)} menü`}
              className="absolute inset-x-0 top-full z-40 border-b border-black/[0.06] bg-[#FAFAF8] shadow-[0_24px_48px_rgba(42,36,48,0.08)]"
              onMouseEnter={clearMegaClose}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-10 md:px-8 md:py-10 lg:grid-cols-[minmax(12rem,0.85fr)_minmax(0,1.4fr)]">
                <div>
                  <p className="text-[11px] font-medium tracking-[0.18em] text-neutral-950 uppercase">
                    {navItemDisplayLabel(openMegaItem, taxonomy)}
                  </p>
                  <ul className="mt-4 space-y-2.5">
                    {megaLinks.map((link) => (
                      <li key={`${link.href}-${link.label}`}>
                        <button
                          type="button"
                          onClick={() => navigateTo(link.href)}
                          className="text-left text-[13px] tracking-[0.02em] text-neutral-600 transition-colors hover:text-neutral-950"
                        >
                          {link.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {megaFeatured.slice(0, 2).map((tile) => (
                    <button
                      key={`${tile.href}-${tile.label}`}
                      type="button"
                      onClick={() => navigateTo(tile.href)}
                      className="group relative aspect-[3/4] overflow-hidden bg-neutral-100 text-left"
                    >
                      {tile.image ? (
                        <Image
                          src={tile.image}
                          alt=""
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 45vw, 280px"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#E8DFD4]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                      <span className="absolute inset-x-0 bottom-0 px-3 pb-3 text-[11px] tracking-[0.14em] text-white uppercase sm:px-4 sm:pb-4 sm:text-[12px]">
                        {tile.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      ) : null}

      {menu}
    </header>
  );
}
