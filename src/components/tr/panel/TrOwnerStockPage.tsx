"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TrPanelBulkBar } from "@/components/tr/panel/TrPanelBulkBar";
import {
  TrPanelDataTable,
  TrPanelDataTableCell,
  TrPanelDataTableRow,
} from "@/components/tr/panel/TrPanelDataTable";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  panelDesktopBtnClass,
  panelDesktopInputClass,
  panelDesktopSearchClass,
  panelDesktopSecondaryBtnClass,
} from "@/components/tr/panel/panelDesktopUi";
import {
  panelBackLinkClass,
  panelChipClass,
  panelEmptyClass,
  panelErrorClass,
  panelPageTitleClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelLoading,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import { runOwnerPatches } from "@/lib/tr/ownerBulk";
import { listCategoriesForProducts } from "@/lib/tr/categories";
import { getProductCoverImageFor } from "@/lib/tr/productImages";
import { fetchOwnerProducts, updateOwnerProduct } from "@/lib/tr/ownerClient";
import { PanelSelectCheckbox } from "@/components/tr/panel/PanelSelectCheckbox";
import { usePanelRowSelection } from "@/hooks/usePanelRowSelection";
import {
  trPanelEditProductPath,
  trPanelPath,
  trPanelProductsPath,
} from "@/lib/tr/paths";
import { sortProductSizes } from "@/lib/tr/productOptions";
import { sumSizeStocks } from "@/lib/tr/sizeStocks";
import type { TrProduct } from "@/types/tr-marketplace";

const LOW_STOCK = 2;

type StockFilter = "all" | "low" | "out" | "available";

function productTotal(product: TrProduct): number {
  if (product.sizes.length > 0) {
    return sortProductSizes(product.sizes).reduce(
      (sum, size) => sum + sizeQty(product, size),
      0,
    );
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
        className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white text-[24px] font-semibold text-neutral-900 disabled:opacity-40"
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
        className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white text-[24px] font-semibold text-neutral-900 disabled:opacity-40"
        aria-label={`${label} artır`}
      >
        +
      </button>
    </div>
  );
}

function StockBoard({ boutiqueId }: { boutiqueId: string }) {
  const [products, setProducts] = useState<TrProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkQty, setBulkQty] = useState("0");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
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

  /** Shared size columns so S/M/L line up across rows. */
  const sizeColumns = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      for (const size of product.sizes) set.add(size);
    }
    return sortProductSizes([...set]);
  }, [products]);

  const orderedIds = useMemo(() => visible.map((p) => p.id), [visible]);
  const selection = usePanelRowSelection(orderedIds);

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

  const patchStock = async (
    product: TrProduct,
    patch: { stock?: number; sizeStocks?: Record<string, number> },
  ) => {
    markSaving(product.id, true);
    setError(null);
    try {
      const updated = await updateOwnerProduct(product.id, {
        stock: patch.stock,
        sizeStocks: patch.sizeStocks,
      });
      applyLocal(updated);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Stok güncellenemedi.",
      );
    } finally {
      markSaving(product.id, false);
    }
  };

  const setTotalStock = (product: TrProduct, next: number) => {
    if (next < 0) return;
    void patchStock(product, { stock: next });
  };

  const setSizeStock = (product: TrProduct, size: string, next: number) => {
    if (next < 0) return;
    const sizes = sortProductSizes(product.sizes);
    const nextStocks: Record<string, number> = {};
    for (const entry of sizes) {
      nextStocks[entry] = entry === size ? next : sizeQty(product, entry);
    }
    void patchStock(product, {
      sizeStocks: nextStocks,
      stock: sumSizeStocks(nextStocks),
    });
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
    <AnimatePresence mode="wait">
      {loading ? (
        <TrPanelLoading key="stock-loading" label="Stok yükleniyor…" />
      ) : error && products.length === 0 ? (
        <TrPanelFadeIn key="stock-error">
          <p className={panelErrorClass}>{error}</p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn key="stock-ready" className="space-y-5">
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
              Her beden için ayrı stok girin. Toplam otomatik hesaplanır.
            </p>
          </div>

          {products.length > 0 ? (
            <div className="space-y-3">
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
                    style={
                      stockFilter === entry.id
                        ? { backgroundColor: "var(--panel-accent)" }
                        : undefined
                    }
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
                    style={
                      categoryFilter === "all"
                        ? { backgroundColor: "var(--panel-accent)" }
                        : undefined
                    }
                  >
                    Tüm kategoriler
                  </button>
                  {categories.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setCategoryFilter(entry.id)}
                      className={`${panelChipClass(categoryFilter === entry.id)} lg:min-h-0 lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-[13px]`}
                      style={
                        categoryFilter === entry.id
                          ? { backgroundColor: "var(--panel-accent)" }
                          : undefined
                      }
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
              {/* Mobile cards */}
              <div className="lg:hidden">
                <TrPanelStagger className="space-y-3">
                  {visible.map((product) => {
                    const cover =
                      getProductCoverImageFor("marketplace", product) ??
                      product.images[0] ??
                      null;
                    const sizes = sortProductSizes(product.sizes);
                    const hasSizes = sizes.length > 0;
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
                    const busy = savingIds.has(product.id);

                    return (
                      <motion.div
                        key={product.id}
                        variants={trPanelStaggerItem}
                        className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${
                          outOfStock
                            ? "border-neutral-300"
                            : "border-[color:var(--panel-accent-border)]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <Link
                            href={trPanelEditProductPath(product.id)}
                            className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[color:var(--panel-accent-soft)]"
                          >
                            {cover ? (
                              <Image
                                src={cover}
                                alt=""
                                fill
                                unoptimized
                                className="object-contain p-2"
                                sizes="64px"
                              />
                            ) : null}
                          </Link>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-[19px] leading-snug font-semibold text-neutral-900">
                              {product.title}
                            </p>
                            {outOfStock ? (
                              <p className="inline-flex rounded-lg bg-neutral-100 px-2.5 py-1 text-[14px] font-semibold text-neutral-600">
                                Stokta yok
                              </p>
                            ) : low ? (
                              <p className="text-[14px] font-semibold text-neutral-700">
                                Düşük stok — dikkat
                              </p>
                            ) : null}
                            <p className="text-[15px] text-neutral-600">
                              Toplam:{" "}
                              <span className="font-semibold text-neutral-900">
                                {total}
                              </span>
                              {hasSizes ? " adet (tüm bedenler)" : " adet"}
                            </p>
                            <Link
                              href={trPanelEditProductPath(product.id)}
                              className="inline-block text-[15px] font-medium text-[color:var(--panel-accent-deep)]"
                            >
                              Ürünü düzenle →
                            </Link>
                          </div>
                        </div>

                        {hasSizes ? (
                          <div className="mt-4 space-y-2 border-t border-[color:var(--panel-accent-border)] pt-4">
                            <p className="text-[16px] font-semibold text-neutral-800">
                              Beden stokları
                            </p>
                            {sizes.map((size) => {
                              const qty = sizeQty(product, size);
                              const sizeLow =
                                product.status === "available" &&
                                qty > 0 &&
                                qty <= LOW_STOCK;
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
                                    <p className="text-[18px] font-semibold text-neutral-900">
                                      {size}
                                    </p>
                                    <p
                                      className={`text-[14px] ${
                                        empty
                                          ? "font-medium text-neutral-500"
                                          : "text-neutral-600"
                                      }`}
                                    >
                                      {empty
                                        ? "Stokta yok"
                                        : sizeLow
                                          ? "Az kaldı"
                                          : "Stokta"}
                                    </p>
                                  </div>
                                  <StockStepper
                                    value={qty}
                                    disabled={busy}
                                    label={`${product.title} ${size}`}
                                    onDecrease={() =>
                                      setSizeStock(product, size, qty - 1)
                                    }
                                    onIncrease={() =>
                                      setSizeStock(product, size, qty + 1)
                                    }
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[color:var(--panel-accent-border)] pt-4">
                            <p className="text-[16px] font-semibold text-neutral-800">
                              Toplam stok
                            </p>
                            <StockStepper
                              value={product.stock}
                              disabled={busy}
                              label={product.title}
                              onDecrease={() =>
                                setTotalStock(product, product.stock - 1)
                              }
                              onIncrease={() =>
                                setTotalStock(product, product.stock + 1)
                              }
                            />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </TrPanelStagger>
              </div>

              {/* Desktop table */}
              <div className="hidden space-y-3 lg:block">
                  <TrPanelDataTable
                    onKeyDown={selection.onKeyDown}
                    selectAll={{
                      checked: selection.allVisibleSelected,
                      indeterminate:
                        selection.someVisibleSelected &&
                        !selection.allVisibleSelected,
                      onChange: selection.setAllVisible,
                      disabled: bulkBusy,
                    }}
                    headers={[
                      "Ürün",
                      ...(sizeColumns.length > 0
                        ? sizeColumns
                        : ["Adet"]),
                      "Toplam",
                    ]}
                    footer={`${visible.length} ürün · Shift aralık · Ctrl+A tümü`}
                  >
                    {visible.map((product) => {
                      const cover =
                        getProductCoverImageFor("marketplace", product) ??
                        product.images[0] ??
                        null;
                      const sizes = sortProductSizes(product.sizes);
                      const hasSizes = sizes.length > 0;
                      const sizeSet = new Set(sizes);
                      const total = hasSizes
                        ? sizes.reduce(
                            (sum, size) => sum + sizeQty(product, size),
                            0,
                          )
                        : product.stock;
                      const busy =
                        savingIds.has(product.id) || bulkBusy;
                      const low =
                        product.status === "available" && total <= LOW_STOCK;

                      return (
                        <TrPanelDataTableRow
                          key={product.id}
                          selected={selection.isSelected(product.id)}
                        >
                          <TrPanelDataTableCell className="w-10">
                            <PanelSelectCheckbox
                              id={product.id}
                              checked={selection.isSelected(product.id)}
                              disabled={bulkBusy}
                              label={`${product.title} seç`}
                              onItemClick={selection.onItemClick}
                            />
                          </TrPanelDataTableCell>
                          <TrPanelDataTableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded bg-[color:var(--panel-accent-soft)]">
                                {cover ? (
                                  <Image
                                    src={cover}
                                    alt=""
                                    fill
                                    unoptimized
                                    className="object-contain p-0.5"
                                    sizes="32px"
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={trPanelEditProductPath(product.id)}
                                  className="block max-w-[240px] truncate font-semibold text-[color:var(--panel-accent-deep)] hover:underline"
                                >
                                  {product.title}
                                </Link>
                                {low ? (
                                  <p className="text-[11px] font-medium text-amber-800">
                                    Düşük stok
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </TrPanelDataTableCell>
                          {sizeColumns.length > 0
                            ? sizeColumns.map((size) => {
                                if (!hasSizes) {
                                  return (
                                    <TrPanelDataTableCell
                                      key={size}
                                      className="w-[4.5rem] text-center text-neutral-300"
                                    >
                                      —
                                    </TrPanelDataTableCell>
                                  );
                                }
                                if (!sizeSet.has(size)) {
                                  return (
                                    <TrPanelDataTableCell
                                      key={size}
                                      className="w-[4.5rem] text-center text-neutral-300"
                                    >
                                      —
                                    </TrPanelDataTableCell>
                                  );
                                }
                                const qty = sizeQty(product, size);
                                return (
                                  <TrPanelDataTableCell
                                    key={size}
                                    className="w-[4.5rem]"
                                  >
                                    <input
                                      type="number"
                                      min={0}
                                      step={1}
                                      className={`${panelDesktopInputClass} w-14 text-center`}
                                      defaultValue={qty}
                                      key={`${product.id}-${size}-${qty}`}
                                      disabled={busy}
                                      aria-label={`${product.title} ${size}`}
                                      onBlur={(event) => {
                                        const next = Number(event.target.value);
                                        if (
                                          !Number.isFinite(next) ||
                                          !Number.isInteger(next) ||
                                          next < 0 ||
                                          next === qty
                                        ) {
                                          event.target.value = String(qty);
                                          return;
                                        }
                                        setSizeStock(product, size, next);
                                      }}
                                    />
                                  </TrPanelDataTableCell>
                                );
                              })
                            : (
                              <TrPanelDataTableCell className="w-[4.5rem]">
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  className={`${panelDesktopInputClass} w-14 text-center`}
                                  defaultValue={product.stock}
                                  key={`${product.id}-stock-${product.stock}`}
                                  disabled={busy}
                                  onBlur={(event) => {
                                    const next = Number(event.target.value);
                                    if (
                                      !Number.isFinite(next) ||
                                      !Number.isInteger(next) ||
                                      next < 0 ||
                                      next === product.stock
                                    ) {
                                      event.target.value = String(
                                        product.stock,
                                      );
                                      return;
                                    }
                                    setTotalStock(product, next);
                                  }}
                                />
                              </TrPanelDataTableCell>
                            )}
                          <TrPanelDataTableCell>
                            {hasSizes ? (
                              <span className="font-semibold tabular-nums">
                                {total}
                              </span>
                            ) : sizeColumns.length > 0 ? (
                              <input
                                type="number"
                                min={0}
                                step={1}
                                className={`${panelDesktopInputClass} w-14 text-center`}
                                defaultValue={product.stock}
                                key={`${product.id}-total-${product.stock}`}
                                disabled={busy}
                                aria-label={`${product.title} toplam stok`}
                                onBlur={(event) => {
                                  const next = Number(event.target.value);
                                  if (
                                    !Number.isFinite(next) ||
                                    !Number.isInteger(next) ||
                                    next < 0 ||
                                    next === product.stock
                                  ) {
                                    event.target.value = String(product.stock);
                                    return;
                                  }
                                  setTotalStock(product, next);
                                }}
                              />
                            ) : (
                              <span className="font-semibold tabular-nums">
                                {total}
                              </span>
                            )}
                          </TrPanelDataTableCell>
                        </TrPanelDataTableRow>
                      );
                    })}
                  </TrPanelDataTable>

                <TrPanelBulkBar
                  selectedCount={selection.selectedCount}
                  onClear={selection.clear}
                  busy={bulkBusy}
                >
                  <div className="flex w-full flex-col gap-2 sm:w-auto">
                    <p className="text-[12px] text-neutral-600">
                      Seçili ürünlerin stokuna uygula
                      {sizeColumns.length > 0
                        ? " (bedenli ürünlerde her bedene)"
                        : ""}
                      :
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
                        style={{ backgroundColor: "var(--panel-accent)" }}
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
    </AnimatePresence>
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
              ← Ana sayfa
            </Link>
            <h2 className={panelPageTitleClass}>Stok</h2>
            <p className="mt-2 text-[16px] leading-relaxed text-neutral-600 lg:text-[14px]">
              Her bedenin stoğunu ayrı ayrı ayarlayın.
            </p>
          </div>
          <StockBoard boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
