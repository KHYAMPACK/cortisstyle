"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  Palette,
  Plus,
  Search,
  SlidersHorizontal,
  Tag,
  TurkishLira,
  X,
} from "lucide-react";
import { TrBoutiqueEditorialProductCard } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialProductCard";
import { getEditorialContent } from "@/lib/tr/boutiqueHome";
import { getTrCategoryLabel, isTrCategoryMatch } from "@/lib/tr/categories";
import { trBoutiquePath, trBoutiqueProductsPath } from "@/lib/tr/paths";
import {
  resolveProductColors,
  resolveProductSizes,
  sortProductSizes,
} from "@/lib/tr/productOptions";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

const EASE = [0.22, 1, 0.36, 1] as const;

function FilterSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-7 w-[2.75rem] shrink-0 items-center border p-0.5 transition-colors duration-200 ${
        checked
          ? "border-neutral-900 bg-neutral-900"
          : "border-neutral-300 bg-neutral-100"
      }`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 bg-white shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          checked ? "translate-x-[1.15rem]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

type SortId = "default" | "price-asc" | "price-desc" | "new";

type PriceBucketId = "0-500" | "500-1000" | "1000-2000" | "2000+";

type FilterDraft = {
  saleOnly: boolean;
  categoryId: string | null;
  renk: string;
  beden: string;
  fiyat: PriceBucketId | "";
  sira: SortId;
};

const PRICE_BUCKETS: Array<{
  id: PriceBucketId;
  label: string;
  minKurus: number;
  maxKurus: number | null;
}> = [
  { id: "0-500", label: "0 – 500 TL", minKurus: 0, maxKurus: 50_000 },
  {
    id: "500-1000",
    label: "500 – 1.000 TL",
    minKurus: 50_000,
    maxKurus: 100_000,
  },
  {
    id: "1000-2000",
    label: "1.000 – 2.000 TL",
    minKurus: 100_000,
    maxKurus: 200_000,
  },
  { id: "2000+", label: "2.000 TL+", minKurus: 200_000, maxKurus: null },
];

const SORT_OPTIONS: Array<{ id: SortId; label: string }> = [
  { id: "default", label: "Öne çıkan" },
  { id: "new", label: "En yeniler" },
  { id: "price-asc", label: "Fiyat: düşükten yükseğe" },
  { id: "price-desc", label: "Fiyat: yüksekten düşüğe" },
];

interface TrBoutiqueAtelierPlpProps {
  boutique: TrBoutiquePublic;
  products: TrProduct[];
}

function isOnSale(product: TrProduct): boolean {
  return (
    typeof product.compareAtPriceKurus === "number" &&
    product.compareAtPriceKurus > product.priceKurus
  );
}

function pageTitle(opts: {
  saleOnly: boolean;
  categoryFilter: string | null;
  q: string;
}): string {
  if (opts.q) return `“${opts.q}”`;
  if (opts.saleOnly) return "İndirimdekiler";
  if (opts.categoryFilter) {
    return getTrCategoryLabel(opts.categoryFilter) ?? opts.categoryFilter;
  }
  return "Tüm ürünler";
}

function parsePriceBucket(value: string | null): PriceBucketId | "" {
  if (!value) return "";
  return PRICE_BUCKETS.some((b) => b.id === value)
    ? (value as PriceBucketId)
    : "";
}

function matchesPriceBucket(priceKurus: number, bucketId: PriceBucketId | "") {
  if (!bucketId) return true;
  const bucket = PRICE_BUCKETS.find((b) => b.id === bucketId);
  if (!bucket) return true;
  if (priceKurus < bucket.minKurus) return false;
  if (bucket.maxKurus != null && priceKurus >= bucket.maxKurus) return false;
  return true;
}

function countDraftFilters(draft: FilterDraft): number {
  let n = 0;
  if (draft.saleOnly) n += 1;
  if (draft.categoryId) n += 1;
  if (draft.renk) n += 1;
  if (draft.beden) n += 1;
  if (draft.fiyat) n += 1;
  if (draft.sira !== "default") n += 1;
  return n;
}

type CategoryChip = {
  id: string;
  label: string;
  image?: string;
  kind: "all" | "category" | "sale";
};

type AccordionId = "sort" | "category" | "size" | "color" | "price";

/**
 * Paul Fredrick–inspired PLP for atelier: clear category title, chip nav,
 * desktop sidebar + mobile filter/sort overlay.
 */
export function TrBoutiqueAtelierPlp({
  boutique,
  products,
}: TrBoutiqueAtelierPlpProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const content = getEditorialContent(boutique);

  const kategori = searchParams.get("kategori")?.trim() || null;
  const saleOnly = searchParams.get("indirim") === "1" || kategori === "sale";
  const categoryFilter =
    saleOnly || kategori === "sale" ? null : kategori;
  const q = searchParams.get("q")?.trim().toLocaleLowerCase("tr") || "";
  const renkParam = searchParams.get("renk")?.trim() || "";
  const bedenParam = searchParams.get("beden")?.trim() || "";
  const fiyatParam = parsePriceBucket(searchParams.get("fiyat")?.trim() || null);
  const siraParam = (searchParams.get("sira")?.trim() || "default") as SortId;

  const [searchDraft, setSearchDraft] = useState(
    searchParams.get("q")?.trim() ?? "",
  );
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [colorOpen, setColorOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<AccordionId | null>(
    "sort",
  );
  const [draft, setDraft] = useState<FilterDraft>({
    saleOnly,
    categoryId: categoryFilter,
    renk: renkParam,
    beden: bedenParam,
    fiyat: fiyatParam,
    sira: siraParam,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSearchDraft(searchParams.get("q")?.trim() ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileFiltersOpen]);

  const imageByCategory = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of content.shopCategories ?? []) {
      if (item.image) map.set(item.categoryId, item.image);
    }
    for (const item of content.featuredPair) {
      if (item.image) map.set(item.categoryId, item.image);
    }
    for (const item of content.categoryTiles) {
      if (item.image) map.set(item.categoryId, item.image);
    }
    return map;
  }, [content]);

  const colorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) {
      for (const color of resolveProductColors(product)) {
        if (!map.has(color.name)) map.set(color.name, color.hex);
      }
    }
    return [...map.entries()]
      .map(([name, hex]) => ({ name, hex }))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [products]);

  const sizeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      for (const size of resolveProductSizes(product)) {
        set.add(size);
      }
    }
    return sortProductSizes([...set]);
  }, [products]);

  const categoryOptions = useMemo(() => {
    const ids = new Set(
      products
        .map((p) => p.category?.trim())
        .filter((value): value is string => Boolean(value)),
    );
    return [...ids]
      .map((id) => ({
        id,
        label: getTrCategoryLabel(id) ?? id,
        image: imageByCategory.get(id),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "tr"));
  }, [imageByCategory, products]);

  const chips: CategoryChip[] = useMemo(() => {
    return [
      { id: "all", label: "Tümü", kind: "all" },
      ...categoryOptions.map((entry) => ({
        id: entry.id,
        label: entry.label,
        image: entry.image,
        kind: "category" as const,
      })),
      {
        id: "sale",
        label: "İndirim",
        image: imageByCategory.get("sale"),
        kind: "sale" as const,
      },
    ];
  }, [categoryOptions, imageByCategory]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.status === "available");

    if (saleOnly) {
      list = list.filter(isOnSale);
    } else if (categoryFilter) {
      list = list.filter((p) =>
        isTrCategoryMatch(p.category, categoryFilter),
      );
    }

    if (q) {
      list = list.filter((p) =>
        p.title.toLocaleLowerCase("tr").includes(q),
      );
    }

    if (renkParam) {
      list = list.filter((p) =>
        resolveProductColors(p).some((c) => c.name === renkParam),
      );
    }

    if (bedenParam) {
      list = list.filter((p) =>
        resolveProductSizes(p).some((size) => size === bedenParam),
      );
    }

    if (fiyatParam) {
      list = list.filter((p) => matchesPriceBucket(p.priceKurus, fiyatParam));
    }

    const sorted = [...list];
    switch (siraParam) {
      case "price-asc":
        sorted.sort((a, b) => a.priceKurus - b.priceKurus);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.priceKurus - a.priceKurus);
        break;
      case "new":
        sorted.sort((a, b) => {
          const aNew = a.conditionLabel?.includes("Yeni") ? 1 : 0;
          const bNew = b.conditionLabel?.includes("Yeni") ? 1 : 0;
          if (aNew !== bNew) return bNew - aNew;
          return a.sortOrder - b.sortOrder;
        });
        break;
      default:
        sorted.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return sorted;
  }, [
    bedenParam,
    categoryFilter,
    fiyatParam,
    products,
    q,
    renkParam,
    saleOnly,
    siraParam,
  ]);

  const replaceParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const openMobileFilters = () => {
    setDraft({
      saleOnly,
      categoryId: categoryFilter,
      renk: renkParam,
      beden: bedenParam,
      fiyat: fiyatParam,
      sira: siraParam,
    });
    setOpenAccordion("sort");
    setMobileFiltersOpen(true);
  };

  const applyDraft = () => {
    replaceParams({
      indirim: draft.saleOnly ? "1" : null,
      kategori: draft.saleOnly ? null : draft.categoryId,
      renk: draft.renk || null,
      beden: draft.beden || null,
      fiyat: draft.fiyat || null,
      sira: draft.sira === "default" ? null : draft.sira,
    });
    setMobileFiltersOpen(false);
  };

  const title = pageTitle({ saleOnly, categoryFilter, q });
  const hasActiveFilters = Boolean(
    renkParam ||
      saleOnly ||
      categoryFilter ||
      q ||
      bedenParam ||
      fiyatParam ||
      siraParam !== "default",
  );
  const draftCount = countDraftFilters(draft);

  const activeFilterChips: Array<{
    id: string;
    label: string;
    clear: Record<string, string | null>;
  }> = [];
  if (saleOnly) {
    activeFilterChips.push({
      id: "sale",
      label: "İndirim",
      clear: { indirim: null, kategori: null },
    });
  } else if (categoryFilter) {
    activeFilterChips.push({
      id: `cat-${categoryFilter}`,
      label: getTrCategoryLabel(categoryFilter) ?? categoryFilter,
      clear: { kategori: null },
    });
  }
  if (renkParam) {
    activeFilterChips.push({
      id: `renk-${renkParam}`,
      label: renkParam,
      clear: { renk: null },
    });
  }
  if (bedenParam) {
    activeFilterChips.push({
      id: `beden-${bedenParam}`,
      label: `Beden ${bedenParam}`,
      clear: { beden: null },
    });
  }
  if (fiyatParam) {
    activeFilterChips.push({
      id: `fiyat-${fiyatParam}`,
      label:
        PRICE_BUCKETS.find((b) => b.id === fiyatParam)?.label ?? fiyatParam,
      clear: { fiyat: null },
    });
  }
  if (q) {
    activeFilterChips.push({
      id: `q-${q}`,
      label: `Ara: ${q}`,
      clear: { q: null },
    });
  }

  const selectChip = (chip: CategoryChip) => {
    if (chip.kind === "all") {
      replaceParams({ kategori: null, indirim: null });
      return;
    }
    if (chip.kind === "sale") {
      replaceParams({ kategori: null, indirim: "1" });
      return;
    }
    replaceParams({ kategori: chip.id, indirim: null });
  };

  const chipActive = (chip: CategoryChip) => {
    if (chip.kind === "all") return !saleOnly && !categoryFilter;
    if (chip.kind === "sale") return saleOnly;
    return categoryFilter === chip.id;
  };

  const toggleAccordion = (id: AccordionId) => {
    setOpenAccordion((current) => (current === id ? null : id));
  };

  const desktopFilterPanel = (
    <div className="space-y-0">
      <div className="flex items-center justify-between gap-3 border-b border-black/10 py-4">
        <span className="text-[13px] text-neutral-900">Yalnızca indirim</span>
        <FilterSwitch
          checked={saleOnly}
          label="Yalnızca indirim"
          onChange={() =>
            replaceParams(
              saleOnly
                ? { indirim: null, kategori: null }
                : { indirim: "1", kategori: null },
            )
          }
        />
      </div>

      <DesktopAccordion
        title="Kategori"
        open={categoryOpen}
        onToggle={() => setCategoryOpen((o) => !o)}
      >
        <OptionButton
          active={!saleOnly && !categoryFilter}
          onClick={() => replaceParams({ kategori: null, indirim: null })}
          label="Tüm ürünler"
        />
        {categoryOptions.map((entry) => (
          <OptionButton
            key={entry.id}
            active={categoryFilter === entry.id}
            onClick={() =>
              replaceParams({ kategori: entry.id, indirim: null })
            }
            label={entry.label}
          />
        ))}
      </DesktopAccordion>

      {sizeOptions.length > 0 ? (
        <DesktopAccordion
          title="Beden"
          open={sizeOpen}
          onToggle={() => setSizeOpen((o) => !o)}
        >
          <OptionButton
            active={!bedenParam}
            onClick={() => replaceParams({ beden: null })}
            label="Tümü"
          />
          <div className="flex flex-wrap gap-2 pb-1">
            {sizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() =>
                  replaceParams({
                    beden: bedenParam === size ? null : size,
                  })
                }
                className={`min-w-10 border px-2.5 py-1.5 text-[12px] ${
                  bedenParam === size
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-800"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </DesktopAccordion>
      ) : null}

      {colorOptions.length > 0 ? (
        <DesktopAccordion
          title="Renk"
          open={colorOpen}
          onToggle={() => setColorOpen((o) => !o)}
        >
          <OptionButton
            active={!renkParam}
            onClick={() => replaceParams({ renk: null })}
            label="Tümü"
          />
          {colorOptions.map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={() =>
                replaceParams({
                  renk: renkParam === color.name ? null : color.name,
                })
              }
              className={`flex w-full items-center gap-2.5 py-1.5 text-left text-[13px] ${
                renkParam === color.name
                  ? "font-medium text-neutral-950"
                  : "text-neutral-600 hover:text-neutral-950"
              }`}
            >
              <span
                className="h-3.5 w-3.5 shrink-0 border border-black/15"
                style={{ backgroundColor: color.hex }}
                aria-hidden
              />
              {color.name}
            </button>
          ))}
        </DesktopAccordion>
      ) : null}

      <DesktopAccordion
        title="Fiyat"
        open={priceOpen}
        onToggle={() => setPriceOpen((o) => !o)}
      >
        <OptionButton
          active={!fiyatParam}
          onClick={() => replaceParams({ fiyat: null })}
          label="Tümü"
        />
        {PRICE_BUCKETS.map((bucket) => (
          <OptionButton
            key={bucket.id}
            active={fiyatParam === bucket.id}
            onClick={() =>
              replaceParams({
                fiyat: fiyatParam === bucket.id ? null : bucket.id,
              })
            }
            label={bucket.label}
          />
        ))}
      </DesktopAccordion>
    </div>
  );

  const mobileFilterModal = mounted
    ? createPortal(
        <AnimatePresence>
          {mobileFiltersOpen ? (
            <motion.div
              key="atelier-filter-overlay"
              className="fixed inset-0 z-[120] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              <button
                type="button"
                aria-label="Filtreleri kapat"
                className="absolute inset-0 bg-black/45"
                onClick={() => setMobileFiltersOpen(false)}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Filtrele ve sırala"
                className="absolute inset-x-3 top-[10%] bottom-[10%] flex flex-col bg-[#FAFAF8] shadow-[0_24px_60px_rgba(42,36,48,0.18)] sm:inset-x-8"
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.28, ease: EASE }}
              >
              <div className="absolute -top-12 left-1/2 z-10 -translate-x-1/2">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Kapat"
                  className="flex h-10 w-10 items-center justify-center border border-white/40 bg-white text-neutral-900"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
                <MobileAccordion
                  icon={<SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />}
                  title="Sırala"
                  open={openAccordion === "sort"}
                  onToggle={() => toggleAccordion("sort")}
                >
                  {SORT_OPTIONS.map((option) => (
                    <OptionButton
                      key={option.id}
                      active={draft.sira === option.id}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          sira: option.id,
                        }))
                      }
                      label={option.label}
                    />
                  ))}
                </MobileAccordion>

                <div className="flex items-center justify-between gap-3 border-b border-black/10 py-4">
                  <span className="text-[14px] text-neutral-900">
                    Yalnızca indirim
                  </span>
                  <FilterSwitch
                    checked={draft.saleOnly}
                    label="Yalnızca indirim"
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        saleOnly: !current.saleOnly,
                        categoryId: !current.saleOnly
                          ? null
                          : current.categoryId,
                      }))
                    }
                  />
                </div>

                <MobileAccordion
                  icon={<Tag className="h-4 w-4" strokeWidth={1.5} />}
                  title="Kategori"
                  open={openAccordion === "category"}
                  onToggle={() => toggleAccordion("category")}
                >
                  <OptionButton
                    active={!draft.saleOnly && !draft.categoryId}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        saleOnly: false,
                        categoryId: null,
                      }))
                    }
                    label="Tüm ürünler"
                  />
                  {categoryOptions.map((entry) => (
                    <OptionButton
                      key={entry.id}
                      active={
                        !draft.saleOnly && draft.categoryId === entry.id
                      }
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          saleOnly: false,
                          categoryId: entry.id,
                        }))
                      }
                      label={entry.label}
                    />
                  ))}
                </MobileAccordion>

                {sizeOptions.length > 0 ? (
                  <MobileAccordion
                    icon={
                      <ArrowLeftRight className="h-4 w-4" strokeWidth={1.5} />
                    }
                    title="Beden"
                    open={openAccordion === "size"}
                    onToggle={() => toggleAccordion("size")}
                  >
                    <div className="flex flex-wrap gap-2 pb-2">
                      {sizeOptions.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              beden:
                                current.beden === size ? "" : size,
                            }))
                          }
                          className={`min-w-10 border px-2.5 py-1.5 text-[12px] ${
                            draft.beden === size
                              ? "border-neutral-900 bg-neutral-900 text-white"
                              : "border-neutral-300 text-neutral-800"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </MobileAccordion>
                ) : null}

                {colorOptions.length > 0 ? (
                  <MobileAccordion
                    icon={<Palette className="h-4 w-4" strokeWidth={1.5} />}
                    title="Renk"
                    open={openAccordion === "color"}
                    onToggle={() => toggleAccordion("color")}
                  >
                    {colorOptions.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            renk:
                              current.renk === color.name
                                ? ""
                                : color.name,
                          }))
                        }
                        className={`flex w-full items-center gap-2.5 py-1.5 text-left text-[13px] ${
                          draft.renk === color.name
                            ? "font-medium text-neutral-950"
                            : "text-neutral-600"
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 shrink-0 border border-black/15"
                          style={{ backgroundColor: color.hex }}
                          aria-hidden
                        />
                        {color.name}
                      </button>
                    ))}
                  </MobileAccordion>
                ) : null}

                <MobileAccordion
                  icon={<TurkishLira className="h-4 w-4" strokeWidth={1.5} />}
                  title="Fiyat"
                  open={openAccordion === "price"}
                  onToggle={() => toggleAccordion("price")}
                >
                  <OptionButton
                    active={!draft.fiyat}
                    onClick={() =>
                      setDraft((current) => ({ ...current, fiyat: "" }))
                    }
                    label="Tümü"
                  />
                  {PRICE_BUCKETS.map((bucket) => (
                    <OptionButton
                      key={bucket.id}
                      active={draft.fiyat === bucket.id}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          fiyat:
                            current.fiyat === bucket.id ? "" : bucket.id,
                        }))
                      }
                      label={bucket.label}
                    />
                  ))}
                </MobileAccordion>
              </div>

              <div className="shrink-0 border-t border-black/10 p-4">
                <button
                  type="button"
                  onClick={applyDraft}
                  className="flex w-full items-center justify-center bg-neutral-950 py-3.5 text-[13px] tracking-[0.08em] text-white uppercase"
                >
                  Uygula{draftCount > 0 ? ` (${draftCount})` : ""}
                </button>
              </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )
    : null;

  return (
    <div className="bg-[#FAFAF8] pb-20">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 pt-6 sm:px-6 md:px-8 md:pt-10">
        <nav
          aria-label="Sayfa yolu"
          className="text-[11px] tracking-[0.06em] text-neutral-500"
        >
          <Link
            href={trBoutiquePath(boutique.slug)}
            className="transition-opacity hover:opacity-60"
          >
            Anasayfa
          </Link>
          <span className="mx-1.5 text-neutral-300">/</span>
          <span className="text-neutral-800">{title}</span>
        </nav>

        <h1 className="mt-3 font-serif text-[1.95rem] leading-tight font-light tracking-[-0.01em] text-neutral-950 sm:mt-4 sm:text-[2.45rem] md:text-[2.85rem]">
          {title}
        </h1>

        <form
          className="mt-5 flex w-full max-w-xl gap-2 md:mt-6"
          onSubmit={(event) => {
            event.preventDefault();
            replaceParams({ q: searchDraft.trim() || null });
          }}
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Ürün ara</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
              strokeWidth={1.5}
            />
            <input
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Ürün ara…"
              className="w-full border border-neutral-200/90 bg-[#FAFAF8] py-3 pr-3 pl-10 text-[14px] outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white"
            />
          </label>
          <button
            type="submit"
            className="bg-neutral-900 px-5 py-3 text-[11px] tracking-[0.14em] text-white uppercase"
          >
            Ara
          </button>
        </form>

        {/* Desktop category chips */}
        <div
          className="mt-8 hidden flex-wrap gap-2 md:flex"
          role="list"
          aria-label="Kategoriler"
        >
          {chips.map((chip) => {
            const active = chipActive(chip);
            return (
              <button
                key={chip.id}
                type="button"
                role="listitem"
                onClick={() => selectChip(chip)}
                aria-current={active ? "true" : undefined}
                className={`flex shrink-0 items-center gap-2.5 border px-2 py-1.5 text-left transition-colors ${
                  active
                    ? "border-neutral-900 bg-[#FAFAF8]"
                    : "border-neutral-200/80 bg-white hover:border-neutral-400"
                }`}
              >
                <span className="relative h-10 w-10 overflow-hidden bg-neutral-100">
                  {chip.image ? (
                    <Image
                      src={chip.image}
                      alt=""
                      fill
                      unoptimized
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 bg-[#E8DFD4]" />
                  )}
                </span>
                <span className="pr-1 text-[13px] tracking-[0.02em] text-neutral-900">
                  {chip.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile: Filter And Sort | count — Desktop: chips + sort */}
        <div className="mt-5 flex items-center justify-between gap-3 border-y border-black/10 py-3 md:mt-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-[13px] text-neutral-900 md:hidden"
            onClick={openMobileFilters}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
            Filtrele ve sırala
          </button>

          <div className="hidden min-w-0 flex-wrap items-center gap-2 md:flex">
            <p className="text-[13px] text-neutral-700">
              Koleksiyonda{" "}
              <span className="font-medium text-neutral-950">
                {filtered.length}
              </span>{" "}
              ürün
            </p>
            {activeFilterChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => replaceParams(chip.clear)}
                className="inline-flex items-center gap-1.5 border border-neutral-300 bg-white px-2.5 py-1 text-[12px] text-neutral-800"
              >
                {chip.label}
                <X className="h-3 w-3" strokeWidth={1.75} aria-hidden />
                <span className="sr-only">kaldır</span>
              </button>
            ))}
            {hasActiveFilters ? (
              <Link
                href={trBoutiqueProductsPath(boutique.slug)}
                className="text-[12px] text-neutral-500 underline-offset-2 hover:underline"
              >
                Temizle
              </Link>
            ) : null}
          </div>

          <p className="text-[13px] text-neutral-700 md:hidden">
            {filtered.length} ürün
          </p>

          <label className="hidden items-center gap-2 text-[12px] text-neutral-600 md:flex">
            <span>Sırala:</span>
            <select
              value={siraParam}
              onChange={(event) =>
                replaceParams({
                  sira:
                    event.target.value === "default"
                      ? null
                      : event.target.value,
                })
              }
              className="border border-neutral-200 bg-white px-2 py-1.5 text-[12px] outline-none focus:border-neutral-900"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {activeFilterChips.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2 md:hidden">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => replaceParams(chip.clear)}
                className="inline-flex items-center gap-1.5 border border-neutral-300 bg-white px-2.5 py-1 text-[12px] text-neutral-800"
              >
                {chip.label}
                <X className="h-3 w-3" strokeWidth={1.75} aria-hidden />
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-6 grid gap-8 md:mt-8 md:grid-cols-[13rem_minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
          <aside className="hidden md:block" aria-label="Filtreler">
            {desktopFilterPanel}
          </aside>

          <div>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:gap-y-12 lg:grid-cols-3">
                {filtered.map((product, index) => (
                  <TrBoutiqueEditorialProductCard
                    key={product.id}
                    product={product}
                    boutiqueSlug={boutique.slug}
                    boutiqueName={boutique.name}
                    priority={index < 6}
                  />
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-[14px] text-neutral-600">
                Bu filtrede ürün bulunamadı.
              </p>
            )}
          </div>
        </div>
      </div>

      {mobileFilterModal}
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full py-1.5 text-left text-[13px] ${
        active
          ? "font-medium text-neutral-950"
          : "text-neutral-600 hover:text-neutral-950"
      }`}
    >
      {label}
    </button>
  );
}

function DesktopAccordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-black/10">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-[13px] font-medium tracking-[0.04em] text-neutral-900">
          {title}
        </span>
        <Plus
          className={`h-4 w-4 text-neutral-700 transition-transform ${
            open ? "rotate-45" : ""
          }`}
          strokeWidth={1.5}
          aria-hidden
        />
      </button>
      {open ? <div className="space-y-1 pb-4">{children}</div> : null}
    </div>
  );
}

function MobileAccordion({
  icon,
  title,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-black/10">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-neutral-700">{icon}</span>
        <span className="flex-1 text-[14px] text-neutral-900">{title}</span>
        <Plus
          className={`h-4 w-4 text-neutral-700 transition-transform ${
            open ? "rotate-45" : ""
          }`}
          strokeWidth={1.5}
          aria-hidden
        />
      </button>
      {open ? <div className="space-y-1 pb-4">{children}</div> : null}
    </div>
  );
}
