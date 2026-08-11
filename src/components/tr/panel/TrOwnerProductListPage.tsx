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
  panelDesktopSelectClass,
} from "@/components/tr/panel/panelDesktopUi";
import {
  panelBackLinkClass,
  panelChipClass,
  panelEmptyClass,
  panelErrorClass,
  panelHintClass,
  panelPageTitleClass,
  panelPrimaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelLoading,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import {
  getTrCategoryLabel,
  listCategoriesForProducts,
  TR_BOUTIQUE_CATEGORIES,
} from "@/lib/tr/categories";
import { runOwnerPatches } from "@/lib/tr/ownerBulk";
import { getProductCoverImageFor } from "@/lib/tr/productImages";
import {
  deleteOwnerProduct,
  fetchOwnerProducts,
  updateOwnerProduct,
} from "@/lib/tr/ownerClient";
import { PanelSelectCheckbox } from "@/components/tr/panel/PanelSelectCheckbox";
import { usePanelRowSelection } from "@/hooks/usePanelRowSelection";
import {
  trPanelEditProductPath,
  trPanelNewProductPath,
  trPanelPath,
} from "@/lib/tr/paths";
import { sortProductSizes } from "@/lib/tr/productOptions";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProduct, TrProductStatus } from "@/types/tr-marketplace";

const STATUS_LABEL: Record<TrProductStatus, string> = {
  available: "Satışta",
  sold: "Satıldı",
  hidden: "Gizli",
};

const STATUS_TONE: Record<TrProductStatus, string> = {
  available: "bg-emerald-50 text-emerald-900",
  sold: "bg-neutral-100 text-neutral-700",
  hidden: "bg-amber-50 text-amber-950",
};

const STATUS_OPTIONS: TrProductStatus[] = ["available", "sold", "hidden"];

function stockSummary(product: TrProduct): string {
  if (product.sizes.length === 0) return String(product.stock);
  const sizes = sortProductSizes(product.sizes);
  const parts = sizes.map((size) => {
    const n = product.sizeStocks?.[size];
    const qty = typeof n === "number" && Number.isFinite(n) ? n : 0;
    return `${size}:${qty}`;
  });
  return `${product.stock} (${parts.join(" ")})`;
}

