"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import {
  isBrandHeroTemplate,
  isCampaignHeroTemplate,
  resolveCampaignActions,
  resolveCampaignName,
  resolveCampaignSubText,
  resolveCampaignSubText2,
  type EditorialHeroPromotion,
} from "@/lib/tr/boutiqueHome";
import { trBoutiqueProductsPath } from "@/lib/tr/paths";

const AUTO_MS = 5500;
const ease = [0.22, 1, 0.36, 1] as const;
const BRAND_INTRO_SLIDE_ID = "brand-intro";

const PLACEHOLDER_TONES = [
  "bg-[#2a2a2a]",
  "bg-[#1f1a1c]",
  "bg-[#242018]",
] as const;

function promotionHref(
  boutiqueSlug: string,
  target?: string,
  options?: { indirim?: boolean },
) {
  const resolved = target?.trim() || "sale";
  if (resolved === "sale") {
    return trBoutiqueProductsPath(boutiqueSlug, { indirim: true });
  }
  if (resolved === "all") {
    return trBoutiqueProductsPath(boutiqueSlug, {
      indirim: options?.indirim === true ? true : undefined,
    });
  }
  return trBoutiqueProductsPath(boutiqueSlug, {
    kategori: resolved,
    indirim: options?.indirim === true ? true : undefined,
  });
}

function campaignActionsGridClass(count: number): string {
  if (count <= 1) return "mx-auto max-w-sm grid-cols-1";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  if (count === 3) return "grid-cols-1 sm:grid-cols-3";
  if (count === 4) return "grid-cols-2";
  return "grid-cols-2 sm:grid-cols-3";
}

function buildBrandIntroSlide(accent?: string): EditorialHeroPromotion {
  return {
    id: BRAND_INTRO_SLIDE_ID,
    template: "brand",
    backgroundColor: accent || "var(--boutique-accent)",
    promoLine: "",
    discountLine: "",
    cta: "",
  };
}

interface TrBoutiqueEditorialHeroCarouselProps {
  boutiqueSlug: string;
  brandTitle: string;
  logoUrl: string | null;
  /** White/light mark for campaign slides on accent backgrounds. */
  logoOnDarkUrl?: string | null;
  promotions: EditorialHeroPromotion[];
  /** Prefer boutique accent over hardcoded sale pink. */
  accent?: string;
  /** Quieter campaign-first layout (atelier). */
  campaignPreferred?: boolean;
}

