"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal, Search, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TrPanelBulkBar } from "@/components/tr/panel/TrPanelBulkBar";
import {
  TrPanelDataTable,
  TrPanelDataTableCell,
  TrPanelDataTableRow,
} from "@/components/tr/panel/TrPanelDataTable";
import {
  useElbiseRestyleSaved,
  useOpenElbiseRestyle,
} from "@/components/tr/fashion/panel/TrOwnerElbiseRestyleSession";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import {
  panelDesktopBtnClass,
  panelDesktopDangerBtnClass,
  panelDesktopSecondaryBtnClass,
  panelDesktopSelectClass,
} from "@/components/tr/panel/panelDesktopUi";
import {
  panelChipClass,
  panelEmptyClass,
  panelErrorClass,
  panelFieldClass,
  panelLabelClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelListSkeleton,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import { TrPanelPopover } from "@/components/tr/panel/TrPanelPopover";
import { useOwnerCategories } from "@/components/tr/panel/useOwnerCategories";
import { flattenCategoryTree, slugsInScope } from "@/lib/tr/categories/tree";
import {
  getTrCategoryLabel,
  listCategoriesForProducts,
  TR_BOUTIQUE_CATEGORIES,
} from "@/lib/tr/fashion/categories";
import { runOwnerPatches } from "@/lib/tr/ownerBulk";
import { getPanelProductCover } from "@/lib/tr/productImages";
import { isElbiseRestyleCandidate } from "@/lib/tr/fashion/aiCatalog/elbiseRestyle";
import {
  addOwnerProductsToCategory,
  deleteOwnerProduct,
  fetchOwnerProducts,
  peekOwnerProducts,
  updateOwnerProduct,
} from "@/lib/tr/ownerClient";
import { PanelSelectCheckbox } from "@/components/tr/panel/PanelSelectCheckbox";
import { usePanelRowSelection } from "@/hooks/usePanelRowSelection";
import {
  trPanelBatchNewProductsPath,
  trPanelEditProductPath,
  trPanelNewProductPath,
  trPanelTakimNewProductPath,
} from "@/lib/tr/paths";
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

const PAGE_SIZES = [20, 50, 100] as const;

/** Same chip, tighter on desktop. */
const filterChipClass = (active: boolean) =>
  `${panelChipClass(active)} lg:min-h-0 lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-[13px]`;

const desktopButtonSize =
  "lg:h-9 lg:min-h-0 lg:rounded-lg lg:px-4 lg:py-0 lg:text-[13px]";

/** A badge only for the states worth a second look — "Satışta" is the norm. */
function StatusBadge({ status }: { status: TrProductStatus }) {
  if (status === "available") return null;
  return (
    <span
      className={`shrink-0 rounded-md px-2 py-0.5 text-[12px] font-semibold ${STATUS_TONE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** A product's category name: from the boutique's own categories, or the built-in tree. */
function categoryName(
  custom: boolean,
  ownNames: ReadonlyMap<string, string>,
  slug: string | null,
): string | null {
  if (!custom) return getTrCategoryLabel(slug);
  return slug ? (ownNames.get(slug) ?? null) : null;
}

function isOnSale(product: TrProduct): boolean {
  return (
    typeof product.compareAtPriceKurus === "number" &&
    product.compareAtPriceKurus > product.priceKurus
  );
}

function ProductPrice({ product }: { product: TrProduct }) {
  return (
    <span className="tabular-nums">
      {isOnSale(product) ? (
        <span className="block text-[12px] text-neutral-400 line-through">
          {formatTryFromKurus(product.compareAtPriceKurus!)}
        </span>
      ) : null}
      <span className="font-medium text-neutral-900">
        {formatTryFromKurus(product.priceKurus)}
      </span>
    </span>
  );
}

function ProductStock({ product }: { product: TrProduct }) {
  if (product.stock <= 0) {
    return <span className="font-medium text-red-700">Tükendi</span>;
  }
  return <span className="tabular-nums">{product.stock} adet</span>;
}

function ProductThumb({
  product,
  priority,
  className,
}: {
  product: TrProduct;
  priority: boolean;
  className: string;
}) {
  const cover = getPanelProductCover(product) ?? product.images[0] ?? null;
  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-[color:var(--panel-accent-soft)] ${className}`}
    >
      {cover ? (
        <Image
          src={cover}
          alt=""
          fill
          priority={priority}
          className="object-contain p-1"
          sizes="80px"
        />
      ) : null}
    </div>
  );
}

function ListPager({
  page,
  pageCount,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPage: (next: number) => void;
  onPageSize: (next: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const arrowClass =
    "grid h-8 w-8 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)]";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-neutral-600">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2">
          Satır adedi
          <select
            className={panelDesktopSelectClass}
            value={pageSize}
            onChange={(event) => onPageSize(Number(event.target.value))}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <span className="tabular-nums">
          {from} - {to} / {total} ürün
        </span>
      </div>
      {pageCount > 1 ? (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={arrowClass}
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            aria-label="Önceki sayfa"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className={arrowClass}
            disabled={page >= pageCount}
            onClick={() => onPage(page + 1)}
            aria-label="Sonraki sayfa"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ProductList({
  boutiqueId,
  boutiqueSlug,
  categoryMode,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
  categoryMode: "legacy" | "custom";
}) {
  const router = useRouter();
  // A boutique with its own categories filters and labels by them; every other
  // boutique keeps the built-in tree exactly as before.
  const custom = categoryMode === "custom";
  const { categories: ownCategories } = useOwnerCategories(boutiqueId, custom);
  const cached = peekOwnerProducts(boutiqueId);
  const [products, setProducts] = useState<TrProduct[]>(cached?.products ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TrProductStatus>(
    "all",
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const openRestyle = useOpenElbiseRestyle();

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
    () =>
      custom
        ? flattenCategoryTree(ownCategories).map(({ category, depth }) => ({
            id: category.slug,
            label: `${"— ".repeat(depth)}${category.name}`,
          }))
        : listCategoriesForProducts(products),
    [custom, ownCategories, products],
  );
  const ownNames = useMemo(
    () => new Map(ownCategories.map((entry) => [entry.slug, entry.name])),
    [ownCategories],
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
      const scope = custom ? slugsInScope(ownCategories, categoryFilter) : null;
      list = list.filter((product) =>
        scope
          ? scope.has(product.category?.trim() ?? "")
          : product.category?.trim() === categoryFilter,
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((product) => product.status === statusFilter);
    }
    const q = search.trim().toLocaleLowerCase("tr");
    if (q) {
      const pastedId = q.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
      );
      list = list.filter((product) => {
        const title = product.title.toLocaleLowerCase("tr");
        const cat =
          categoryName(custom, ownNames, product.category)?.toLocaleLowerCase("tr") ?? "";
        const id = product.id.toLocaleLowerCase("tr");
        if (title.includes(q) || cat.includes(q) || id.includes(q)) {
          return true;
        }
        return Boolean(
          pastedId && id === pastedId[0].toLocaleLowerCase("tr"),
        );
      });
    }
    return list;
  }, [
    categoryFilter,
    statusFilter,
    products,
    search,
    custom,
    ownCategories,
    ownNames,
  ]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => visible.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [visible, currentPage, pageSize],
  );

  const filterCount =
    (statusFilter !== "all" ? 1 : 0) + (categoryFilter !== "all" ? 1 : 0);

  const orderedIds = useMemo(() => pageItems.map((p) => p.id), [pageItems]);
  const selection = usePanelRowSelection(orderedIds);
  const restyleCandidates = useMemo(
    () => products.filter(isElbiseRestyleCandidate),
    [products],
  );
  const restyleSelectionIds = useMemo(
    () =>
      restyleCandidates
        .filter((product) => selection.selectedIds.has(product.id))
        .map((product) => product.id),
    [restyleCandidates, selection.selectedIds],
  );

  useEffect(() => {
    if (selection.selectedCount === 0) setConfirmBulkDelete(false);
  }, [selection.selectedCount]);

  const applyLocal = (updated: TrProduct) => {
    setProducts((current) =>
      current.map((entry) => (entry.id === updated.id ? updated : entry)),
    );
  };
  useElbiseRestyleSaved(applyLocal);

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

  /** Custom categories: add the selected products to a category, keeping their others. */
  const runBulkAddToCategory = async (categoryId: string) => {
    const ids = [...selection.selectedIds];
    if (ids.length === 0) return;
    setConfirmBulkDelete(false);
    setBulkBusy(true);
    setError(null);
    try {
      await addOwnerProductsToCategory(categoryId, ids);
      const fresh = await fetchOwnerProducts(boutiqueId);
      setProducts(fresh.products);
    } catch (bulkError) {
      setError(
        bulkError instanceof Error
          ? bulkError.message
          : "Ürünler kategoriye eklenemedi.",
      );
    } finally {
      setBulkBusy(false);
      selection.clear();
    }
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

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const changeStatus = (value: "all" | TrProductStatus) => {
    setStatusFilter(value);
    setPage(1);
  };
  const changeCategory = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };
  const clearFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setPage(1);
  };
  const changePageSize = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  const pager = (
    <ListPager
      page={currentPage}
      pageCount={pageCount}
      pageSize={pageSize}
      total={visible.length}
      onPage={setPage}
      onPageSize={changePageSize}
    />
  );

  const header = (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[1.25rem] font-semibold tracking-tight text-neutral-900 sm:text-[1.375rem]">
        Ürünler
      </h2>
      <div className="flex items-center gap-2">
        <TrPanelPopover
          label="Diğer ekleme yolları"
          align="end"
          panelClassName="w-52 p-1.5"
          trigger={(props) => (
            <button
              type="button"
              {...props}
              aria-label="Diğer ekleme yolları"
              className={`${panelSecondaryBtnClass} w-11 px-0 lg:w-9`}
            >
              <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            </button>
          )}
        >
          {(close) => (
            <ul className="text-[14px] text-neutral-800">
              <li>
                <Link
                  href={trPanelTakimNewProductPath()}
                  onClick={close}
                  className="flex min-h-10 items-center rounded-md px-3 hover:bg-neutral-50"
                >
                  Takım yükle
                </Link>
              </li>
              <li>
                <Link
                  href={trPanelBatchNewProductsPath()}
                  onClick={close}
                  className="flex min-h-10 items-center rounded-md px-3 hover:bg-neutral-50"
                >
                  Toplu ekle
                </Link>
              </li>
              {restyleCandidates.length > 0 ? (
                <li>
                  <button
                    type="button"
                    className="flex min-h-10 w-full items-center rounded-md px-3 text-left hover:bg-neutral-50"
                    onClick={() => {
                      close();
                      openRestyle?.({
                        boutiqueId,
                        boutiqueSlug,
                        products: restyleCandidates,
                      });
                    }}
                  >
                    Packshot + model
                  </button>
                </li>
              ) : null}
            </ul>
          )}
        </TrPanelPopover>
        <Link
          href={trPanelNewProductPath()}
          className={`${panelPrimaryBtnClass} ${desktopButtonSize}`}
        >
          Ürün ekle
        </Link>
      </div>
    </div>
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(event) => changeSearch(event.target.value)}
          placeholder="Tabloda arama yapın"
          className={`${panelFieldClass} pl-9`}
          aria-label="Ürünlerde ara"
        />
      </div>
      <TrPanelPopover
        label="Filtreler"
        panelClassName="w-[19rem] p-4"
        trigger={(props) => (
          <button
            type="button"
            {...props}
            className={`${panelSecondaryBtnClass} gap-2`}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Filtre
            {filterCount > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[color:var(--panel-accent)] px-1 text-[11px] font-semibold text-white">
                {filterCount}
              </span>
            ) : null}
          </button>
        )}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className={panelLabelClass}>Durum</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => changeStatus("all")}
                className={filterChipClass(statusFilter === "all")}
              >
                Tümü
              </button>
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => changeStatus(status)}
                  className={filterChipClass(statusFilter === status)}
                >
                  {STATUS_LABEL[status]}
                </button>
              ))}
            </div>
          </div>
          <label className="block space-y-2">
            <span className={panelLabelClass}>Kategori</span>
            <select
              className={panelFieldClass}
              value={categoryFilter}
              onChange={(event) => changeCategory(event.target.value)}
            >
              <option value="all">Tümü</option>
              {categories.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
              {uncategorizedCount > 0 ? (
                <option value="uncategorized">Kategorisiz</option>
              ) : null}
            </select>
          </label>
          {filterCount > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[13px] font-semibold text-[color:var(--panel-accent-deep)] hover:underline"
            >
              Filtreleri temizle
            </button>
          ) : null}
        </div>
      </TrPanelPopover>
    </div>
  );

  return (
    <div className="space-y-4">
      {header}

      {loading && products.length === 0 ? (
        <TrPanelListSkeleton rows={6} label="Ürünler yükleniyor" />
      ) : error && products.length === 0 ? (
        <TrPanelFadeIn key="products-error">
          <p className={panelErrorClass}>{error}</p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn key="products-ready" className="space-y-4" shift={false}>
          {notice ? (
            <p className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-5 py-4 text-[16px] text-amber-950">
              {notice}
            </p>
          ) : null}
          {error ? <p className={panelErrorClass}>{error}</p> : null}

          {products.length > 0 ? toolbar : null}

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
              Aramanıza uyan ürün yok.
              {filterCount > 0 ? (
                <>
                  <br />
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-3 inline-block font-semibold underline"
                    style={{ color: "var(--panel-accent-deep)" }}
                  >
                    Filtreleri temizle
                  </button>
                </>
              ) : null}
            </p>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-4 lg:hidden">
                <TrPanelStagger className="space-y-3">
                  {pageItems.map((product, index) => {
                    const categoryLabel = categoryName(custom, ownNames, product.category);
                    return (
                      <motion.div
                        key={product.id}
                        variants={trPanelStaggerItem}
                      >
                        <Link
                          href={trPanelEditProductPath(product.id)}
                          className="flex items-center gap-4 rounded-xl border border-neutral-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:bg-[color:var(--panel-accent-soft)]"
                        >
                          <ProductThumb
                            product={product}
                            priority={index < 4}
                            className="h-20 w-16 rounded-lg"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="min-w-0 truncate text-[16px] font-semibold text-neutral-900">
                                {product.title}
                              </p>
                              <StatusBadge status={product.status} />
                            </div>
                            {categoryLabel ? (
                              <p className="truncate text-[13px] text-neutral-500">
                                {categoryLabel}
                              </p>
                            ) : null}
                            <p className="flex flex-wrap items-baseline gap-x-3 text-[14px]">
                              <ProductPrice product={product} />
                              <span className="text-neutral-600">
                                <ProductStock product={product} />
                              </span>
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </TrPanelStagger>
                <div className="rounded-xl border border-neutral-200/80 bg-white px-4 py-3">
                  {pager}
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden space-y-3 lg:block">
                <TrPanelDataTable
                  contained={false}
                  onKeyDown={selection.onKeyDown}
                  selectAll={{
                    checked: selection.allVisibleSelected,
                    indeterminate:
                      selection.someVisibleSelected &&
                      !selection.allVisibleSelected,
                    onChange: selection.setAllVisible,
                    disabled: bulkBusy,
                  }}
                  headers={["Ürün", "Satış fiyatı", "Envanter"]}
                  footer={pager}
                >
                  {pageItems.map((product, index) => {
                    const categoryLabel = categoryName(custom, ownNames, product.category);
                    const href = trPanelEditProductPath(product.id);
                    return (
                      <TrPanelDataTableRow
                        key={product.id}
                        selected={selection.isSelected(product.id)}
                        onActivate={() => router.push(href)}
                        onPointerEnter={() => router.prefetch(href)}
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
                            <ProductThumb
                              product={product}
                              priority={index < 4}
                              className="h-12 w-10 rounded"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={href}
                                  className="max-w-[320px] truncate font-semibold text-neutral-900 hover:underline"
                                >
                                  {product.title}
                                </Link>
                                <StatusBadge status={product.status} />
                              </div>
                              {categoryLabel ? (
                                <p className="truncate text-[12px] text-neutral-500">
                                  {categoryLabel}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <ProductPrice product={product} />
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <ProductStock product={product} />
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
                  {custom ? (
                    <select
                      className={panelDesktopSelectClass}
                      defaultValue=""
                      disabled={bulkBusy || ownCategories.length === 0}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === "") return;
                        void runBulkAddToCategory(value);
                        event.target.value = "";
                      }}
                    >
                      <option value="" disabled>
                        Kategori ekle…
                      </option>
                      {flattenCategoryTree(ownCategories).map(({ category, depth }) => (
                        <option key={category.id} value={category.id}>
                          {`${"— ".repeat(depth)}${category.name}`}
                        </option>
                      ))}
                    </select>
                  ) : (
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
                  )}
                  <button
                    type="button"
                    disabled={bulkBusy || restyleSelectionIds.length === 0}
                    className={panelDesktopBtnClass}
                    onClick={() => {
                      openRestyle?.({
                        boutiqueId,
                        boutiqueSlug,
                        products: restyleCandidates,
                        initiallyCheckedIds: restyleSelectionIds,
                      });
                    }}
                  >
                    Packshot + model
                  </button>
                  <button
                    type="button"
                    disabled={bulkBusy}
                    className={panelDesktopBtnClass}
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
                        className={panelDesktopDangerBtnClass}
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
    </div>
  );
}

export function TrOwnerProductListPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <ProductList
            boutiqueId={activeBoutique.id}
            boutiqueSlug={activeBoutique.slug}
            categoryMode={activeBoutique.categoryMode ?? "legacy"}
          />
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}
