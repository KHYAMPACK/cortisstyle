"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { TrPanelBulkBar } from "@/components/tr/panel/TrPanelBulkBar";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  panelDesktopBtnClass,
  panelDesktopInputClass,
  panelDesktopSearchClass,
  panelDesktopSecondaryBtnClass,
} from "@/components/tr/panel/panelDesktopUi";
import {
  panelAddChipClass,
  panelBackLinkClass,
  panelChipClass,
  panelEmptyClass,
  panelErrorClass,
  panelPageTitleClass,
  panelStepperBtnClass,
  panelStickyFilterClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelListSkeleton,
  TrPanelStagger,
  trPanelEase,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import { runOwnerPatches } from "@/lib/tr/ownerBulk";
import { listCategoriesForProducts } from "@/lib/tr/categories";
import { getPanelProductCover } from "@/lib/tr/productImages";
import { fetchOwnerProducts, peekOwnerProducts, updateOwnerProduct } from "@/lib/tr/ownerClient";
import { PanelSelectCheckbox } from "@/components/tr/panel/PanelSelectCheckbox";
import { usePanelRowSelection } from "@/hooks/usePanelRowSelection";
import {
  trPanelEditProductPath,
  trPanelPath,
  trPanelProductsPath,
} from "@/lib/tr/paths";
import {
  missingNumericExpandedSizes,
  NUMERIC_EXPANDED_SIZES,
  sizesForStockBoard,
  sortProductSizes,
} from "@/lib/tr/productOptions";
import { sumSizeStocks } from "@/lib/tr/sizeStocks";
import type { TrProduct } from "@/types/tr-marketplace";

const LOW_STOCK = 2;

type StockFilter = "all" | "low" | "out" | "available";

function productTotal(product: TrProduct): number {
  const sizes = sizesForStockBoard(product.sizes);
  if (sizes.length > 0) {
    return sizes.reduce((sum, size) => sum + sizeQty(product, size), 0);
  }
  return product.stock;
}

function sizeQty(product: TrProduct, size: string): number {
  const n = product.sizeStocks?.[size];
  return typeof n === "number" && Number.isFinite(n) ? Math.max(0, n) : 0;
}

function StockStepper({
  value,
  disabled,
  onDecrease,
  onIncrease,
  label,
}: {
  value: number;
  disabled: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={disabled || value <= 0}
        onClick={onDecrease}
        className={panelStepperBtnClass}
        aria-label={`${label} azalt`}
      >
        −
      </button>
      <span className="min-w-[2.5rem] text-center text-[22px] font-semibold tabular-nums text-neutral-950">
        {value}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={onIncrease}
        className={panelStepperBtnClass}
        aria-label={`${label} artır`}
      >
        +
      </button>
    </div>
  );
}

function SizeStockList({
  product,
  sizes,
  busy,
  onChange,
}: {
  product: TrProduct;
  sizes: string[];
  busy: boolean;
  onChange: (product: TrProduct, size: string, next: number) => void;
}) {
  return (
    <div className="space-y-2">
      {sizes.map((size) => {
        const qty = sizeQty(product, size);
        const sizeLow =
          product.status === "available" && qty > 0 && qty <= LOW_STOCK;
        const empty = qty === 0;
        return (
          <div
            key={size}
            className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 ${
              empty
                ? "bg-neutral-100"
                : "bg-[color:var(--panel-accent-soft)]"
            }`}
          >
            <div>
              <p className="text-[18px] font-semibold text-neutral-900 lg:text-[15px]">
                {size}
              </p>
              <p
                className={`text-[14px] lg:text-[12px] ${
                  empty
                    ? "font-medium text-neutral-500"
                    : "text-neutral-600"
                }`}
              >
                {empty ? "Stokta yok" : sizeLow ? "Az kaldı" : "Stokta"}
              </p>
            </div>
            <StockStepper
              value={qty}
              disabled={busy}
              label={`${product.title} ${size}`}
              onDecrease={() => onChange(product, size, qty - 1)}
              onIncrease={() => onChange(product, size, qty + 1)}
            />
          </div>
        );
      })}
    </div>
  );
}

function StockBoard({ boutiqueId }: { boutiqueId: string }) {
  const cached = peekOwnerProducts(boutiqueId);
  const [products, setProducts] = useState<TrProduct[]>(cached?.products ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkQty, setBulkQty] = useState("0");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const revertById = useRef(new Map<string, TrProduct>());

  useEffect(() => {
    return () => {
      for (const timer of saveTimers.current.values()) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const result = await fetchOwnerProducts(boutiqueId);
        if (!cancelled) setProducts(result.products);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Stok yüklenemedi.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  const categories = useMemo(
    () => listCategoriesForProducts(products),
    [products],
  );

  const visible = useMemo(() => {
    let list = products;

    if (categoryFilter !== "all") {
      list = list.filter(
        (product) => product.category?.trim() === categoryFilter,
      );
    }

    if (stockFilter === "available") {
      list = list.filter((product) => product.status === "available");
    } else if (stockFilter === "low") {
      list = list.filter((product) => {
        if (product.status !== "available") return false;
        const total = productTotal(product);
        return total > 0 && total <= LOW_STOCK;
      });
    } else if (stockFilter === "out") {
      list = list.filter((product) => {
        if (product.status !== "available") return false;
        return productTotal(product) === 0;
      });
    }

    const q = search.trim().toLocaleLowerCase("tr");
    if (q) {
      list = list.filter((product) =>
        product.title.toLocaleLowerCase("tr").includes(q),
      );
    }
    return list;
  }, [products, search, stockFilter, categoryFilter]);

  const orderedIds = useMemo(() => visible.map((p) => p.id), [visible]);
  const selection = usePanelRowSelection(orderedIds);

  const toggleOpen = (id: string) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markSaving = (id: string, on: boolean) => {
    setSavingIds((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const applyLocal = (updated: TrProduct) => {
    setProducts((current) =>
      current.map((entry) => (entry.id === updated.id ? updated : entry)),
    );
  };

  const patchStock = (
    product: TrProduct,
    next: TrProduct,
    patch: {
      stock?: number;
      sizes?: string[];
      sizeStocks?: Record<string, number>;
    },
  ) => {
    applyLocal(next);
    if (!revertById.current.has(product.id)) {
      revertById.current.set(product.id, product);
    }
    const existing = saveTimers.current.get(product.id);
    if (existing) clearTimeout(existing);
    saveTimers.current.set(
      product.id,
      setTimeout(() => {
        saveTimers.current.delete(product.id);
        markSaving(product.id, true);
        setError(null);
        void updateOwnerProduct(product.id, {
          stock: patch.stock,
          sizes: patch.sizes,
          sizeStocks: patch.sizeStocks,
        })
          .then((updated) => {
            applyLocal(updated);
            revertById.current.delete(product.id);
          })
          .catch((saveError: unknown) => {
            const original = revertById.current.get(product.id);
            if (original) applyLocal(original);
            revertById.current.delete(product.id);
            setError(
              saveError instanceof Error
                ? saveError.message
                : "Stok güncellenemedi.",
            );
          })
          .finally(() => {
            markSaving(product.id, false);
          });
      }, 300),
    );
  };

  const setTotalStock = (product: TrProduct, next: number) => {
    if (next < 0) return;
    patchStock(product, { ...product, stock: next }, { stock: next });
  };

  const setSizeStock = (product: TrProduct, size: string, next: number) => {
    if (next < 0) return;
    const boardSizes = sizesForStockBoard(product.sizes);
    const nextStocks: Record<string, number> = {};
    for (const entry of boardSizes) {
      nextStocks[entry] = entry === size ? next : sizeQty(product, entry);
    }
    if (!boardSizes.includes(size)) {
      nextStocks[size] = next;
    }
    const persistedSizes = sortProductSizes(Object.keys(nextStocks));
    const persistedStocks: Record<string, number> = {};
    for (const entry of persistedSizes) {
      persistedStocks[entry] = nextStocks[entry] ?? 0;
    }
    const stock = sumSizeStocks(persistedStocks);
    patchStock(
      product,
      {
        ...product,
        sizes: persistedSizes,
        sizeStocks: persistedStocks,
        stock,
      },
      {
        sizes: persistedSizes,
        sizeStocks: persistedStocks,
        stock,
      },
    );
  };

  const expandNumericSizes = (product: TrProduct) => {
    const board = sizesForStockBoard(product.sizes);
    const nextSizes = sortProductSizes([
      ...new Set([...board, ...NUMERIC_EXPANDED_SIZES]),
    ]);
    const nextStocks: Record<string, number> = {};
    for (const size of nextSizes) {
      nextStocks[size] = sizeQty(product, size);
    }
    const stock = sumSizeStocks(nextStocks);
    patchStock(
      product,
      {
        ...product,
        sizes: nextSizes,
        sizeStocks: nextStocks,
        stock,
      },
      {
        sizes: nextSizes,
        sizeStocks: nextStocks,
        stock,
      },
    );
  };

  const runBulkQty = async (mode: "set" | "add" | "sub") => {
    const qty = Number(bulkQty);
    if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty < 0) {
      setError("Geçerli bir stok sayısı girin.");
      return;
    }
    const ids = [...selection.selectedIds];
    if (ids.length === 0) return;
    const byId = new Map(products.map((p) => [p.id, p]));

    setBulkBusy(true);
    setError(null);
    const result = await runOwnerPatches(
      ids,
      async (id) => {
        const product = byId.get(id);
        if (!product) throw new Error("Ürün bulunamadı.");
        if (product.sizes.length > 0) {
          const sizes = sortProductSizes(product.sizes);
          const nextStocks: Record<string, number> = {};
          for (const size of sizes) {
            const current = sizeQty(product, size);
            if (mode === "set") nextStocks[size] = qty;
            else if (mode === "add") nextStocks[size] = current + qty;
            else nextStocks[size] = Math.max(0, current - qty);
          }
          return updateOwnerProduct(id, {
            sizeStocks: nextStocks,
            stock: sumSizeStocks(nextStocks),
          });
        }
        let next = product.stock;
        if (mode === "set") next = qty;
        else if (mode === "add") next = product.stock + qty;
        else next = Math.max(0, product.stock - qty);
        return updateOwnerProduct(id, { stock: next });
      },
      { concurrency: 4 },
    );
    for (const updated of result.ok) applyLocal(updated);
    if (result.failed.length > 0) {
      setError(
        `${result.failed.length} ürün güncellenemedi: ${result.failed[0]?.error}`,
      );
    }
    setBulkBusy(false);
    selection.clear();
  };

  const lowCount = products.filter((p) => {
    if (p.status !== "available") return false;
    if (p.sizes.length > 0) {
      return sortProductSizes(p.sizes).some(
        (size) => sizeQty(p, size) <= LOW_STOCK,
      );
    }
    return p.stock <= LOW_STOCK;
  }).length;

  return (
    <>
      {loading && products.length === 0 ? (
        <TrPanelListSkeleton rows={6} label="Stok yükleniyor" />
      ) : error && products.length === 0 ? (
        <TrPanelFadeIn key="stock-error">
          <p className={panelErrorClass}>{error}</p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn key="stock-ready" className="space-y-5" shift={false}>
          {error ? <p className={panelErrorClass}>{error}</p> : null}

          <div className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-soft)] px-5 py-4 lg:rounded-xl lg:px-4 lg:py-3">
            <p className="text-[17px] font-semibold text-neutral-900 lg:text-[14px]">
              {lowCount} düşük stok ·{" "}
              {stockFilter === "all" &&
              categoryFilter === "all" &&
              !search.trim()
                ? `${products.length} ürün`
                : `${visible.length} / ${products.length} ürün`}
            </p>
            <p className="mt-1 text-[15px] text-neutral-700 lg:text-[13px]">
              Ürüne dokunarak stokları açın. Toplam otomatik hesaplanır.
            </p>
          </div>

          {products.length > 0 ? (
            <div className={panelStickyFilterClass}>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ürün adına göre ara…"
                className={`${panelDesktopSearchClass} max-w-none lg:max-w-sm`}
                aria-label="Stokta ara"
              />
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "all", label: "Tümü" },
                    { id: "available", label: "Satışta" },
                    { id: "low", label: "Düşük stok" },
                    { id: "out", label: "Stokta yok" },
                  ] as const
                ).map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setStockFilter(entry.id)}
                    className={`${panelChipClass(stockFilter === entry.id)} lg:min-h-0 lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-[13px]`}

                  >
                    {entry.label}
                  </button>
                ))}
              </div>
              {categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("all")}
                    className={`${panelChipClass(categoryFilter === "all")} lg:min-h-0 lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-[13px]`}

                  >
                    Tüm kategoriler
                  </button>
                  {categories.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setCategoryFilter(entry.id)}
                      className={`${panelChipClass(categoryFilter === entry.id)} lg:min-h-0 lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-[13px]`}

                    >
                      {entry.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {products.length === 0 ? (
            <p className={panelEmptyClass}>
              Henüz ürün yok.{" "}
              <Link
                href={trPanelProductsPath()}
                className="font-semibold underline"
                style={{ color: "var(--panel-accent-deep)" }}
              >
                Ürün ekle
              </Link>
            </p>
          ) : visible.length === 0 ? (
            <p className={panelEmptyClass}>
              Bu filtrede ürün yok. Filtreleri temizlemeyi deneyin.
            </p>
          ) : (
            <>
              <div
                className="space-y-3"
                tabIndex={0}
                onKeyDown={selection.onKeyDown}
                role="region"
                aria-label="Stok listesi"
              >
                <div className="hidden items-center gap-3 lg:flex">
                  <label className="flex items-center gap-2 text-[13px] text-neutral-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[color:var(--panel-accent)]"
                      checked={selection.allVisibleSelected}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selection.someVisibleSelected &&
                            !selection.allVisibleSelected;
                        }
                      }}
                      onChange={(event) =>
                        selection.setAllVisible(event.target.checked)
                      }
                      disabled={bulkBusy}
                      aria-label="Tümünü seç"
                    />
                    Tümünü seç
                  </label>
                  <p className="text-[12px] text-neutral-500">
                    Shift aralık · Ctrl+A tümü
                  </p>
                </div>

                <TrPanelStagger className="space-y-3">
                  {visible.map((product) => {
                    const cover =
                      getPanelProductCover(product) ??
                      product.images[0] ??
                      null;
                    const sizes = sizesForStockBoard(product.sizes);
                    const hasSizes = product.sizes.length > 0;
                    const total = hasSizes
                      ? sizes.reduce(
                          (sum, size) => sum + sizeQty(product, size),
                          0,
                        )
                      : product.stock;
                    const low =
                      product.status === "available" && total <= LOW_STOCK;
                    const outOfStock =
                      product.status === "available" && total === 0;
                    const busy = bulkBusy;
                    const open = openIds.has(product.id);
                    const missingExpanded = missingNumericExpandedSizes(
                      product.sizes,
                    );

                    return (
                      <motion.div
                        key={product.id}
                        variants={trPanelStaggerItem}
                        className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 lg:rounded-xl lg:p-4 ${
                          outOfStock
                            ? "border-neutral-300"
                            : "border-[color:var(--panel-accent-border)]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="hidden shrink-0 pt-2 lg:block">
                            <PanelSelectCheckbox
                              id={product.id}
                              checked={selection.isSelected(product.id)}
                              disabled={bulkBusy}
                              label={`${product.title} seç`}
                              onItemClick={selection.onItemClick}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              aria-expanded={open}
                              aria-controls={`stock-rows-${product.id}`}
                              onClick={() => toggleOpen(product.id)}
                              className="flex w-full min-h-11 items-start gap-4 text-left"
                            >
                              <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[color:var(--panel-accent-soft)] lg:h-14 lg:w-11 lg:rounded-lg">
                                {cover ? (
                                  <Image
                                    src={cover}
                                    alt=""
                                    fill
                                    className="object-contain p-2 lg:p-1"
                                    sizes="64px"
                                  />
                                ) : null}
                              </span>
                              <span className="min-w-0 flex-1 space-y-1">
                                <span className="block text-[19px] leading-snug font-semibold text-neutral-900 lg:text-[15px]">
                                  {product.title}
                                </span>
                                {outOfStock ? (
                                  <span className="inline-flex rounded-lg bg-neutral-100 px-2.5 py-1 text-[14px] font-semibold text-neutral-600 lg:text-[12px]">
                                    Stokta yok
                                  </span>
                                ) : low ? (
                                  <span className="block text-[14px] font-semibold text-neutral-700 lg:text-[12px]">
                                    Düşük stok — dikkat
                                  </span>
                                ) : null}
                                <span className="block text-[15px] text-neutral-600 lg:text-[13px]">
                                  Toplam:{" "}
                                  <span className="font-semibold text-neutral-900">
                                    {total}
                                  </span>
                                  {hasSizes ? " adet (tüm bedenler)" : " adet"}
                                </span>
                              </span>
                              <ChevronDown
                                className={`mt-1 h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-200 ${
                                  open ? "rotate-180" : ""
                                }`}
                                strokeWidth={1.75}
                                aria-hidden
                              />
                            </button>

                            <AnimatePresence initial={false}>
                              {open ? (
                                <motion.div
                                  key="stock-body"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.28,
                                    ease: trPanelEase,
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div
                                    id={`stock-rows-${product.id}`}
                                    className="mt-4 space-y-3 border-t border-[color:var(--panel-accent-border)] pt-4"
                                  >
                                    <Link
                                      href={trPanelEditProductPath(product.id)}
                                      className="inline-block text-[15px] font-medium text-[color:var(--panel-accent-deep)] lg:text-[13px]"
                                    >
                                      Ürünü düzenle →
                                    </Link>
                                    {hasSizes ? (
                                      <>
                                        <p className="text-[16px] font-semibold text-neutral-800 lg:text-[13px]">
                                          Beden stokları
                                        </p>
                                        <SizeStockList
                                          product={product}
                                          sizes={sizes}
                                          busy={busy}
                                          onChange={setSizeStock}
                                        />
                                        {missingExpanded.length > 0 ? (
                                          <button
                                            type="button"
                                            className={panelAddChipClass}
                                            onClick={() =>
                                              expandNumericSizes(product)
                                            }
                                          >
                                            Daha büyük bedenler (42–52)
                                          </button>
                                        ) : null}
                                      </>
                                    ) : (
                                      <div className="flex items-center justify-between gap-3">
                                        <p className="text-[16px] font-semibold text-neutral-800 lg:text-[13px]">
                                          Toplam stok
                                        </p>
                                        <StockStepper
                                          value={product.stock}
                                          disabled={busy}
                                          label={product.title}
                                          onDecrease={() =>
                                            setTotalStock(
                                              product,
                                              product.stock - 1,
                                            )
                                          }
                                          onIncrease={() =>
                                            setTotalStock(
                                              product,
                                              product.stock + 1,
                                            )
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </TrPanelStagger>
              </div>

              <div className="hidden lg:block">
                <TrPanelBulkBar
                  selectedCount={selection.selectedCount}
                  onClear={selection.clear}
                  busy={bulkBusy}
                >
                  <div className="flex w-full flex-col gap-2 sm:w-auto">
                    <p className="text-[12px] text-neutral-600">
                      Seçili ürünlerin stokuna uygula (bedenli ürünlerde her
                      bedene):
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-1.5 text-[12px] font-medium text-neutral-700">
                        Miktar
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={bulkQty}
                          onChange={(event) => setBulkQty(event.target.value)}
                          className={`${panelDesktopInputClass} w-20`}
                          aria-label="Toplu stok miktarı"
                          disabled={bulkBusy}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={bulkBusy}
                        className={panelDesktopBtnClass}
                        onClick={() => void runBulkQty("set")}
                        title="Seçili ürünlerin stokunu bu miktara ayarla"
                      >
                        Stoku {bulkQty || "N"} yap
                      </button>
                      <button
                        type="button"
                        disabled={bulkBusy}
                        className={panelDesktopSecondaryBtnClass}
                        onClick={() => void runBulkQty("add")}
                        title="Seçili ürünlerin stoğuna bu miktarı ekle"
                      >
                        {bulkQty || "N"} ekle
                      </button>
                      <button
                        type="button"
                        disabled={bulkBusy}
                        className={panelDesktopSecondaryBtnClass}
                        onClick={() => void runBulkQty("sub")}
                        title="Seçili ürünlerin stoğundan bu miktarı düş"
                      >
                        {bulkQty || "N"} çıkar
                      </button>
                    </div>
                  </div>
                </TrPanelBulkBar>
              </div>
            </>
          )}
        </TrPanelFadeIn>
      )}
    </>
  );
}

export function TrOwnerStockPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-5">
          <div>
            <Link
              href={trPanelPath()}
              className={`${panelBackLinkClass} lg:hidden`}
            >
              ← Giriş
            </Link>
            <h2 className={panelPageTitleClass}>Stok</h2>
            <p className="mt-2 text-[16px] leading-relaxed text-neutral-600 lg:text-[14px]">
              Ürüne dokunun, beden stokları açılsın.
            </p>
          </div>
          <StockBoard boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