export function TrBoutiqueEditorialHeroCarousel({
  boutiqueSlug,
  brandTitle,
  logoUrl,
  logoOnDarkUrl,
  promotions,
  accent,
  campaignPreferred = false,
}: TrBoutiqueEditorialHeroCarouselProps) {
  const baseSlides =
    promotions.length > 0
      ? promotions
      : [
          {
            id: "fallback",
            promoLine: "Kampanya",
            discountLine: "Alışverişe başla",
            cta: "Keşfet",
            target: "all" as const,
          },
        ];

  const slides =
    campaignPreferred && !baseSlides.some(isBrandHeroTemplate)
      ? [buildBrandIntroSlide(accent), ...baseSlides]
      : baseSlides;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = slides[index % slides.length]!;
  const multi = slides.length > 1;
  const brandMode = isBrandHeroTemplate(active);
  const campaignMode =
    !brandMode &&
    (isCampaignHeroTemplate(active) ||
      (campaignPreferred && !active.template));
  const contentAlign = active.contentAlign ?? "center";
  const photoAlignMode =
    !brandMode &&
    !campaignMode &&
    Boolean(active.image) &&
    (contentAlign === "left" || contentAlign === "right");

  const goTo = useCallback(
    (next: number) => {
      const len = slides.length;
      setIndex(((next % len) + len) % len);
    },
    [slides.length],
  );

  const advance = useEffectEvent(() => {
    if (paused || !multi) return;
    setIndex((current) => (current + 1) % slides.length);
  });

  useEffect(() => {
    if (!multi || paused) return;
    const timer = window.setInterval(() => advance(), AUTO_MS);
    return () => window.clearInterval(timer);
  }, [multi, paused, slides.length]);

  const bgColor =
    active.backgroundColor?.trim() ||
    (brandMode || campaignMode
      ? accent || "var(--boutique-accent)"
      : undefined);

  const tallHero = brandMode || campaignMode;

  return (
    <section
      aria-label="Kampanyalar"
      aria-roledescription="carousel"
      className={`relative w-full min-w-0 overflow-hidden ${
        tallHero
          ? "min-h-[70vh] md:min-h-[78vh]"
          : "min-h-[72vh] md:min-h-[85vh]"
      }`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`bg-${active.id}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          {active.image ? (
            <Image
              src={active.image}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              className={
                photoAlignMode
                  ? contentAlign === "left"
                    ? // Woman on right — crop open left side on mobile to center her
                      "object-cover object-[82%_18%] scale-[1.2] translate-y-[6%] md:object-[68%_20%] md:scale-[1.15] md:translate-y-[8%]"
                    : // Woman on left — crop open right side on mobile to center her
                      "object-cover object-[18%_18%] scale-[1.2] translate-y-[6%] md:object-[32%_20%] md:scale-[1.15] md:translate-y-[8%]"
                  : "object-cover"
              }
              unoptimized
            />
          ) : bgColor ? (
            <div
              className="absolute inset-0"
              style={{ background: bgColor }}
              aria-hidden
            />
          ) : (
            <div
              className={`absolute inset-0 ${
                PLACEHOLDER_TONES[index % PLACEHOLDER_TONES.length]
              }`}
              aria-hidden
            >
              <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.06)_40%,rgba(255,255,255,0.06)_60%,transparent_60%)] opacity-40" />
            </div>
          )}
          {active.image ? (
            photoAlignMode ? (
              <>
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent md:hidden"
                  aria-hidden
                />
                <div
                  className={`absolute inset-0 hidden md:block ${
                    contentAlign === "left"
                      ? "bg-gradient-to-r from-black/55 via-black/25 to-transparent"
                      : "bg-gradient-to-l from-black/55 via-black/25 to-transparent"
                  }`}
                  aria-hidden
                />
              </>
            ) : (
              <div className="absolute inset-0 bg-black/45" />
            )
          ) : brandMode || campaignMode ? (
            <div
              className="absolute inset-0 opacity-[0.14]"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 20%, white 0%, transparent 55%)",
              }}
              aria-hidden
            />
          ) : (
            <div className="absolute inset-0 bg-black/45" />
          )}
        </motion.div>
      </AnimatePresence>

      {brandMode ? (
        <BrandHeroSlide
          boutiqueSlug={boutiqueSlug}
          brandTitle={brandTitle}
          logoUrl={logoUrl}
          multi={multi}
          index={index}
          slides={slides}
          onGoTo={goTo}
        />
      ) : campaignMode ? (
        <CampaignHeroSlide
          boutiqueSlug={boutiqueSlug}
          brandTitle={brandTitle}
          logoUrl={logoOnDarkUrl ?? logoUrl}
          promo={active}
          multi={multi}
          index={index}
          slides={slides}
          onGoTo={goTo}
        />
      ) : (
        <ClassicHeroSlide
          boutiqueSlug={boutiqueSlug}
          brandTitle={brandTitle}
          logoUrl={logoUrl}
          promo={active}
          multi={multi}
          index={index}
          slides={slides}
          onGoTo={goTo}
        />
      )}
    </section>
  );
}

function HeroSlideDots({
  multi,
  index,
  slides,
  onGoTo,
  label = "Kampanya slaytları",
}: {
  multi: boolean;
  index: number;
  slides: EditorialHeroPromotion[];
  onGoTo: (next: number) => void;
  label?: string;
}) {
  if (!multi) return null;
  return (
    <div
      className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 md:bottom-10"
      role="tablist"
      aria-label={label}
    >
      {slides.map((slide, slideIndex) => {
        const selected = slideIndex === index % slides.length;
        return (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={`Slayt ${slideIndex + 1}`}
            onClick={() => onGoTo(slideIndex)}
            className={`h-1.5 transition-all duration-300 ${
              selected
                ? "w-8 bg-white"
                : "w-1.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        );
      })}
    </div>
  );
}

