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

/** Soft atelier brand wash — panel-adjacent lilac, not saturated accent. */
const BRAND_PANEL_CANVAS = "#F7F3F8";
const BRAND_PANEL_SOFT = "#EDE6F2";
const BRAND_PANEL_SOFTER = "#F3EEF6";
const BRAND_PANEL_ACCENT_MUTED = "rgba(155, 126, 189, 0.18)";
/** Matches brand type + tinted logo. */
const BRAND_INK = "#5A4A78";

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

function buildBrandIntroSlide(_accent?: string): EditorialHeroPromotion {
  return {
    id: BRAND_INTRO_SLIDE_ID,
    template: "brand",
    backgroundColor: BRAND_PANEL_CANVAS,
    promoLine: "",
    discountLine: "",
    cta: "",
  };
}

/** Quiet botanical line art — professional, denser corner flourishes. */
function BrandHeroLineArt() {
  const stroke = BRAND_INK;
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.26]"
      viewBox="0 0 1200 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Top-left stem + blooms */}
      <g stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M72 40c18 70 28 140 22 220" />
        <path d="M94 96c-28 8-48 34-42 58 14-6 34-10 48-22" />
        <path d="M88 168c-32 12-52 40-44 66 16-8 38-14 52-28" />
        <path d="M80 248c24-18 52-22 74-10" />
        <path d="M70 130c-22 20-28 48-12 70" />
        <path d="M110 210c18 16 22 42 8 62" />
        <circle cx="94" cy="92" r="14" />
        <circle cx="94" cy="92" r="5" />
        <circle cx="86" cy="164" r="12" />
        <circle cx="86" cy="164" r="4" />
        <circle cx="78" cy="230" r="9" />
        <path d="M100 88c10-16 28-22 40-14" />
        <path d="M88 100c-8 14-6 32 6 42" />
        <path d="M118 78c14-10 32-8 42 6" />
        <path d="M54 150c-12 8-18 24-10 38" />
      </g>
      {/* Top-right cluster */}
      <g
        stroke={stroke}
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(1200 0) scale(-1 1)"
      >
        <path d="M90 36c12 54 10 110 -6 168" />
        <path d="M84 88c-24 14-36 40-24 62 12-10 30-18 44-20" />
        <circle cx="82" cy="84" r="11" />
        <circle cx="82" cy="84" r="4" />
        <path d="M98 120c20-6 40 4 48 22" />
        <path d="M70 140c-18 16-16 42 4 54" />
        <circle cx="74" cy="148" r="8" />
        <path d="M108 56c16-12 34-10 46 4" />
      </g>
      {/* Bottom-left cluster */}
      <g
        stroke={stroke}
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(0 800) scale(1 -1)"
      >
        <path d="M90 36c12 54 10 110 -6 168" />
        <path d="M84 88c-24 14-36 40-24 62 12-10 30-18 44-20" />
        <circle cx="82" cy="84" r="11" />
        <circle cx="82" cy="84" r="4" />
        <path d="M98 120c20-6 40 4 48 22" />
        <path d="M70 140c-18 16-16 42 4 54" />
        <circle cx="74" cy="148" r="8" />
      </g>
      {/* Bottom-right mirror flourish */}
      <g
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(1200 800) rotate(180)"
      >
        <path d="M72 40c18 70 28 140 22 220" />
        <path d="M94 96c-28 8-48 34-42 58 14-6 34-10 48-22" />
        <path d="M88 168c-32 12-52 40-44 66 16-8 38-14 52-28" />
        <path d="M80 248c24-18 52-22 74-10" />
        <path d="M70 130c-22 20-28 48-12 70" />
        <circle cx="94" cy="92" r="14" />
        <circle cx="94" cy="92" r="5" />
        <circle cx="86" cy="164" r="12" />
        <circle cx="86" cy="164" r="4" />
        <circle cx="78" cy="230" r="9" />
        <path d="M100 88c10-16 28-22 40-14" />
        <path d="M88 100c-8 14-6 32 6 42" />
      </g>
      {/* Soft side arcs + mid accents */}
      <path
        d="M1080 120c40 80 48 170 20 260"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M1140 200c24 60 20 130 -8 190"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M120 620c-36-70-40-150-12-230"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M60 540c-20-54-14-120 12-176"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="1100" cy="300" r="7" stroke={stroke} strokeWidth="1" opacity="0.6" />
      <circle cx="1124" cy="340" r="4" stroke={stroke} strokeWidth="1" opacity="0.5" />
      <circle cx="100" cy="480" r="7" stroke={stroke} strokeWidth="1" opacity="0.6" />
      <circle cx="76" cy="520" r="4" stroke={stroke} strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/** Matches logo-slide CTAs — lilac primary / soft secondary. */
function heroCtaClassName(primary: boolean): string {
  const base =
    "inline-flex min-h-12 w-full items-center justify-center rounded-xl px-3 py-3 text-center text-[10px] font-bold tracking-[0.14em] uppercase shadow-sm sm:min-h-14 sm:text-[12px]";
  if (primary) {
    return `${base} bg-[#9B7EBD] text-white transition-opacity hover:opacity-90`;
  }
  return `${base} border border-[#9B7EBD]/35 bg-white/90 text-[#5A4A78] transition-colors hover:border-[#9B7EBD] hover:bg-[#9B7EBD] hover:text-white`;
}

function heroActionsGridClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 3) return "grid-cols-1 sm:grid-cols-3";
  return "grid-cols-2";
}

/**
 * Professional panel-inspired wash for the logo intro —
 * soft lilac canvas + quiet accent blooms + line art.
 */
function BrandHeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            160deg,
            #FFFFFF 0%,
            ${BRAND_PANEL_CANVAS} 32%,
            ${BRAND_PANEL_SOFTER} 62%,
            ${BRAND_PANEL_SOFT} 100%
          )`,
        }}
      />
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(
            ellipse 85% 70% at 50% 28%,
            rgba(255,255,255,0.95) 0%,
            rgba(255,255,255,0.35) 42%,
            transparent 72%
          )`,
        }}
      />
      <div
        className="absolute -right-[12%] top-[8%] h-[48%] w-[42%] rounded-full"
        style={{
          background: `radial-gradient(ellipse at center, ${BRAND_PANEL_ACCENT_MUTED} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute -left-[8%] bottom-[6%] h-[40%] w-[46%] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(155, 126, 189, 0.1) 0%, transparent 72%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            "linear-gradient(to top, rgba(237, 230, 242, 0.55) 0%, transparent 100%)",
        }}
      />
      <BrandHeroLineArt />
    </div>
  );
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
          ) : brandMode ? (
            <BrandHeroBackground />
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
          ) : campaignMode ? (
            <div
              className="absolute inset-0 opacity-[0.14]"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 20%, white 0%, transparent 55%)",
              }}
              aria-hidden
            />
          ) : null}
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
  tone = "light",
}: {
  multi: boolean;
  index: number;
  slides: EditorialHeroPromotion[];
  onGoTo: (next: number) => void;
  label?: string;
  /** `light` = white dots on dark photos; `dark` = charcoal on soft brand wash. */
  tone?: "light" | "dark";
}) {
  if (!multi) return null;
  const activeCls = tone === "dark" ? "bg-neutral-800" : "bg-white";
  const idleCls =
    tone === "dark"
      ? "bg-neutral-800/25 hover:bg-neutral-800/50"
      : "bg-white/40 hover:bg-white/70";
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
              selected ? `w-8 ${activeCls}` : `w-1.5 ${idleCls}`
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
    <div className="relative z-10 flex min-h-[70vh] w-full min-w-0 flex-col items-center justify-center overflow-hidden px-4 py-12 text-center sm:px-5 md:min-h-[78vh] md:py-16">
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
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease, delay: 0.05 }}
              className="relative h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56 lg:h-64 lg:w-64"
            >
              {/* Hidden for layout/preload; visible mark is ink-tinted via mask */}
              <Image
                src={logoUrl}
                alt=""
                width={480}
                height={480}
                className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-0"
                unoptimized
                priority
              />
              <div
                role="img"
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundColor: BRAND_INK,
                  WebkitMaskImage: `url(${logoUrl})`,
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskImage: `url(${logoUrl})`,
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  maskSize: "contain",
                }}
              />
            </motion.div>
          ) : null}
          <div
            className={`flex flex-col items-center ${
              logoUrl ? "mt-6 md:mt-8" : ""
            }`}
            aria-label={brandTitle}
          >
            <p
              className="font-serif text-[clamp(3.25rem,10vw,6rem)] leading-none font-light tracking-[0.03em] italic"
              style={{ color: BRAND_INK }}
            >
              Lila
            </p>
            <p
              className="mt-3 text-[12px] font-medium tracking-[0.42em] uppercase sm:text-[13px] md:mt-4 md:text-[15px]"
              style={{ color: BRAND_INK, opacity: 0.7 }}
            >
              Boutique
            </p>
          </div>

          <div className="mt-8 grid w-full min-w-0 max-w-sm grid-cols-2 gap-2.5 sm:mt-10 sm:max-w-md sm:gap-3">
            <Link href={shopHref} className={heroCtaClassName(true)}>
              Alışverişe başla
            </Link>
            <Link href={saleHref} className={heroCtaClassName(false)}>
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
        tone="dark"
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
            className={`mt-8 grid w-full min-w-0 max-w-md gap-2.5 sm:gap-3 ${campaignActionsGridClass(actions.length)}`}
          >
            {actions.map((action, actionIndex) => (
              <Link
                key={`${action.label}-${action.target}-${action.indirim ? "sale" : "full"}`}
                href={promotionHref(boutiqueSlug, action.target, {
                  indirim: action.indirim,
                })}
                className={heroCtaClassName(actionIndex === 0)}
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
            className={`flex w-full max-w-xl flex-col items-center text-center ${
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
              className={`mt-7 grid w-full max-w-sm gap-2.5 sm:max-w-md sm:gap-3 ${heroActionsGridClass(actions.length)}`}
            >
              {actions.map((action, actionIndex) => (
                <Link
                  key={`${action.label}-${action.target}`}
                  href={promotionHref(boutiqueSlug, action.target, {
                    indirim: action.indirim,
                  })}
                  className={heroCtaClassName(actionIndex === 0)}
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
              className={`${heroCtaClassName(true)} mt-6 max-w-xs`}
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