function formatUpdated(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function ProductList({ boutiqueId }: { boutiqueId: string }) {
  const [products, setProducts] = useState<TrProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TrProductStatus>(
    "all",
  );
  const [search, setSearch] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(
        "tr-panel-product-delete-notice",
      );
      if (raw) {
        setNotice(raw);
        window.sessionStorage.removeItem("tr-panel-product-delete-notice");
      }
    } catch {
      /* ignore */
    }
  }, []);

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
              : "Ürünler yüklenemedi.",
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

  const uncategorizedCount = useMemo(
    () => products.filter((product) => !product.category?.trim()).length,
    [products],
  );

  const categoryOptions = useMemo(() => {
    const known = new Map(
      TR_BOUTIQUE_CATEGORIES.map((entry) => [entry.id, entry]),
    );
    for (const entry of categories) {
      if (!known.has(entry.id)) known.set(entry.id, entry);
    }
    return [...known.values()];
  }, [categories]);

  const visible = useMemo(() => {
    let list = products;
    if (categoryFilter === "uncategorized") {
      list = list.filter((product) => !product.category?.trim());
    } else if (categoryFilter !== "all") {
      list = list.filter(
        (product) => product.category?.trim() === categoryFilter,
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((product) => product.status === statusFilter);
    }
    const q = search.trim().toLocaleLowerCase("tr");
    if (q) {
      list = list.filter((product) => {
        const title = product.title.toLocaleLowerCase("tr");
        const cat =
          getTrCategoryLabel(product.category)?.toLocaleLowerCase("tr") ?? "";
        return title.includes(q) || cat.includes(q);
      });
    }
    return list;
  }, [categoryFilter, statusFilter, products, search]);

  const orderedIds = useMemo(() => visible.map((p) => p.id), [visible]);
  const selection = usePanelRowSelection(orderedIds);

  useEffect(() => {
    if (selection.selectedCount === 0) setConfirmBulkDelete(false);
  }, [selection.selectedCount]);

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

  const patchProduct = async (
    productId: string,
    patch: Parameters<typeof updateOwnerProduct>[1],
  ) => {
    markSaving(productId, true);
    setError(null);
    try {
      const updated = await updateOwnerProduct(productId, patch);
      applyLocal(updated);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Ürün güncellenemedi.",
      );
    } finally {
      markSaving(productId, false);
    }
  };

  const runBulk = async (
    patch: Parameters<typeof updateOwnerProduct>[1],
  ) => {
    const ids = [...selection.selectedIds];
    if (ids.length === 0) return;
    setConfirmBulkDelete(false);
    setBulkBusy(true);
    setError(null);
    const result = await runOwnerPatches(
      ids,
      (id) => updateOwnerProduct(id, patch),
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

  const runBulkDelete = async () => {
    const ids = [...selection.selectedIds];
    if (ids.length === 0) return;
    setBulkBusy(true);
    setError(null);
    setNotice(null);
    const result = await runOwnerPatches(
      ids,
      async (id) => {
        const deleted = await deleteOwnerProduct(id);
        return { id, ...deleted };
      },
      { concurrency: 4 },
    );

    const deletedIds = new Set(
      result.ok.filter((entry) => entry.mode === "deleted").map((e) => e.id),
    );
    const hiddenIds = new Set(
      result.ok.filter((entry) => entry.mode === "hidden").map((e) => e.id),
    );

    setProducts((current) =>
      current
        .filter((product) => !deletedIds.has(product.id))
        .map((product) =>
          hiddenIds.has(product.id)
            ? { ...product, status: "hidden" as const }
            : product,
        ),
    );

    const deletedCount = deletedIds.size;
    const hiddenCount = hiddenIds.size;
    if (hiddenCount > 0) {
      setNotice(
        deletedCount > 0
          ? `${deletedCount} ürün silindi; ${hiddenCount} ürün sipariş geçmişinde olduğu için gizlendi.`
          : `${hiddenCount} ürün sipariş geçmişinde olduğu için kalıcı silinemedi; mağazadan gizlendi.`,
      );
    } else if (deletedCount > 0) {
      setNotice(
        deletedCount === 1
          ? "1 ürün silindi."
          : `${deletedCount} ürün silindi.`,
      );
    }

    if (result.failed.length > 0) {
      setError(
        `${result.failed.length} ürün silinemedi: ${result.failed[0]?.error}`,
      );
    }

    setConfirmBulkDelete(false);
    setBulkBusy(false);
    selection.clear();
  };

  const filters = (
    <div className="space-y-3">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Ürün veya kategori ara…"
        className={`${panelDesktopSearchClass} max-w-none lg:max-w-sm`}
        aria-label="Ürünlerde ara"
      />
      <div className="space-y-2">
        <p className={`${panelHintClass} lg:text-[12px]`}>Durum</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`${panelChipClass(statusFilter === "all")} lg:min-h-0 lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-[13px]`}
            style={
              statusFilter === "all"
                ? { backgroundColor: "var(--panel-accent)" }
                : undefined
            }
          >
            Tümü
          </button>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`${panelChipClass(statusFilter === status)} lg:min-h-0 lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-[13px]`}
              style={
                statusFilter === status
                  ? { backgroundColor: "var(--panel-accent)" }
                  : undefined
              }
            >
              {STATUS_LABEL[status]}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className={`${panelHintClass} lg:text-[12px]`}>Kategori</p>
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
            Tümü
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
          {uncategorizedCount > 0 ? (
            <button
              type="button"
              onClick={() => setCategoryFilter("uncategorized")}
              className={`${panelChipClass(categoryFilter === "uncategorized")} lg:min-h-0 lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-[13px]`}
              style={
                categoryFilter === "uncategorized"
                  ? { backgroundColor: "var(--panel-accent)" }
                  : undefined
              }
            >
              Kategorisiz
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <TrPanelLoading key="products-loading" label="Ürünler yükleniyor…" />
      ) : error && products.length === 0 ? (
        <TrPanelFadeIn key="products-error">
          <p className={panelErrorClass}>{error}</p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn key="products-ready" className="space-y-5">
          {notice ? (
            <p className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-5 py-4 text-[16px] text-amber-950">
              {notice}
            </p>
          ) : null}
          {error ? <p className={panelErrorClass}>{error}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[17px] font-medium text-neutral-700 lg:text-[14px]">
              {categoryFilter === "all" &&
              statusFilter === "all" &&
              !search.trim()
                ? `${products.length} ürün`
                : `${visible.length} / ${products.length} ürün`}
            </p>
            <Link
              href={trPanelNewProductPath()}
              className={`${panelPrimaryBtnClass} lg:h-9 lg:min-h-0 lg:rounded-lg lg:px-4 lg:py-0 lg:text-[13px]`}
              style={{ backgroundColor: "var(--panel-accent)" }}
            >
              + Yeni ürün ekle
            </Link>
          </div>

          {products.length > 0 ? filters : null}

          {products.length === 0 ? (
            <p className={panelEmptyClass}>
              Henüz ürün yok.
              <br />
              <Link
                href={trPanelNewProductPath()}
                className="mt-3 inline-block font-semibold underline"
                style={{ color: "var(--panel-accent-deep)" }}
              >
                İlk ürününüzü ekleyin
              </Link>
            </p>
          ) : visible.length === 0 ? (
            <p className={panelEmptyClass}>
              Bu filtrede ürün yok. “Tümü”ne geçmeyi deneyin.
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
                    const statusLabel =
                      STATUS_LABEL[product.status] ?? product.status;
                    const statusTone =
                      STATUS_TONE[product.status] ?? STATUS_TONE.hidden;
                    const onSale =
                      typeof product.compareAtPriceKurus === "number" &&
                      product.compareAtPriceKurus > product.priceKurus;
                    const categoryLabel = getTrCategoryLabel(product.category);

                    return (
                      <motion.div
                        key={product.id}
                        variants={trPanelStaggerItem}
                      >
                        <Link
                          href={trPanelEditProductPath(product.id)}
                          className="flex items-center gap-4 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-4 shadow-sm transition-colors hover:bg-[color:var(--panel-accent-soft)] sm:gap-5 sm:p-5"
                        >
                          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-[color:var(--panel-accent-soft)] sm:h-28 sm:w-24">
                            {cover ? (
                              <Image
                                src={cover}
                                alt=""
                                fill
                                unoptimized
                                className="object-contain p-2"
                                sizes="96px"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="text-[19px] leading-snug font-semibold text-neutral-900 sm:text-[20px]">
                              {product.title}
                            </p>
                            <p className="text-[18px] font-medium text-neutral-800">
                              {formatTryFromKurus(product.priceKurus)}
                              {onSale ? (
                                <span className="ml-2 text-[15px] font-normal text-neutral-500 line-through">
                                  {formatTryFromKurus(
                                    product.compareAtPriceKurus!,
                                  )}
                                </span>
                              ) : null}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-lg px-2.5 py-1 text-[14px] font-semibold ${statusTone}`}
                              >
                                {statusLabel}
                              </span>
                              {categoryLabel ? (
                                <span className="rounded-lg bg-[color:var(--panel-accent-soft)] px-2.5 py-1 text-[14px] font-medium text-neutral-800">
                                  {categoryLabel}
                                </span>
                              ) : null}
                              <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-[14px] font-medium text-neutral-700">
                                Stok: {product.stock}
                              </span>
                              {product.sizes.length > 0 ? (
                                <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-[14px] font-medium text-neutral-700">
                                  {product.sizes.join(" · ")}
                                </span>
                              ) : null}
                              {onSale ? (
                                <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-[14px] font-semibold text-rose-800">
                                  İndirimli
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[15px] font-medium text-[color:var(--panel-accent-deep)]">
                              Düzenlemek için dokunun →
                            </p>
                          </div>
                        </Link>
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
                    "Kategori",
                    "Fiyat",
                    "İndirim (eski fiyat)",
                    "Durum",
                    "Stok",
                    "Güncelleme",
                  ]}
                  footer={`${visible.length} ürün · Shift aralık · Ctrl+A tümü`}
                >
                  {visible.map((product) => {
                    const cover =
                      getProductCoverImageFor("marketplace", product) ??
                      product.images[0] ??
                      null;
                    const busy = savingIds.has(product.id) || bulkBusy;
                    const priceTry = (product.priceKurus / 100).toFixed(2);
                    const compareTry =
                      product.compareAtPriceKurus != null
                        ? (product.compareAtPriceKurus / 100).toFixed(2)
                        : "";

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
                            <Link
                              href={trPanelEditProductPath(product.id)}
                              className="max-w-[220px] truncate font-semibold text-[color:var(--panel-accent-deep)] hover:underline"
                            >
                              {product.title}
                            </Link>
                          </div>
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <select
                            className={panelDesktopSelectClass}
                            value={product.category ?? ""}
                            disabled={busy}
                            onChange={(event) => {
                              const value = event.target.value || null;
                              void patchProduct(product.id, {
                                category: value,
                              });
                            }}
                          >
                            <option value="">—</option>
                            {categoryOptions.map((entry) => (
                              <option key={entry.id} value={entry.id}>
                                {entry.label}
                              </option>
                            ))}
                          </select>
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className={panelDesktopInputClass}
                            defaultValue={priceTry}
                            key={`price-${product.id}-${product.priceKurus}`}
                            disabled={busy}
                            onBlur={(event) => {
                              const next = Number(event.target.value);
                              if (
                                !Number.isFinite(next) ||
                                next <= 0 ||
                                Math.round(next * 100) === product.priceKurus
                              ) {
                                event.target.value = priceTry;
                                return;
                              }
                              void patchProduct(product.id, {
                                priceTry: next,
                              });
                            }}
                          />
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <div className="flex flex-col gap-1">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="Eski fiyat"
                              className={`${panelDesktopInputClass} w-28`}
                              defaultValue={compareTry}
                              key={`compare-${product.id}-${product.compareAtPriceKurus ?? "none"}`}
                              disabled={busy}
                              aria-label={`${product.title} indirimli eski fiyat`}
                              onBlur={(event) => {
                                const raw = event.target.value.trim();
                                if (!raw) {
                                  if (product.compareAtPriceKurus == null) {
                                    return;
                                  }
                                  void patchProduct(product.id, {
                                    compareAtPriceTry: null,
                                  });
                                  return;
                                }
                                const next = Number(raw);
                                if (!Number.isFinite(next) || next <= 0) {
                                  event.target.value = compareTry;
                                  return;
                                }
                                const nextKurus = Math.round(next * 100);
                                if (nextKurus === product.compareAtPriceKurus) {
                                  return;
                                }
                                void patchProduct(product.id, {
                                  compareAtPriceTry: next,
                                });
                              }}
                            />
                            {typeof product.compareAtPriceKurus === "number" &&
                            product.compareAtPriceKurus > product.priceKurus ? (
                              <span className="text-[11px] font-semibold text-rose-700">
                                %
                                {Math.round(
                                  (1 -
                                    product.priceKurus /
                                      product.compareAtPriceKurus) *
                                    100,
                                )}{" "}
                                indirim
                              </span>
                            ) : (
                              <span className="text-[11px] text-neutral-400">
                                Boş = indirim yok
                              </span>
                            )}
                          </div>
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <select
                            className={panelDesktopSelectClass}
                            value={product.status}
                            disabled={busy}
                            onChange={(event) => {
                              void patchProduct(product.id, {
                                status: event.target
                                  .value as TrProductStatus,
                              });
                            }}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABEL[status]}
                              </option>
                            ))}
                          </select>
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <span className="tabular-nums text-neutral-700">
                            {stockSummary(product)}
                          </span>
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <span className="whitespace-nowrap text-neutral-500">
                            {formatUpdated(product.updatedAt)}
                          </span>
                        </TrPanelDataTableCell>
                      </TrPanelDataTableRow>
                    );
                  })}
                </TrPanelDataTable>

                <TrPanelBulkBar
                  selectedCount={selection.selectedCount}
                  onClear={() => {
                    setConfirmBulkDelete(false);
                    selection.clear();
                  }}
                  busy={bulkBusy}
                >
                  <select
                    className={panelDesktopSelectClass}
                    defaultValue=""
                    disabled={bulkBusy}
                    onChange={(event) => {
                      const value = event.target.value as TrProductStatus | "";
                      if (!value) return;
                      void runBulk({ status: value });
                      event.target.value = "";
                    }}
                  >
                    <option value="" disabled>
                      Durum ata…
                    </option>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                  <select
                    className={panelDesktopSelectClass}
                    defaultValue=""
                    disabled={bulkBusy}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === "") return;
                      void runBulk({
                        category: value === "__none__" ? null : value,
                      });
                      event.target.value = "";
                    }}
                  >
                    <option value="" disabled>
                      Kategori ata…
                    </option>
                    <option value="__none__">Kategorisiz</option>
                    {categoryOptions.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={bulkBusy}
                    className={panelDesktopBtnClass}
                    style={{ backgroundColor: "var(--panel-accent)" }}
                    onClick={() => void runBulk({ status: "hidden" })}
                  >
                    Gizle
                  </button>
                  {!confirmBulkDelete ? (
                    <button
                      type="button"
                      disabled={bulkBusy}
                      className={`${panelDesktopSecondaryBtnClass} border-red-300 text-red-800`}
                      onClick={() => setConfirmBulkDelete(true)}
                    >
                      Sil
                    </button>
                  ) : (
                    <>
                      <span className="text-[12px] font-medium text-red-800">
                        {selection.selectedCount} ürün silinsin mi?
                      </span>
                      <button
                        type="button"
                        disabled={bulkBusy}
                        className={`${panelDesktopBtnClass} bg-red-700`}
                        onClick={() => void runBulkDelete()}
                      >
                        Evet, sil
                      </button>
                      <button
                        type="button"
                        disabled={bulkBusy}
                        className={panelDesktopSecondaryBtnClass}
                        onClick={() => setConfirmBulkDelete(false)}
                      >
                        Vazgeç
                      </button>
                    </>
                  )}
                </TrPanelBulkBar>
              </div>
            </>
          )}
        </TrPanelFadeIn>
      )}
    </AnimatePresence>
  );
}

export function TrOwnerProductListPage() {
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
            <h2 className={panelPageTitleClass}>Ürünler</h2>
          </div>
          <ProductList boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
