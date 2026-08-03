"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CreditCard,
  Lock,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  EDITORIAL_SALE_RED,
  getEditorialContent,
  type EditorialNavItem,
} from "@/lib/tr/boutiqueHome";
import { resolveBoutiqueLogoUrl } from "@/lib/tr/boutiqueBrand";
import { trBoutiqueProductsPath } from "@/lib/tr/paths";
import { instagramProfileUrl } from "@/lib/tr/whatsapp";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

const USP_ICONS: Record<string, LucideIcon> = {
  secure: Lock,
  customers: Users,
  shipping: Truck,
  payment: CreditCard,
};

const PLACEHOLDER_TONES = [
  "bg-[#EDE9E3]",
  "bg-[#E4DFD7]",
  "bg-[#D8D2C8]",
  "bg-[#F2EFE9]",
  "bg-[#CAC3B8]",
] as const;

function EditorialPlaceholder({
  label,
  tone = 0,
  dark = false,
}: {
  label?: string;
  tone?: number;
  dark?: boolean;
}) {
  return (
    <div
      className={`absolute inset-0 ${
        dark
          ? "bg-neutral-800"
          : PLACEHOLDER_TONES[tone % PLACEHOLDER_TONES.length]
      }`}
      aria-hidden
    >
      <div
        className={`absolute inset-0 opacity-40 ${
          dark
            ? "bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.06)_40%,rgba(255,255,255,0.06)_60%,transparent_60%)]"
            : "bg-[linear-gradient(135deg,transparent_40%,rgba(0,0,0,0.03)_40%,rgba(0,0,0,0.03)_60%,transparent_60%)]"
        }`}
      />
      {label ? (
        <span
          className={`pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-[11px] tracking-[0.22em] uppercase md:text-[12px] ${
            dark ? "text-white/25" : "text-neutral-500/55"
          }`}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

interface TrBoutiqueEditorialSectionsProps {
  boutique: TrBoutiquePublic;
}

function navHref(boutiqueSlug: string, item: EditorialNavItem): string {
  if (item.categoryId === "sale" || item.accent === "sale") {
    return trBoutiqueProductsPath(boutiqueSlug, { indirim: true });
  }
  if (item.id === "new" || !item.categoryId) {
    return trBoutiqueProductsPath(boutiqueSlug, { sira: "new" });
  }
  return trBoutiqueProductsPath(boutiqueSlug, { kategori: item.categoryId });
}

export function TrBoutiqueEditorialSections({
  boutique,
}: TrBoutiqueEditorialSectionsProps) {
  const boutiqueSlug = boutique.slug;
  const content = getEditorialContent(boutique);
  const logoUrl = resolveBoutiqueLogoUrl(boutique);
  const productsHref = trBoutiqueProductsPath(boutiqueSlug);
  const saleHref = trBoutiqueProductsPath(boutiqueSlug, { indirim: true });
  const categoryHref = (id: string) =>
    trBoutiqueProductsPath(boutiqueSlug, { kategori: id });

  const heroLinks = content.nav.filter((item) => item.accent !== "sale");
  const brandTitle =
    boutique.slug === "pervinsoysalbutik" ? "Pervin Soysal" : boutique.name;

  return (
    <div className="bg-white">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 bg-neutral-950 px-3 py-2.5 text-center text-white"
      >
        <p className="text-[10px] tracking-[0.12em] uppercase sm:text-[11px] md:text-[12px]">
          {content.promoBar.text}
        </p>
        <Link
          href={saleHref}
          className="border border-white/80 px-3 py-1.5 text-[10px] tracking-[0.14em] uppercase transition-colors hover:bg-white hover:text-neutral-950"
        >
          {content.promoBar.cta}
        </Link>
      </motion.div>

      {/* Category hero — mobile: brand first, compact links */}
      <motion.section
        {...fadeUp}
        aria-label="Kategoriler"
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0">
          <EditorialPlaceholder dark />
        </div>

        <div className="relative z-10 flex flex-col gap-8 px-5 py-8 sm:py-10 md:min-h-[82vh] md:justify-between md:px-10 md:py-14 lg:px-14">
          {/* Brand — top on mobile, right on desktop */}
          <div className="flex flex-col items-center text-center text-white md:absolute md:top-14 md:right-10 md:items-end md:text-right lg:right-14">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt=""
                width={160}
                height={160}
                className="h-14 w-auto object-contain brightness-0 invert md:h-20"
                unoptimized
                priority
              />
            ) : null}
            <p className="mt-3 font-serif text-[1.75rem] tracking-[0.04em] md:text-4xl lg:text-5xl">
              {brandTitle}
            </p>
          </div>

          <nav
            aria-label="Ana kategoriler"
            className="mx-auto w-full max-w-md md:mx-0 md:mt-6 md:pt-2"
          >
            <ul className="divide-y divide-white/15 border-y border-white/15 md:space-y-1 md:divide-y-0 md:border-0">
              {heroLinks.map((item) => (
                <li key={item.id}>
                  <Link
                    href={navHref(boutiqueSlug, item)}
                    className="flex min-h-12 items-center justify-between py-3 text-white transition-opacity hover:opacity-80 md:min-h-0 md:block md:py-1"
                  >
                    <span className="text-[18px] leading-none font-semibold tracking-[-0.02em] uppercase md:text-[40px] lg:text-[48px]">
                      {item.label}
                    </span>
                    <span className="text-[11px] tracking-[0.14em] text-white/50 uppercase md:hidden">
                      ›
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="text-center text-white md:mt-auto md:max-w-lg md:text-left">
            <p className="text-[14px] font-medium tracking-[0.04em] md:text-lg">
              {content.categoryHero.promoLine}
            </p>
            <Link
              href={productsHref}
              className="mt-4 inline-flex min-h-11 items-center bg-white px-5 py-3 text-[11px] tracking-[0.18em] text-neutral-950 uppercase transition-opacity hover:opacity-85"
            >
              {content.categoryHero.cta}
            </Link>
          </div>
        </div>
      </motion.section>

      <motion.section
        {...fadeUp}
        aria-label="Öne çıkan kategoriler"
        className="grid gap-px bg-white md:grid-cols-2"
      >
        {content.featuredPair.map((panel, index) => (
          <Link
            key={`${panel.label}-${panel.categoryId}`}
            href={categoryHref(panel.categoryId)}
            className="group relative min-h-[48vw] overflow-hidden sm:min-h-[42vw] md:min-h-[68vh]"
          >
            <EditorialPlaceholder tone={index} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pb-8 text-center text-white md:pb-14">
              <p className="text-xl font-semibold tracking-[0.14em] uppercase md:text-4xl">
                {panel.label}
              </p>
              <span className="mt-3 inline-flex min-h-10 items-center bg-white px-5 py-2.5 text-[11px] tracking-[0.16em] text-neutral-950 uppercase transition-transform duration-300 group-hover:scale-[1.02]">
                {panel.cta}
              </span>
            </div>
          </Link>
        ))}
      </motion.section>

      <motion.section
        {...fadeUp}
        aria-label="Daha fazla kategori"
        className="grid grid-cols-1 gap-px bg-white sm:grid-cols-3"
      >
        {content.categoryTiles.map((tile, index) => (
          <Link
            key={`${tile.label}-${tile.categoryId}`}
            href={categoryHref(tile.categoryId)}
            className="group relative min-h-[42vw] overflow-hidden sm:aspect-auto sm:min-h-[48vh]"
          >
            <EditorialPlaceholder tone={index + 2} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-7 text-center text-white">
              <p className="text-lg font-semibold tracking-[0.16em] uppercase md:text-2xl">
                {tile.label}
              </p>
              <span className="mt-3 inline-flex min-h-10 items-center border border-white/90 px-4 py-2 text-[10px] tracking-[0.16em] uppercase transition-colors group-hover:bg-white group-hover:text-neutral-950">
                {tile.cta}
              </span>
            </div>
          </Link>
        ))}
      </motion.section>

      <motion.section {...fadeUp} className="px-5 py-10 md:px-8 md:py-16">
        <p className="mx-auto max-w-2xl text-center text-[13px] leading-relaxed text-neutral-600 md:text-[14px]">
          {content.highlight.body}{" "}
          <Link
            href={productsHref}
            className="font-medium tracking-[0.08em] text-neutral-900 uppercase underline-offset-2 hover:underline"
          >
            {content.highlight.cta}
          </Link>
        </p>

        <h2 className="mt-10 text-center text-xl font-semibold tracking-tight text-neutral-900 md:text-2xl">
          {content.instagram.title}
        </h2>

        <div className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible md:px-0">
          {Array.from({ length: 5 }).map((_, index) => (
            <a
              key={`ig-ph-${index}`}
              href={instagramProfileUrl(content.instagram.handle)}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square w-[38vw] shrink-0 overflow-hidden sm:w-[30vw] md:w-auto"
            >
              <EditorialPlaceholder tone={index} />
            </a>
          ))}
        </div>
      </motion.section>

      <motion.section
        {...fadeUp}
        aria-label="Hizmetler"
        className="border-y border-black/5 px-5 py-10 md:px-8 md:py-12"
      >
        <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
          {content.usps.map((usp) => {
            const Icon = USP_ICONS[usp.icon] ?? Lock;
            return (
              <li
                key={usp.id}
                className="flex flex-col items-center text-center"
              >
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <p className="mt-3 text-[12px] font-semibold tracking-[0.04em] text-neutral-900 md:text-[13px]">
                  {usp.label}
                </p>
              </li>
            );
          })}
        </ul>
      </motion.section>

      <div className="px-5 py-6 text-center md:px-8">
        <Link
          href={saleHref}
          className="inline-flex min-h-11 items-center text-[12px] tracking-[0.16em] uppercase underline-offset-4 hover:underline"
          style={{ color: EDITORIAL_SALE_RED }}
        >
          İndirimdeki ürünleri gör →
        </Link>
      </div>
    </div>
  );
}
