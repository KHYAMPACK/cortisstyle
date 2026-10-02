"use client";

import { useEffect, useMemo, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import {
  TrPanelBusySpinner,
  TrPanelFadeIn,
  TrPanelListSkeleton,
} from "@/components/tr/panel/TrPanelMotion";
import { TrProductKindDrawer } from "@/components/tr/panel/TrProductKindDrawer";
import {
  TrPanelFilterChips,
  TrPanelFilterClear,
  TrPanelTableToolbar,
} from "@/components/tr/panel/TrPanelTableToolbar";
import {
  panelBackLinkClass,
  panelEmptyClass,
  panelErrorClass,
  panelHintClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import type { TrCategoryListEntry } from "@/lib/tr/categories/types";
import {
  fetchOwnerAttributes,
  fetchOwnerCategories,
  fetchOwnerProductKinds,
  fetchOwnerVariantTypes,
  importOwnerProductKinds,
} from "@/lib/tr/ownerClient";
import { trPanelAttributesPath, trPanelDefinitionsPath } from "@/lib/tr/paths";
import { toast } from "@/lib/tr/panel/toast";
import type {
  TrAttributeListEntry,
  TrProductKind,
  TrProductKindListEntry,
} from "@/lib/tr/productKinds/types";
import type { TrVariantTypeListEntry } from "@/lib/tr/variants/types";

interface Loaded {
  boutiqueId: string;
  kinds: TrProductKindListEntry[];
  importable: boolean;
  attributes: TrAttributeListEntry[];
  variantTypes: TrVariantTypeListEntry[];
  categories: TrCategoryListEntry[];
}

const PREVIEW_FIELDS = 4;

type CountFilter = "all" | "with" | "without";

const PRODUCTS_FILTER: ReadonlyArray<{ id: CountFilter; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "with", label: "Ürünü olan" },
  { id: "without", label: "Boş" },
];

const VARIANTS_FILTER: ReadonlyArray<{ id: CountFilter; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "with", label: "Varyantla başlayan" },
  { id: "without", label: "Varyantsız" },
];

function ImportOffer({ importing, onImport }: { importing: boolean; onImport: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--panel-accent)]/30 bg-[color:var(--panel-accent-soft)] px-4 py-3">
      <p className="min-w-0 flex-1 basis-80 text-[14px] text-neutral-800">
        Hazır moda türleriyle başlayın:{" "}
        <span className="font-semibold">
          Elbise · Üst giyim · Etek · Pantolon · Takım · Aksesuar · Ev tekstili
        </span>
        , ürün düzenleyicide bugün gördüğünüz alanlarıyla. Ürünleriniz kategorilerine
        göre bu türlere atanır; ürün bilgileri değişmez.
      </p>
      <button
        type="button"
        onClick={onImport}
        disabled={importing}
        className={`${panelSecondaryBtnClass} gap-2`}
      >
        {importing ? (
          <>
            <TrPanelBusySpinner />
            Aktarılıyor…
          </>
        ) : (
          "Hazır türleri içe aktar"
        )}
      </button>
    </div>
  );
}

