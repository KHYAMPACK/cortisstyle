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
  getEditorialDemoContent,
} from "@/lib/tr/boutiqueHome";
import { trBoutiqueProductsPath } from "@/lib/tr/paths";
import { instagramProfileUrl } from "@/lib/tr/whatsapp";

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

interface TrBoutiqueEditorialSectionsProps {
  boutiqueSlug: string;
}

export function TrBoutiqueEditorialSections({
  boutiqueSlug,
}: TrBoutiqueEditorialSectionsProps) {
  const content = getEditorialDemoContent();
  const productsHref = trBoutiqueProductsPath(boutiqueSlug);
  const saleHref = trBoutiqueProductsPath(boutiqueSlug, { indirim: true });
  const categoryHref = (id: string) =>
    trBoutiqueProductsPath(boutiqueSlug, { kategori: id });

  return (
    <div className="bg-white">
      <motion.section
        {...fadeUp}
        className="grid md:grid-cols-2"
        aria-label="Kampanya"
      >
        <Link
          href={saleHref}
          className="relative flex min-h-[52vw] flex-col items-center justify-center bg-[#F7F4EF] px-6 py-14 text-center md:min-h-[70vh]"
        >
          <p className="text-[10px] tracking-[0.28em] text-neutral-600 uppercase">
            {content.promo.eyebrow}
          </p>
          <p
            className="mt-4 font-serif text-5xl leading-none md:text-7xl"
            style={{ color: "#B8952A" }}
          >
            {content.promo.discount}
          </p>
          <p
            className="mt-1 font-serif text-2xl italic md:text-3xl"
            style={{ color: "#B8952A" }}
          >
            {content.promo.discountScript}
          </p>
          <p className="mt-3 font-serif text-4xl tracking-tight text-neutral-900 md:text-5xl">
            {content.promo.title}
          </p>
        </Link>

        <Link
          href={productsHref}
          className="group relative min-h-[58vw] overflow-hidden md:min-h-[70vh]"
        >
          <Image
            src={content.promo.image}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-x-0 bottom-10 px-6 text-center text-white">
            <p className="text-2xl font-semibold tracking-[0.12em] uppercase md:text-3xl">
              {content.promo.imageLabel}
            </p>
            <p className="mt-2 text-[11px] tracking-[0.18em] uppercase underline underline-offset-4">
              {content.promo.imageCta}
            </p>
          </div>
        </Link>
      </motion.section>

      <motion.section
        {...fadeUp}
        className="grid md:grid-cols-2"
        aria-label="Editöryel"
      >
        <div className="order-2 flex flex-col items-center justify-center px-6 py-14 text-center md:order-1 md:min-h-[60vh] md:px-12">
          <h2 className="max-w-md text-[22px] leading-snug font-semibold tracking-[0.06em] text-neutral-900 uppercase md:text-3xl">
            {content.editorial.headline}
          </h2>
          <p className="mt-5 max-w-md text-[13px] leading-relaxed text-neutral-600 md:text-[14px]">
            {content.editorial.body}
          </p>
          <Link
            href={productsHref}
            className="mt-8 text-[12px] tracking-[0.18em] text-neutral-900 uppercase underline-offset-4 transition-opacity hover:opacity-60 hover:underline"
          >
            {content.editorial.cta} ›
          </Link>
        </div>

        <Link
          href={productsHref}
          className="group relative order-1 min-h-[58vw] overflow-hidden md:order-2 md:min-h-[60vh]"
        >
          <Image
            src={content.editorial.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-8 px-6 text-center text-white">
            <p className="text-lg tracking-[0.08em] uppercase md:text-xl">
              {content.editorial.imageTitle}
            </p>
            <p className="mt-2 text-[11px] tracking-[0.16em] uppercase underline underline-offset-4">
              {content.editorial.imageCta}
            </p>
          </div>
        </Link>
      </motion.section>

      <motion.section
        {...fadeUp}
        aria-label="Kategoriler"
        className="grid grid-cols-2 gap-px bg-black/10 md:grid-cols-4"
      >
        {content.categoryTiles.map((tile) => (
          <Link
            key={`${tile.label}-${tile.categoryId}`}
            href={categoryHref(tile.categoryId)}
            className="group relative aspect-[3/4] overflow-hidden bg-neutral-900 md:aspect-[3/5]"
          >
            <Image
              src={tile.image}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-6 px-3 text-center text-white">
              <p className="text-sm font-semibold tracking-[0.16em] uppercase md:text-base">
                {tile.label}
              </p>
              <p className="mt-1 text-[10px] tracking-[0.14em] uppercase underline underline-offset-4">
                {tile.cta}
              </p>
            </div>
          </Link>
        ))}
      </motion.section>

      <motion.section
        {...fadeUp}
        className="relative min-h-[70vw] overflow-hidden md:min-h-[78vh]"
        aria-label="Yaşam stili"
      >
        <Image
          src={content.lifestyle.image}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-x-0 bottom-0 max-w-xl px-6 py-10 text-white md:left-10 md:px-0 md:py-16">
          <p className="text-[13px] leading-relaxed md:text-[15px]">
            {content.lifestyle.body}
          </p>
          <Link
            href={productsHref}
            className="mt-5 inline-block text-[12px] tracking-[0.18em] uppercase underline underline-offset-[6px] transition-opacity hover:opacity-70"
          >
            {content.lifestyle.cta}
          </Link>
        </div>
      </motion.section>

      <motion.section {...fadeUp} className="px-5 py-12 md:px-8 md:py-16">
        <p className="mx-auto max-w-3xl text-center text-[13px] leading-relaxed text-neutral-600 md:text-[14px]">
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
          {content.instagram.images.map((src, index) => (
            <a
              key={src}
              href={instagramProfileUrl(content.instagram.handle)}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square w-[42vw] shrink-0 overflow-hidden md:w-auto"
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 768px) 42vw, 20vw"
                className="object-cover transition-transform duration-500 hover:scale-[1.04]"
                priority={index < 2}
              />
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
          className="text-[12px] tracking-[0.16em] uppercase underline-offset-4 hover:underline"
          style={{ color: EDITORIAL_SALE_RED }}
        >
          İndirimdeki ürünleri gör →
        </Link>
      </div>
    </div>
  );
}
