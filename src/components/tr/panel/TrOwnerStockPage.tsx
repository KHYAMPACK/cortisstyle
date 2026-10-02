"use client";

import Image from "next/image";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { TrPanelBulkBar } from "@/components/tr/panel/TrPanelBulkBar";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import {
  panelDesktopBtnClass,
  panelDesktopInputClass,
  panelDesktopSearchClass,
  panelDesktopSecondaryBtnClass,
} from "@/components/tr/panel/panelDesktopUi";
import {
  TrPanelDataTable,
  TrPanelDataTableCell,
  TrPanelDataTableRow,
} from "@/components/tr/panel/TrPanelDataTable";
import {
  panelBackLinkClass,
  panelChipClass,
  panelEmptyClass,
  panelErrorClass,
  panelPageTitleClass,
  panelStickyFilterClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelFadeIn, TrPanelListSkeleton } from "@/components/tr/panel/TrPanelMotion";
import { useOwnerCategoryName } from "@/components/tr/panel/useOwnerCategories";
import { runOwnerPatches } from "@/lib/tr/ownerBulk";
import { getPanelProductCover } from "@/lib/tr/productImages";
import { fetchOwnerProducts, peekOwnerProducts, updateOwnerProduct } from "@/lib/tr/ownerClient";
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

/**
 * The garment's own sizes, in its stored order. Other sizes of the list are not added
 * (an XS–XL dress stays XS–XL); sizes are added or removed in the product editor.
 */
function boardSizes(product: TrProduct): string[] {
  return [...new Set(product.sizes.map((size) => size.trim()).filter(Boolean))];
}

function productTotal(product: TrProduct): number {
  const sizes = boardSizes(product);
  if (sizes.length > 0) {
    return sizes.reduce((sum, size) => sum + sizeQty(product, size), 0);
  }
  return product.stock;
}

function sizeQty(product: TrProduct, size: string): number {
  const n = product.sizeStocks?.[size];
  return typeof n === "number" && Number.isFinite(n) ? Math.max(0, n) : 0;
}

const STEP_BTN =
  "grid h-7 w-7 place-items-center rounded-md border border-neutral-200 bg-white text-[15px] font-semibold text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none";

/** − n + for one stock count, compact enough for a table row. */
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
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={disabled || value <= 0}
        onClick={onDecrease}
        className={STEP_BTN}
        aria-label={`${label} azalt`}
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-[14px] font-semibold tabular-nums text-neutral-950">
        {value}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={onIncrease}
        className={STEP_BTN}
        aria-label={`${label} artır`}
      >
        +
      </button>
    </div>
  );
}