/** Ürün türleri: what a product is, and so which fields it has. */
function ProductKindsList({ boutiqueId }: { boutiqueId: string }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [importing, setImporting] = useState(false);
  const [drawer, setDrawer] = useState<{ kind: TrProductKindListEntry | null } | null>(null);
  const [drawerKind, setDrawerKind] = useState<TrProductKindListEntry | null>(null);
  const [search, setSearch] = useState("");
  const [productsFilter, setProductsFilter] = useState<CountFilter>("all");
  const [variantsFilter, setVariantsFilter] = useState<CountFilter>("all");
  const filterCount = (productsFilter !== "all" ? 1 : 0) + (variantsFilter !== "all" ? 1 : 0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchOwnerProductKinds(boutiqueId),
      fetchOwnerAttributes(boutiqueId),
      fetchOwnerVariantTypes(boutiqueId),
      fetchOwnerCategories(boutiqueId),
    ])
      .then(([kinds, attributes, variantTypes, categories]) => {
        if (cancelled) return;
        setError(null);
        setLoaded({
          boutiqueId,
          kinds: kinds.kinds,
          importable: kinds.importable,
          attributes,
          variantTypes: variantTypes.types,
          categories: categories.categories,
        });
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Ürün türleri yüklenemedi.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId, version]);

  const ready = loaded?.boutiqueId === boutiqueId ? loaded : null;
  const attributeLabel = useMemo(
    () => new Map((ready?.attributes ?? []).map((attribute) => [attribute.id, attribute.label])),
    [ready],
  );
  const typeName = useMemo(
    () => new Map((ready?.variantTypes ?? []).map((type) => [type.id, type.name])),
    [ready],
  );

  const rows = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("tr");
    return (ready?.kinds ?? []).filter((kind) => {
      if (needle) {
        const fields = kind.attributes
          .map((link) => attributeLabel.get(link.attributeId) ?? "")
          .join(" ");
        if (!`${kind.name} ${fields}`.toLocaleLowerCase("tr").includes(needle)) return false;
      }
      if (productsFilter !== "all" && (kind.productCount > 0) !== (productsFilter === "with")) {
        return false;
      }
      if (
        variantsFilter !== "all" &&
        (kind.defaultOptionTypeIds.length > 0) !== (variantsFilter === "with")
      ) {
        return false;
      }
      return true;
    });
  }, [ready, search, productsFilter, variantsFilter, attributeLabel]);

  const openDrawer = (kind: TrProductKindListEntry | null) => {
    setDrawerKind(kind);
    setDrawer({ kind });
  };
  const refresh = () => {
    setDrawer(null);
    setVersion((current) => current + 1);
  };

  const importKinds = async () => {
    setImporting(true);
    try {
      const result = await importOwnerProductKinds(boutiqueId);
      toast.success(
        `${result.kinds} ürün türü ve ${result.attributes} özellik eklendi; ${result.assigned} ürüne tür atandı.`,
      );
      setVersion((current) => current + 1);
    } catch (importError) {
      toast.error(importError, "Hazır türler aktarılamadı.");
    } finally {
      setImporting(false);
    }
  };

  const fieldsPreview = (kind: TrProductKind) => {
    const names = kind.attributes
      .map((link) => attributeLabel.get(link.attributeId))
      .filter((label): label is string => Boolean(label));
    const shown = names.slice(0, PREVIEW_FIELDS);
    const more = names.length - shown.length;
    return names.length === 0 ? "—" : `${shown.join(", ")}${more > 0 ? ` +${more}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Link href={trPanelDefinitionsPath()} className={panelBackLinkClass}>
          ← Tanımlamalar
        </Link>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[1.25rem] font-semibold tracking-tight text-neutral-900 sm:text-[1.375rem]">
            Ürün Türleri
          </h2>
          {ready ? (
            <button type="button" onClick={() => openDrawer(null)} className={panelPrimaryBtnClass}>
              Ürün Türü Ekle
            </button>
          ) : null}
        </div>
        <p className={panelHintClass}>
          Bir ürünün ne olduğu (Elbise, Pantolon…): hangi{" "}
          <Link href={trPanelAttributesPath()} className="font-medium underline">
            özellikleri
          </Link>{" "}
          doldurulacağını ve hangi varyantlarla başlayacağını belirler. Kategoriden
          bağımsızdır.
        </p>
      </div>

      {error ? <p className={panelErrorClass}>{error}</p> : null}

      {!ready ? (
        error ? null : <TrPanelListSkeleton rows={4} label="Ürün türleri yükleniyor" />
      ) : (
        <TrPanelFadeIn className="space-y-4" shift={false}>
          {ready.importable ? (
            <ImportOffer importing={importing} onImport={() => void importKinds()} />
          ) : null}

          {ready.kinds.length === 0 ? (
            <div className={panelEmptyClass}>
              <p className="font-semibold text-neutral-900">Henüz ürün türü eklemediniz.</p>
              <p className={`mt-1 ${panelHintClass}`}>
                Ürün türleri, ürün eklerken hangi alanların çıkacağını belirler.
              </p>
            </div>
          ) : (
            <>
            <TrPanelTableToolbar
              search={search}
              onSearchChange={setSearch}
              searchLabel="Ürün türlerinde ara"
              filterCount={filterCount}
              filters={
                <div className="space-y-4">
                  <TrPanelFilterChips
                    label="Ürünler"
                    options={PRODUCTS_FILTER}
                    value={productsFilter}
                    onChange={setProductsFilter}
                  />
                  <TrPanelFilterChips
                    label="Başlangıç varyantları"
                    options={VARIANTS_FILTER}
                    value={variantsFilter}
                    onChange={setVariantsFilter}
                  />
                  <TrPanelFilterClear
                    active={filterCount > 0}
                    onClear={() => {
                      setProductsFilter("all");
                      setVariantsFilter("all");
                    }}
                  />
                </div>
              }
            />
            <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="hidden grid-cols-[11rem_minmax(0,1fr)_10rem_6rem] gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[12px] font-semibold tracking-wide text-neutral-500 lg:grid">
                <span>Ad</span>
                <span>Özellikler</span>
                <span>Varyantlar</span>
                <span className="text-right">Ürünler</span>
              </div>
              {rows.length === 0 ? (
                <p className="px-4 py-10 text-center text-[14px] text-neutral-500">
                  Aramanıza veya filtrelere uyan ürün türü yok.
                </p>
              ) : (
              <ul className="divide-y divide-neutral-100">
                {rows.map((kind) => (
                  <li key={kind.id}>
                    <button
                      type="button"
                      onClick={() => openDrawer(kind)}
                      className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 text-left transition-colors duration-150 hover:bg-[color:var(--panel-accent-soft)]/60 focus-visible:bg-[color:var(--panel-accent-soft)]/60 focus-visible:outline-none lg:grid-cols-[11rem_minmax(0,1fr)_10rem_6rem] motion-reduce:transition-none"
                    >
                      <span className="min-w-0 truncate text-[14px] font-semibold text-neutral-900">
                        {kind.name}
                      </span>
                      <span className="col-span-2 min-w-0 truncate text-[13px] text-neutral-600 lg:col-span-1 lg:row-start-1 lg:col-start-2">
                        {fieldsPreview(kind)}
                      </span>
                      <span className="hidden min-w-0 truncate text-[13px] text-neutral-600 lg:block">
                        {kind.defaultOptionTypeIds
                          .map((id) => typeName.get(id))
                          .filter(Boolean)
                          .join(" × ") || "—"}
                      </span>
                      <span className="row-start-1 text-right text-[13px] text-neutral-600 tabular-nums lg:row-start-auto">
                        {kind.productCount} ürün
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              )}
            </div>
            </>
          )}
        </TrPanelFadeIn>
      )}

      <TrProductKindDrawer
        open={drawer !== null}
        boutiqueId={boutiqueId}
        kind={drawerKind}
        productCount={drawerKind?.productCount ?? 0}
        attributes={ready?.attributes ?? []}
        variantTypes={ready?.variantTypes ?? []}
        categories={ready?.categories ?? []}
        onClose={() => setDrawer(null)}
        onSaved={refresh}
        onDeleted={refresh}
      />
    </div>
  );
}

export function TrOwnerProductKindsPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <ProductKindsList boutiqueId={activeBoutique.id} />
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}
