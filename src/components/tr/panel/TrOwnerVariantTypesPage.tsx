"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import {
  TrPanelBusySpinner,
  TrPanelFadeIn,
  TrPanelListSkeleton,
} from "@/components/tr/panel/TrPanelMotion";
import { TrVariantTypeDrawer } from "@/components/tr/panel/TrVariantTypeDrawer";
import {
  panelBackLinkClass,
  panelEmptyClass,
  panelErrorClass,
  panelFieldClass,
  panelHintClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  fetchOwnerVariantTypes,
  importOwnerVariantPresets,
} from "@/lib/tr/ownerClient";
import { trPanelDefinitionsPath } from "@/lib/tr/paths";
import { toast } from "@/lib/tr/panel/toast";
import type {
  TrVariantPresetImport,
  TrVariantType,
  TrVariantTypeListEntry,
} from "@/lib/tr/variants/types";

interface Loaded {
  boutiqueId: string;
  types: TrVariantTypeListEntry[];
  importable: TrVariantPresetImport;
}

const PREVIEW_VALUES = 5;

function styleLabel(type: TrVariantType): string {
  return type.selectionStyle === "swatch" ? "Renk / Görsel" : "Liste";
}

/** "Kırmızı, Mavi, Yeşil +2", with the colours as dots for a swatch type. */
function ValuesPreview({ type }: { type: TrVariantType }) {
  const shown = type.values.slice(0, PREVIEW_VALUES);
  const more = type.values.length - shown.length;
  return (
    <span className="flex min-w-0 items-center gap-2 text-[13px] text-neutral-600">
      {type.selectionStyle === "swatch" ? (
        <span className="flex shrink-0 -space-x-1" aria-hidden>
          {shown.map((value) => (
            <span
              key={value.id}
              className="size-4 rounded-full border border-white bg-neutral-200 bg-cover bg-center ring-1 ring-neutral-300"
              style={{
                ...(value.hex ? { backgroundColor: value.hex } : {}),
                ...(value.imageUrl ? { backgroundImage: `url(${value.imageUrl})` } : {}),
              }}
            />
          ))}
        </span>
      ) : null}
      <span className="min-w-0 truncate">
        {shown.map((value) => value.label).join(", ")}
        {more > 0 ? ` +${more}` : ""}
      </span>
    </span>
  );
}

function ImportOffer({
  importable,
  importing,
  onImport,
}: {
  importable: TrVariantPresetImport;
  importing: boolean;
  onImport: () => void;
}) {
  const parts = [
    importable.sizes > 0 ? `Beden (${importable.sizes} değer)` : null,
    importable.colors > 0 ? `Renk (${importable.colors} değer)` : null,
  ].filter(Boolean);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--panel-accent)]/30 bg-[color:var(--panel-accent-soft)] px-4 py-3">
      <p className="min-w-0 flex-1 basis-80 text-[14px] text-neutral-800">
        Ürün düzenleyicideki kayıtlı beden ve renklerinizi varyant türü olarak
        içe aktarabilirsiniz: <span className="font-semibold">{parts.join(" · ")}</span>.
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
          "İçe aktar"
        )}
      </button>
    </div>
  );
}