/** Stokta / Az kaldı / Stokta yok, or Gizli for a hidden product. */
function StockBadge({ qty, hidden }: { qty: number; hidden: boolean }) {
  const [label, tone] = hidden
    ? ["Gizli", "bg-neutral-100 text-neutral-500"]
    : qty === 0
      ? ["Stokta yok", "bg-neutral-100 text-neutral-600"]
      : qty <= LOW_STOCK
        ? ["Az kaldı", "bg-amber-50 text-amber-800"]
        : ["Stokta", "bg-emerald-50 text-emerald-800"];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium ${tone}`}>
      {label}
    </span>
  );
}

function StockBoard({ boutiqueId }: { boutiqueId: string }) {
  const router = useRouter();
  const cached = peekOwnerProducts(boutiqueId);
  const [products, setProducts] = useState<TrProduct[]>(cached?.products ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
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

  // Chips for the categories products are filed under (primary), named from the store's
  // own categories.
  const categoryName = useOwnerCategoryName(boutiqueId);
  const categories = useMemo(() => {
    const used = new Set(
      products
        .map((product) => product.category?.trim())
        .filter((slug): slug is string => Boolean(slug)),
    );
    return [...used]
      .map((slug) => ({ id: slug, label: categoryName(slug) }))
      .filter((entry): entry is { id: string; label: string } => entry.label != null)
      .sort((a, b) => a.label.localeCompare(b.label, "tr"));
  }, [products, categoryName]);

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

  const allOpen =
    visible.some((product) => boardSizes(product).length > 0) &&
    visible
      .filter((product) => boardSizes(product).length > 0)
      .every((product) => openIds.has(product.id));

  const toggleOpen = (id: string) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
    const board = boardSizes(product);
    const persistedSizes = board.includes(size) ? board : [...board, size];
    const persistedStocks: Record<string, number> = {};
    for (const entry of persistedSizes) {
      persistedStocks[entry] = entry === size ? next : sizeQty(product, entry);
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
              Bedenli ürünlerde oka basın, bedenlerin stoğu açılsın. Toplam otomatik hesaplanır.
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
              {visible.some((product) => boardSizes(product).length > 0) ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenIds(
                        allOpen
                          ? new Set()
                          : new Set(
                              visible
                                .filter((product) => boardSizes(product).length > 0)
                                .map((product) => product.id),
                            ),
                      )
                    }
                    className="text-[13px] font-semibold text-[color:var(--panel-accent-deep)] hover:underline"
                  >
                    {allOpen ? "Tümünü daralt" : "Bedenleri genişlet"}
                  </button>
                </div>
              ) : null}

              <TrPanelDataTable
                contained={false}
                onKeyDown={selection.onKeyDown}
                selectAll={{
                  checked: selection.allVisibleSelected,
                  indeterminate: selection.someVisibleSelected && !selection.allVisibleSelected,
                  onChange: selection.setAllVisible,
                  disabled: bulkBusy,
                }}
                headers={[
                  "Ürün",
                  "Durum",
                  <span key="stok" className="block text-right">
                    Stok
                  </span>,
                ]}
                footer={`${visible.length} ürün`}
              >
                {visible.flatMap((product) => {
                  const cover = getPanelProductCover(product) ?? product.images[0] ?? null;
                  const sizes = boardSizes(product);
                  const hasSizes = sizes.length > 0;
                  const total = productTotal(product);
                  const hidden = product.status === "hidden";
                  const open = openIds.has(product.id);
                  const href = trPanelEditProductPath(product.id);
                  const category = categoryName(product.category);

                  const parent = (
                    <TrPanelDataTableRow
                      key={product.id}
                      selected={selection.isSelected(product.id)}
                      onActivate={() => (hasSizes ? toggleOpen(product.id) : router.push(href))}
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
                        <div className="flex items-center gap-2">
                          {hasSizes ? (
                            <button
                              type="button"
                              onClick={() => toggleOpen(product.id)}
                              aria-expanded={open}
                              aria-label={`${product.title} bedenlerini ${open ? "gizle" : "göster"}`}
                              className="grid h-6 w-6 shrink-0 place-items-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                            >
                              {open ? (
                                <ChevronDown className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                              ) : (
                                <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                              )}
                            </button>
                          ) : (
                            <span className="w-6 shrink-0" aria-hidden />
                          )}
                          <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded bg-[color:var(--panel-accent-soft)]">
                            {cover ? (
                              <Image src={cover} alt="" fill className="object-contain p-0.5" sizes="40px" />
                            ) : null}
                          </span>
                          <span className="min-w-0">
                            <Link
                              href={href}
                              className="block max-w-[360px] truncate font-semibold text-neutral-900 hover:underline"
                            >
                              {product.title}
                            </Link>
                            <span className="block truncate text-[12px] text-neutral-500">
                              {[category, hasSizes ? `${sizes.length} beden` : null]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                        </div>
                      </TrPanelDataTableCell>
                      <TrPanelDataTableCell>
                        <StockBadge qty={total} hidden={hidden} />
                      </TrPanelDataTableCell>
                      <TrPanelDataTableCell className="text-right">
                        {hasSizes ? (
                          <span className="font-semibold tabular-nums text-neutral-900">
                            {total} adet
                          </span>
                        ) : (
                          <StockStepper
                            value={product.stock}
                            disabled={bulkBusy}
                            label={product.title}
                            onDecrease={() => setTotalStock(product, product.stock - 1)}
                            onIncrease={() => setTotalStock(product, product.stock + 1)}
                          />
                        )}
                      </TrPanelDataTableCell>
                    </TrPanelDataTableRow>
                  );

                  if (!hasSizes || !open) return [parent];
                  return [
                    parent,
                    ...sizes.map((size) => {
                      const qty = sizeQty(product, size);
                      return (
                        <TrPanelDataTableRow key={`${product.id}:${size}`} className="bg-neutral-50/60">
                          <TrPanelDataTableCell className="w-10" />
                          <TrPanelDataTableCell>
                            <div className="pl-[4.5rem]">
                              <span className="block font-medium text-neutral-900">{size}</span>
                              <span className="block truncate text-[12px] text-neutral-500">
                                {product.title}
                              </span>
                            </div>
                          </TrPanelDataTableCell>
                          <TrPanelDataTableCell>
                            <StockBadge qty={qty} hidden={hidden} />
                          </TrPanelDataTableCell>
                          <TrPanelDataTableCell className="text-right">
                            <StockStepper
                              value={qty}
                              disabled={bulkBusy}
                              label={`${product.title} ${size}`}
                              onDecrease={() => setSizeStock(product, size, qty - 1)}
                              onIncrease={() => setSizeStock(product, size, qty + 1)}
                            />
                          </TrPanelDataTableCell>
                        </TrPanelDataTableRow>
                      );
                    }),
                  ];
                })}
              </TrPanelDataTable>

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
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
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
              Stokları buradan hızlıca güncelleyin; değişiklikler hemen kaydedilir.
            </p>
          </div>
          <StockBoard boutiqueId={activeBoutique.id} />
        </div>
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}
