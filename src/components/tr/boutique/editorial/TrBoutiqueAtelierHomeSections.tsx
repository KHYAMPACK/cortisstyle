"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Package,
  RefreshCw,
  Ruler,
  Shield,
  Sparkles,
  Tag,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { TrBoutiqueAtelierTwinStory } from "@/components/tr/boutique/editorial/TrBoutiqueAtelierTwinStory";
import { TrBoutiqueEditorialCatalog } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialCatalog";
import {
  resolveAtelierTwinStory,
  type EditorialDemoContent,
} from "@/lib/tr/boutiqueHome";
import { liveShippingHomeBody } from "@/lib/tr/catalog/pdpReturns";
import {
  trBoutiqueAuthPath,
  trBoutiqueProductsPath,
} from "@/lib/tr/paths";
import { boutiqueHasLiveShipping } from "@/lib/tr/shipping/registry";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

const PLACEHOLDER_TONES = [
  "bg-[#E8DFD4]",
  "bg-[#D9D0C4]",
  "bg-[#EDE6DC]",
  "bg-[#D4CBC0]",
  "bg-[#F0E9E0]",
] as const;

const INFO_ICONS: Record<string, LucideIcon> = {
  fit: Ruler,
  returns: RefreshCw,
  shipping: Truck,
  exchange: Package,
  secure: Shield,
  payment: Tag,
};

const BENEFIT_ICONS: Record<string, LucideIcon> = {
  points: Tag,
  early: Sparkles,
  promo: Tag,
  shipping: Truck,
  support: Heart,
  heart: Heart,
};

function categoryHref(slug: string, categoryId: string) {
  if (categoryId === "sale") {
    return trBoutiqueProductsPath(slug, { indirim: true });
  }
  if (categoryId === "all") {
    return trBoutiqueProductsPath(slug);
  }
  return trBoutiqueProductsPath(slug, { kategori: categoryId });
}