/** The list, drawer included; the page below only adds the panel gate around it. */
export function TrVariantTypesList({ boutiqueId }: { boutiqueId: string }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [version, setVersion] = useState(0);
  const [importing, setImporting] = useState(false);
  // `null` = closed; `{ type: null }` = creating; `{ type }` = editing.
  const [drawer, setDrawer] = useState<{ type: TrVariantType | null } | null>(null);
  // The drawer keeps showing what it last showed while it slides out.
  const [drawerType, setDrawerType] = useState<TrVariantType | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOwnerVariantTypes(boutiqueId)
      .then((result) => {
        if (!cancelled) {
          setError(null);
          setLoaded({ boutiqueId, ...result });
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Varyant türleri yüklenemedi.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId, version]);

  const ready = loaded?.boutiqueId === boutiqueId ? loaded : null;
  const query = search.trim().toLocaleLowerCase("tr");
  const rows = useMemo(() => {
    if (!ready) return [];
    if (!query) return ready.types;
    return ready.types.filter(
      (type) =>
        type.name.toLocaleLowerCase("tr").includes(query) ||
        type.values.some((value) => value.label.toLocaleLowerCase("tr").includes(query)),
    );
  }, [ready, query]);

  const openDrawer = (type: TrVariantType | null) => {
    setDrawerType(type);
    setDrawer({ type });
  };

  const importPresets = async () => {
    setImporting(true);
    try {
      await importOwnerVariantPresets(boutiqueId);
      toast.success("Beden ve renkler varyant türü olarak aktarıldı.");
      setVersion((current) => current + 1);
    } catch (importError) {
      toast.error(importError, "İçe aktarılamadı.");
    } finally {
      setImporting(false);
    }
  };

  const showImport =
    ready && (ready.importable.sizes > 0 || ready.importable.colors > 0);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Link href={trPanelDefinitionsPath()} className={panelBackLinkClass}>
          ← Tanımlamalar
        </Link>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[1.25rem] font-semibold tracking-tight text-neutral-900 sm:text-[1.375rem]">
            Varyant Türleri
          </h2>
          {ready ? (
            <button
              type="button"
              onClick={() => openDrawer(null)}
              className={panelPrimaryBtnClass}
            >
              Varyant Türü Ekle
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className={panelErrorClass}>{error}</p> : null}

      {!ready ? (
        error ? null : (
          <TrPanelListSkeleton rows={3} label="Varyant türleri yükleniyor" />
        )
      ) : (
        <TrPanelFadeIn className="space-y-4" shift={false}>
          {showImport ? (
            <ImportOffer
              importable={ready.importable}
              importing={importing}
              onImport={() => void importPresets()}
            />
          ) : null}

          {ready.types.length === 0 ? (
            <div className={panelEmptyClass}>
              <p className="font-semibold text-neutral-900">
                Henüz varyant türü eklemediniz.
              </p>
              <p className={`mt-1 ${panelHintClass}`}>
                Renk, beden gibi seçenekleri bir kez tanımlayın; ürünlerinizin
                varyantlarında kullanın.
              </p>
              <button
                type="button"
                onClick={() => openDrawer(null)}
                className={`${panelPrimaryBtnClass} mt-4`}
              >
                Varyant Türü Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative max-w-sm">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tabloda arama yapın"
                  className={`${panelFieldClass} pl-9`}
                  aria-label="Varyant türlerinde ara"
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <div className="hidden grid-cols-[12rem_9rem_minmax(0,1fr)_6rem] gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[12px] font-semibold tracking-wide text-neutral-500 lg:grid">
                  <span>Ad</span>
                  <span>Seçim Stili</span>
                  <span>Varyantlar</span>
                  <span className="text-right">Ürünler</span>
                </div>
                {rows.length === 0 ? (
                  <p className="px-4 py-10 text-center text-[14px] text-neutral-500">
                    Aramanıza uyan varyant türü yok.
                  </p>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {rows.map((type) => (
                      <li key={type.id}>
                        <button
                          type="button"
                          onClick={() => openDrawer(type)}
                          className="grid w-full cursor-pointer grid-cols-[12rem_9rem_minmax(0,1fr)_6rem] items-center gap-x-4 px-4 py-3 text-left transition-colors duration-150 hover:bg-[color:var(--panel-accent-soft)]/60 focus-visible:bg-[color:var(--panel-accent-soft)]/60 focus-visible:outline-none motion-reduce:transition-none"
                        >
                          <span className="min-w-0 truncate text-[14px] font-semibold text-neutral-900">
                            {type.name}
                          </span>
                          <span className="text-[13px] text-neutral-600">
                            {styleLabel(type)}
                          </span>
                          <ValuesPreview type={type} />
                          <span className="text-right text-[13px] text-neutral-600 tabular-nums">
                            {type.productCount} ürün
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </TrPanelFadeIn>
      )}

      <TrVariantTypeDrawer
        open={drawer !== null}
        boutiqueId={boutiqueId}
        type={drawerType}
        types={ready?.types ?? []}
        onClose={() => setDrawer(null)}
        onSaved={() => {
          setDrawer(null);
          setVersion((current) => current + 1);
        }}
        onDeleted={() => {
          setDrawer(null);
          setVersion((current) => current + 1);
        }}
      />
    </div>
  );
}

export function TrOwnerVariantTypesPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <TrVariantTypesList boutiqueId={activeBoutique.id} />
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}