function BrandHeroSlide({
  boutiqueSlug,
  brandTitle,
  logoUrl,
  multi,
  index,
  slides,
  onGoTo,
}: {
  boutiqueSlug: string;
  brandTitle: string;
  logoUrl: string | null;
  multi: boolean;
  index: number;
  slides: EditorialHeroPromotion[];
  onGoTo: (next: number) => void;
}) {
  const shopHref = promotionHref(boutiqueSlug, "all");
  const saleHref = promotionHref(boutiqueSlug, "sale");

  return (
    <div className="relative z-10 flex min-h-[70vh] w-full min-w-0 flex-col items-center justify-center overflow-hidden px-4 py-12 text-center text-white sm:px-5 md:min-h-[78vh] md:py-16">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={BRAND_INTRO_SLIDE_ID}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45, ease }}
          className="relative flex w-full min-w-0 max-w-3xl flex-col items-center"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt=""
              width={480}
              height={480}
              className="h-44 w-auto object-contain sm:h-52 md:h-60 lg:h-72"
              unoptimized
              priority
            />
          ) : null}
          <div
            className={`flex flex-col items-center text-neutral-950 ${
              logoUrl ? "mt-7 md:mt-9" : ""
            }`}
            aria-label={brandTitle}
          >
            <p className="font-serif text-[clamp(3.5rem,11vw,6.5rem)] leading-none font-light tracking-[0.02em] italic">
              Lila
            </p>
            <p className="mt-4 text-[13px] font-medium tracking-[0.48em] text-neutral-950 uppercase sm:text-[14px] md:mt-5 md:text-[16px]">
              Boutique
            </p>
          </div>

          <div className="mt-8 grid w-full min-w-0 max-w-md grid-cols-2 gap-2.5 sm:mt-10 sm:gap-3">
            <Link
              href={shopHref}
              className="inline-flex min-h-12 items-center justify-center bg-neutral-950 px-3 py-3 text-center text-[10px] font-bold tracking-[0.14em] text-white uppercase transition-opacity hover:opacity-90 sm:min-h-14 sm:text-[12px]"
            >
              Alışverişe başla
            </Link>
            <Link
              href={saleHref}
              className="inline-flex min-h-12 items-center justify-center border border-neutral-950 bg-transparent px-3 py-3 text-center text-[10px] font-bold tracking-[0.14em] text-neutral-950 uppercase transition-colors hover:bg-neutral-950 hover:text-white sm:min-h-14 sm:text-[12px]"
            >
              İndirimdekiler
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      <HeroSlideDots
        multi={multi}
        index={index}
        slides={slides}
        onGoTo={onGoTo}
        label="Marka ve kampanya slaytları"
      />
    </div>
  );
}