function TileMedia({
  image,
  label,
  tone,
}: {
  image?: string;
  label: string;
  tone: number;
}) {
  if (image) {
    return (
      <Image
        src={image}
        alt=""
        fill
        unoptimized
        sizes="(max-width: 768px) 70vw, 22vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    );
  }
  return (
    <div
      className={`absolute inset-0 ${PLACEHOLDER_TONES[tone % PLACEHOLDER_TONES.length]}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(0,0,0,0.04)_40%,rgba(0,0,0,0.04)_60%,transparent_60%)]" />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 text-center text-[11px] tracking-[0.18em] text-neutral-500/50 uppercase">
        {label}
      </span>
    </div>
  );
}

interface TrBoutiqueAtelierHomeSectionsProps {
  boutique: TrBoutiquePublic;
  content: EditorialDemoContent;
  products: TrProduct[];
}

/**
 * Paul Fredrick–structure home body for atelier skin only:
 * shop-by-category → info strip → trends 2×2 → mid campaign → products → join.
 */
export function TrBoutiqueAtelierHomeSections({
  boutique,
  content,
  products,
}: TrBoutiqueAtelierHomeSectionsProps) {
  const slug = boutique.slug;
  const productsHref = trBoutiqueProductsPath(slug);
  const authHref = trBoutiqueAuthPath(slug);

  const shopItems =
    content.shopCategories && content.shopCategories.length > 0
      ? content.shopCategories
      : [
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

  const infoItems =
    content.infoStrip && content.infoStrip.length > 0
      ? content.infoStrip
      : [
          {
            id: "returns",
            title: "Kolay iade",
            body: "Yasal süre içinde cayma ve iade taleplerinizi WhatsApp’tan iletebilirsiniz.",
            icon: "returns" as const,
          },
          {
            id: "shipping",
            title: "Kargo",
            body: boutiqueHasLiveShipping(slug)
              ? liveShippingHomeBody()
              : boutique.shippingNote?.trim() ||
                "Sipariş sonrası kargo bilgisi paylaşılır.",
            icon: "shipping" as const,
          },
          {
            id: "exchange",
            title: "Değişim",
            body: "Beden veya model değişimi için bize yazın — yardımcı olalım.",
            icon: "exchange" as const,
          },
        ];

  const trendsTitle =
    content.trends?.title?.trim() || "Trendleri keşfedin";
  const trendItems =
    content.trends?.items && content.trends.items.length > 0
      ? content.trends.items
      : [
          {
            id: "t-elbise",
            title: "Zarif elbiseler.",
            cta: "Elbiseleri incele",
            target: "elbise",
            image: content.featuredPair[1]?.image,
          },
          {
            id: "t-ust",
            title: "Günlük üstler.",
            cta: "Üstleri incele",
            target: "ust-giyim",
            image: content.featuredPair[0]?.image,
          },
          {
            id: "t-canta",
            title: "Çantalar.",
            cta: "Çantaları incele",
            target: "canta",
            image: content.categoryTiles[0]?.image,
          },
          {
            id: "t-sale",
            title: "İndirimdekiler.",
            cta: "Fırsatları gör",
            target: "sale",
            image: content.categoryTiles[2]?.image,
          },
        ];

  const mid = content.midCampaign ?? {
    eyebrow: "Yeni sezon",
    title: "Seçili parçalar sizi bekliyor",
    cta: "Alışverişe başla",
    target: "all",
  };

  const join = content.join ?? {
    eyebrow: "Üyelik",
    title:
      slug === "lilabutik"
        ? "Lila Boutique Ailesine Katılın"
        : `${boutique.name} ailesi`,
    body: "Üye olun; siparişlerinizi takip edin, favorilerinizi saklayın ve kampanyalardan haberdar olun.",
    primaryCta: "Üye ol / Giriş",
    secondaryCta: "Alışverişe devam",
    benefits: [
      { id: "fav", label: "Favori listesi", icon: "heart" as const },
      { id: "order", label: "Sipariş takibi", icon: "shipping" as const },
      { id: "promo", label: "Kampanya bilgilendirme", icon: "promo" as const },
      { id: "support", label: "WhatsApp destek", icon: "support" as const },
    ],
  };

  const twinStory = content.twinStory
    ? resolveAtelierTwinStory(content.twinStory, slug, products)
    : undefined;

  return (
    <div className="bg-[#FAFAF8]">
      {twinStory ? <TrBoutiqueAtelierTwinStory story={twinStory} /> : null}

      <div className="overflow-x-clip">
      {/* Shop by category */}
      <motion.section
        {...fadeUp}
        aria-label="Kategorilere göre alışveriş"
        className="px-4 pt-12 pb-4 md:px-8 md:pt-16 md:pb-6"
      >
        <h2 className="font-serif text-[1.75rem] font-light tracking-[-0.01em] text-neutral-950 md:text-[2.15rem]">
          {content.shopByCategoryTitle?.trim() || "Kategorilere göz atın"}
        </h2>
        <div className="mt-6 max-w-full min-w-0 md:mt-8">
          <div className="-mx-4 flex gap-2.5 overflow-x-auto overscroll-x-contain px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:px-0 lg:grid-cols-5">
          {shopItems.map((item, index) => (
            <Link
              key={`${item.categoryId}-${item.label}`}
              href={categoryHref(slug, item.categoryId)}
              className="group relative aspect-[3/4] w-[58vw] max-w-[16rem] shrink-0 overflow-hidden sm:w-[42vw] md:w-auto md:max-w-none"
            >
              <TileMedia
                image={item.image}
                label={item.label}
                tone={index}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-500 group-hover:from-black/50" />
              <p className="absolute bottom-3 left-3 text-[11px] font-medium tracking-[0.16em] text-white uppercase md:bottom-4 md:left-4 md:text-[12px]">
                {item.label}
              </p>
            </Link>
          ))}
          </div>
        </div>
      </motion.section>

      {/* Product catalog — under categories */}
      <motion.div {...fadeUp} className="bg-[#FAFAF8]">
        <TrBoutiqueEditorialCatalog
          products={products}
          boutiqueSlug={slug}
          boutiqueName={boutique.name}
        />
      </motion.div>

      {/* Trends 2×2 */}
      <motion.section
        {...fadeUp}
        aria-label="Trendler"
        className="px-4 py-12 md:px-8 md:py-16"
      >
        <h2 className="text-center font-serif text-[1.85rem] font-light tracking-[-0.01em] text-neutral-950 md:text-[2.35rem]">
          {trendsTitle}
        </h2>
        <div className="mx-auto mt-8 grid max-w-6xl gap-3 sm:mt-10 sm:gap-4 md:grid-cols-2">
          {trendItems.slice(0, 4).map((item, index) => (
            <Link
              key={item.id}
              href={categoryHref(slug, item.target?.trim() || "all")}
              className="group relative min-h-[52vw] overflow-hidden sm:min-h-[40vw] md:min-h-[42vh]"
            >
              <TileMedia
                image={item.image}
                label={item.title}
                tone={index + 1}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/8 to-transparent transition-opacity duration-500 group-hover:from-black/58" />
              <div className="absolute bottom-4 left-4 right-4 text-white md:bottom-6 md:left-6">
                <p className="font-serif text-[1.4rem] leading-tight font-light md:text-[1.85rem]">
                  {item.title}
                </p>
                <span className="mt-2.5 inline-block border-b border-white/80 pb-0.5 text-[12px] tracking-[0.14em] uppercase md:text-[13px]">
                  {item.cta}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* Mid campaign split */}
      <motion.section
        {...fadeUp}
        aria-label="Kampanya"
        className="grid md:grid-cols-2"
      >
        <div className="flex flex-col items-start justify-center bg-[#F4EEF3] px-6 py-14 md:px-12 md:py-20 lg:px-16">
          <p className="text-[11px] tracking-[0.24em] text-neutral-500 uppercase">
            {mid.eyebrow}
          </p>
          <h2 className="mt-4 max-w-md font-serif text-[1.95rem] leading-[1.12] font-light tracking-[-0.01em] text-neutral-950 md:text-[2.45rem]">
            {mid.title}
          </h2>
          <Link
            href={categoryHref(slug, mid.target?.trim() || "all")}
            className="atelier-cta atelier-cta-primary mt-8 w-auto min-w-[12rem] px-10"
          >
            {mid.cta}
          </Link>
        </div>
        <div className="relative min-h-[52vw] md:min-h-[28rem]">
          <TileMedia
            image={mid.image}
            label={mid.title}
            tone={3}
          />
        </div>
      </motion.section>

      {/* Join us */}
      <motion.section
        {...fadeUp}
        aria-label="Üyelik"
        className="mt-0"
      >
        <div className="grid md:grid-cols-2">
          <div className="flex flex-col justify-center bg-[#FAFAF8] px-6 py-14 md:px-12 md:py-20 lg:px-16">
            <p className="text-[11px] tracking-[0.24em] text-neutral-500 uppercase">
              {join.eyebrow}
            </p>
            <h2 className="mt-4 font-serif text-[1.95rem] font-light tracking-[-0.01em] text-neutral-950 md:text-[2.35rem]">
              {join.title}
            </h2>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-neutral-600">
              {join.body}
            </p>
            <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-2.5 sm:max-w-md sm:gap-3">
              <Link
                href={authHref}
                className="atelier-cta atelier-cta-primary"
              >
                {join.primaryCta}
              </Link>
              {join.secondaryCta ? (
                <Link
                  href={productsHref}
                  className="atelier-cta atelier-cta-ghost"
                >
                  {join.secondaryCta}
                </Link>
              ) : null}
            </div>
          </div>
          <div className="relative min-h-[52vw] overflow-hidden md:min-h-[22rem]">
            {join.image ? (
              <Image
                src={join.image}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-[center_20%]"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: "var(--boutique-accent, #9B7EBD)" }}
                aria-hidden
              />
            )}
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#5A4A78]/45 via-transparent to-transparent"
              aria-hidden
            />
            <div className="absolute right-6 bottom-6 flex h-28 w-28 items-center justify-center rounded-full border border-white/40 bg-white/10 text-center text-white backdrop-blur-[2px] md:right-8 md:bottom-8 md:h-32 md:w-32">
              <span className="font-serif text-[16px] leading-tight font-light tracking-[0.08em] italic">
                Lila
                <br />
                <span className="not-italic text-[10px] tracking-[0.28em] uppercase">
                  Club
                </span>
              </span>
            </div>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-6 border-t border-black/5 bg-white px-5 py-10 sm:grid-cols-3 md:grid-cols-4 md:gap-4 md:px-8 lg:grid-cols-4 xl:grid-cols-6">
          {join.benefits.map((benefit) => {
            const Icon = BENEFIT_ICONS[benefit.icon ?? "heart"] ?? Heart;
            return (
              <li
                key={benefit.id}
                className="flex flex-col items-center text-center"
              >
                <Icon
                  className="h-5 w-5 text-neutral-900"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <p className="mt-3 max-w-[9rem] text-[12px] leading-snug text-neutral-800 md:text-[13px]">
                  {benefit.label}
                </p>
              </li>
            );
          })}
        </ul>
      </motion.section>

      {/* Info strip — below join */}
      <motion.section
        {...fadeUp}
        aria-label="Alışveriş bilgileri"
        className="border-y border-black/[0.06] bg-[#F4EEF3] px-5 py-12 md:px-8 md:py-14"
      >
        <ul className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3 md:gap-10">
          {infoItems.map((item) => {
            const Icon = INFO_ICONS[item.icon ?? "shipping"] ?? Truck;
            return (
              <li key={item.id} className="flex flex-col items-start text-left">
                <Icon
                  className="h-6 w-6 text-neutral-900"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <p className="mt-4 font-serif text-[1.2rem] font-light tracking-[-0.01em] text-neutral-950 md:text-[1.3rem]">
                  {item.title}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 md:text-[14px]">
                  {item.body}
                </p>
              </li>
            );
          })}
        </ul>
      </motion.section>
      </div>
    </div>
  );
}
