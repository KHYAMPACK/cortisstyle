"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { TrBoutiqueEditorialProductCard } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialProductCard";
import { useStorefrontTaxonomy } from "@/components/tr/boutique/TrBoutiqueTaxonomy";
import { trBoutiqueProductsPath } from "@/lib/tr/paths";
import type { TrProduct } from "@/types/tr-marketplace";

const MARQUEE_CARD_SIZES = "(max-width: 768px) 46vw, 240px";
const CARD_WIDTH_CLASS =
  "w-[40vw] max-w-[16.5rem] shrink-0 sm:w-[30vw] md:max-w-none md:w-[14.5rem] lg:w-[16rem]";
const PIXELS_PER_FRAME = 0.55;
const RESUME_AFTER_MS = 1800;

function copyCount(productCount: number, reduceMotion: boolean): number {
  if (reduceMotion || productCount <= 1) return 1;
  return Math.max(2, Math.ceil(8 / productCount));
}

function categoryPlpHref(boutiqueSlug: string, categoryId: string): string {
  if (categoryId === "diger" || categoryId === "sale") {
    return trBoutiqueProductsPath(boutiqueSlug);
  }
  return trBoutiqueProductsPath(boutiqueSlug, { kategori: categoryId });
}

interface TrBoutiqueAtelierCategoryMarqueeProps {
  categoryId: string;
  label: string;
  products: TrProduct[];
  boutiqueSlug: string;
  boutiqueName: string;
  reverse?: boolean;
  priority?: boolean;
}

export function TrBoutiqueAtelierCategoryMarquee({
  categoryId,
  label,
  products,
  boutiqueSlug,
  boutiqueName,
  reverse = false,
  priority = false,
}: TrBoutiqueAtelierCategoryMarqueeProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const taxonomy = useStorefrontTaxonomy();
  const productKey = products.map((product) => product.id).join("|");
  const plpHref = categoryPlpHref(boutiqueSlug, categoryId);
  const shopAll =
    categoryId === "diger"
      ? "Tüm ürünler"
      : taxonomy.shopAllLabel(categoryId);
  const copies =
    products.length > 1 ? Math.max(2, Math.ceil(8 / products.length)) : 1;

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || products.length === 0) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const loopCopies = copyCount(products.length, reduceMotion);
    if (loopCopies < 2) return;

    const speed = reverse ? -PIXELS_PER_FRAME : PIXELS_PER_FRAME;
    const paused = { hover: false, offscreen: true, user: false };
    let autoScrolling = false;
    let raf = 0;
    let resumeTimer = 0;

    const isPaused = () =>
      paused.hover || paused.offscreen || paused.user || document.hidden;

    const wrapScroll = () => {
      const loopAt = scroller.scrollWidth / loopCopies;
      if (loopAt < 8) return;
      if (speed > 0 && scroller.scrollLeft >= loopAt - 0.5) {
        scroller.scrollLeft -= loopAt;
      } else if (speed < 0 && scroller.scrollLeft <= 0.5) {
        scroller.scrollLeft += loopAt;
      }
    };

    const tick = () => {
      if (!isPaused() && scroller.scrollWidth > scroller.clientWidth + 8) {
        autoScrolling = true;
        scroller.scrollLeft += speed;
        wrapScroll();
        autoScrolling = false;
      }
      raf = requestAnimationFrame(tick);
    };

    if (reverse) {
      scroller.scrollLeft = scroller.scrollWidth / loopCopies;
    }

    const pauseUser = () => {
      paused.user = true;
      window.clearTimeout(resumeTimer);
    };
    const resumeUserSoon = () => {
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        paused.user = false;
      }, RESUME_AFTER_MS);
    };

    const onPointerEnter = () => {
      paused.hover = true;
    };
    const onPointerLeave = () => {
      paused.hover = false;
    };
    const onFocusIn = () => {
      paused.hover = true;
    };
    const onFocusOut = (event: FocusEvent) => {
      if (!scroller.contains(event.relatedTarget as Node | null)) {
        paused.hover = false;
      }
    };
    const onPointerDown = () => {
      pauseUser();
    };
    const onPointerUp = () => {
      resumeUserSoon();
    };
    const onScroll = () => {
      if (autoScrolling) return;
      pauseUser();
      resumeUserSoon();
    };

    scroller.addEventListener("pointerenter", onPointerEnter);
    scroller.addEventListener("pointerleave", onPointerLeave);
    scroller.addEventListener("focusin", onFocusIn);
    scroller.addEventListener("focusout", onFocusOut);
    scroller.addEventListener("pointerdown", onPointerDown);
    scroller.addEventListener("pointerup", onPointerUp);
    scroller.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        paused.offscreen = !entry?.isIntersecting;
      },
      { threshold: 0.12 },
    );
    io.observe(scroller);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resumeTimer);
      scroller.removeEventListener("pointerenter", onPointerEnter);
      scroller.removeEventListener("pointerleave", onPointerLeave);
      scroller.removeEventListener("focusin", onFocusIn);
      scroller.removeEventListener("focusout", onFocusOut);
      scroller.removeEventListener("pointerdown", onPointerDown);
      scroller.removeEventListener("pointerup", onPointerUp);
      scroller.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, [productKey, products.length, reverse]);

  return (
    <section aria-label={label} className="min-w-0">
      <div className="flex items-center justify-between gap-4 px-4 md:px-8">
        <h2 className="font-serif text-[1.55rem] font-light tracking-[-0.01em] text-neutral-950 md:text-[1.85rem]">
          {label}
        </h2>
        <Link
          href={plpHref}
          className="inline-flex min-h-11 shrink-0 items-center text-[11px] tracking-[0.16em] text-neutral-600 uppercase underline-offset-[5px] transition-colors hover:text-neutral-950 hover:underline"
        >
          {shopAll}
        </Link>
      </div>

      <div
        ref={scrollerRef}
        className="atelier-category-marquee mt-5 flex touch-pan-x gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 md:gap-5 md:px-8"
        aria-label={`${label} ürünleri`}
      >
        {Array.from({ length: copies }, (_, copyIndex) =>
          products.map((product, index) => (
            <div
              key={`${copyIndex}-${product.id}`}
              className={`${CARD_WIDTH_CLASS}${copyIndex > 0 ? " motion-reduce:hidden" : ""}`}
              {...(copyIndex > 0
                ? { inert: true, "aria-hidden": true }
                : undefined)}
            >
              <TrBoutiqueEditorialProductCard
                product={product}
                boutiqueSlug={boutiqueSlug}
                boutiqueName={boutiqueName}
                compact
                sizes={MARQUEE_CARD_SIZES}
                priority={copyIndex === 0 && priority && index < 3}
              />
            </div>
          )),
        )}
      </div>
    </section>
  );
}