function CampaignHeroSlide({
  boutiqueSlug,
  brandTitle,
  logoUrl,
  promo,
  multi,
  index,
  slides,
  onGoTo,
}: {
  boutiqueSlug: string;
  brandTitle: string;
  logoUrl: string | null;
  promo: EditorialHeroPromotion;
  multi: boolean;
  index: number;
  slides: EditorialHeroPromotion[];
  onGoTo: (next: number) => void;
}) {
  const subText = resolveCampaignSubText(promo);
  const campaignName = resolveCampaignName(promo);
  const subText2 = resolveCampaignSubText2(promo);
  const actions = resolveCampaignActions(promo);
  const watermark = promo.watermark?.trim().toLocaleUpperCase("tr");

  return (
    <div className="relative z-10 flex min-h-[70vh] w-full min-w-0 flex-col items-center justify-center overflow-hidden px-4 py-12 text-center text-white sm:px-5 md:min-h-[78vh] md:py-16">
      {watermark ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
          aria-hidden
        >
          <div
            className="flex w-full flex-col items-center justify-center font-black tracking-[-0.05em] text-black/[0.18] uppercase"
            style={{
              fontSize: `clamp(4.5rem, calc(100vw / ${Math.max(watermark.length, 1) * 0.62}), 22rem)`,
              lineHeight: 1.05,
            }}
          >
            {Array.from({ length: 12 }, (_, row) => (
              <span key={`wm-${row}`} className="block">
                {watermark}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={promo.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease }}
          className="relative flex w-full min-w-0 max-w-3xl flex-col items-center"
        >
          <div className="mb-6 flex flex-col items-center md:mb-8">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt=""
                width={320}
                height={320}
                className="h-28 w-auto object-contain sm:h-32 md:h-40 lg:h-44"
                unoptimized
                priority
              />
            ) : (
              <p className="font-serif text-[1.5rem] tracking-[0.06em] text-white md:text-[2rem] lg:text-[2.35rem]">
                {brandTitle}
              </p>
            )}
          </div>

          <p className="text-[11px] tracking-[0.28em] text-white/90 uppercase sm:text-[12px] md:text-[13px]">
            {subText}
          </p>
          <h2 className="mt-4 text-[clamp(2.25rem,8vw,4.75rem)] leading-[0.95] font-black tracking-[-0.03em] text-white uppercase">
            {campaignName}
          </h2>

          <div
            className={`mt-8 grid w-full min-w-0 max-w-xl gap-2.5 sm:gap-3 ${campaignActionsGridClass(actions.length)}`}
          >
            {actions.map((action) => (
              <Link
                key={`${action.label}-${action.target}-${action.indirim ? "sale" : "full"}`}
                href={promotionHref(boutiqueSlug, action.target, {
                  indirim: action.indirim,
                })}
                className="inline-flex min-h-12 min-w-0 items-center justify-center bg-white px-2 py-3 text-center text-[10px] font-bold tracking-[0.1em] break-words text-neutral-950 uppercase transition-opacity hover:opacity-90 sm:min-h-14 sm:px-3 sm:text-[12px] md:text-[13px]"
              >
                {action.label}
              </Link>
            ))}
          </div>

          {subText2.length > 0 ? (
            <div className="mt-8 space-y-1.5 text-[12px] leading-relaxed text-white/95 sm:text-[13px] md:text-[14px]">
              {subText2.map((line, lineIndex) => (
                <p
                  key={`${line}-${lineIndex}`}
                  className={
                    lineIndex === 0
                      ? "font-normal tracking-[0.04em]"
                      : "font-semibold tracking-[0.02em]"
                  }
                >
                  {line}
                </p>
              ))}
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <HeroSlideDots multi={multi} index={index} slides={slides} onGoTo={onGoTo} />
    </div>
  );
}

function ClassicHeroSlide({
  boutiqueSlug,
  brandTitle,
  logoUrl,
  promo,
  multi,
  index,
  slides,
  onGoTo,
}: {
  boutiqueSlug: string;
  brandTitle: string;
  logoUrl: string | null;
  promo: EditorialHeroPromotion;
  multi: boolean;
  index: number;
  slides: EditorialHeroPromotion[];
  onGoTo: (next: number) => void;
}) {
  const align = promo.contentAlign ?? "center";
  const sideAligned = align === "left" || align === "right";
  const actions = resolveCampaignActions(promo).slice(0, 3);
  const subText = resolveCampaignSubText(promo);
  const title = resolveCampaignName(promo);

  if (sideAligned) {
    return (
      <div className="relative z-10 flex min-h-[70vh] w-full min-w-0 items-end justify-center px-5 pb-16 pt-20 text-white sm:px-8 md:min-h-[78vh] md:items-center md:justify-start md:px-12 md:pb-14 md:pt-14 lg:px-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease }}
            className={`flex w-full max-w-xl flex-col items-center text-center md:items-stretch ${
              align === "right"
                ? "md:ml-auto md:items-end md:text-right"
                : "md:mr-auto md:items-start md:text-left"
            }`}
          >
            <p className="text-[11px] tracking-[0.22em] text-white/85 uppercase sm:text-[12px]">
              {subText}
            </p>
            <h2 className="mt-4 text-[clamp(1.85rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.02em] text-white uppercase drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)]">
              {title}
            </h2>
            <div
              className={`mt-7 flex w-full max-w-md flex-wrap justify-center gap-2.5 ${
                align === "right" ? "md:justify-end" : "md:justify-start"
              }`}
            >
              {actions.map((action, actionIndex) => (
                <Link
                  key={`${action.label}-${action.target}`}
                  href={promotionHref(boutiqueSlug, action.target, {
                    indirim: action.indirim,
                  })}
                  className={`inline-flex min-h-11 items-center justify-center px-5 py-3 text-[11px] font-bold tracking-[0.14em] uppercase transition-opacity hover:opacity-90 sm:min-h-12 sm:text-[12px] ${
                    actionIndex === 0
                      ? "bg-neutral-950 text-white"
                      : "border border-white/80 bg-white/10 text-white backdrop-blur-sm"
                  }`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <HeroSlideDots
          multi={multi}
          index={index}
          slides={slides}
          onGoTo={onGoTo}
        />
      </div>
    );
  }

  return (
    <div className="relative z-10 flex min-h-[72vh] flex-col items-center justify-between px-5 py-10 text-center text-white md:min-h-[85vh] md:py-14">
      <div className="flex flex-col items-center pt-2 md:pt-6">
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

      <div className="flex max-w-xl flex-col items-center pb-6 md:pb-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease }}
            className="flex flex-col items-center"
          >
            <p className="text-[13px] tracking-[0.08em] text-white/80 uppercase md:text-[15px]">
              {subText}
            </p>
            <p className="editorial-sale-text mt-3 text-[28px] leading-tight font-semibold tracking-[-0.02em] uppercase md:text-5xl lg:text-6xl">
              {title}
            </p>
            <Link
              href={promotionHref(boutiqueSlug, promo.target)}
              className="editorial-promo-cta mt-6 inline-flex min-h-11 items-center bg-brand-primary px-6 py-3 text-[12px] tracking-[0.2em] text-white uppercase transition-opacity hover:opacity-90 md:text-[13px]"
            >
              {promo.cta}
            </Link>
          </motion.div>
        </AnimatePresence>

        <HeroSlideDots
          multi={multi}
          index={index}
          slides={slides}
          onGoTo={onGoTo}
        />
      </div>
    </div>
  );
}
