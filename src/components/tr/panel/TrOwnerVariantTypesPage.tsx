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
import { TrPanelModal } from "@/components/tr/panel/TrPanelModal";
import { TrVariantTypeDrawer } from "@/components/tr/panel/TrVariantTypeDrawer";
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
import {
  fetchOwnerVariantTypes,
  importOwnerSizeTypes,
  renameOwnerProductSizes,
} from "@/lib/tr/ownerClient";
import { trPanelDefinitionsPath } from "@/lib/tr/paths";
import { toast } from "@/lib/tr/panel/toast";
import type { SizeRenameOffer } from "@/lib/tr/variants/sizeRenames";
import type {
  TrVariantTypeImportOffer,
  TrVariantType,
  TrVariantTypeListEntry,
} from "@/lib/tr/variants/types";

interface Loaded {
  boutiqueId: string;
  types: TrVariantTypeListEntry[];
  importable: TrVariantTypeImportOffer;
}

const PREVIEW_VALUES = 5;

type StyleFilter = "all" | "list" | "swatch";
type RoleFilter = "all" | "size" | "color" | "other";

const STYLE_FILTER: ReadonlyArray<{ id: StyleFilter; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "list", label: "Liste" },
  { id: "swatch", label: "Renk / Görsel" },
];

const ROLE_FILTER: ReadonlyArray<{ id: RoleFilter; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "size", label: "Beden" },
  { id: "color", label: "Renk" },
  { id: "other", label: "Diğer" },
];

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
  sizeTypes,
  importing,
  onImport,
}: {
  sizeTypes: string[];
  importing: boolean;
  onImport: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--panel-accent)]/30 bg-[color:var(--panel-accent-soft)] px-4 py-3">
      <p className="min-w-0 flex-1 basis-80 text-[14px] text-neutral-800">
        Hazır beden listeleriyle başlayın, sonra dilediğiniz gibi düzenleyin:{" "}
        <span className="font-semibold">{sizeTypes.join(" · ")}</span>. Ürün
        düzenleyicideki beden tablosu bu listeleri kullanır.
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
          "Hazır bedenleri içe aktar"
        )}
      </button>
    </div>
  );
}

/**
 * After a Beden type's sizes were renamed: offer to rename them on the products that
 * still carry the old labels (Mert, 2026-09-30: "offer to update").
 */
function SizeRenameDialog({
  pending,
  onClose,
}: {
  pending: { typeId: string; offers: SizeRenameOffer[] } | null;
  onClose: () => void;
}) {
  const [applying, setApplying] = useState(false);
  const offers = pending?.offers ?? [];
  const productCount = Math.max(0, ...offers.map((offer) => offer.productCount));

  const apply = async () => {
    if (!pending) return;
    setApplying(true);
    try {
      const updated = await renameOwnerProductSizes(pending.typeId, pending.offers);
      toast.success(`${updated} üründe beden güncellendi.`);
      onClose();
    } catch (applyError) {
      toast.error(applyError, "Ürünlerdeki bedenler güncellenemedi.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <TrPanelModal
      open={pending !== null}
      onClose={() => {
        if (!applying) onClose();
      }}
      title="Ürünlerdeki bedenler de güncellensin mi?"
      footer={
        <>
          <button
            type="button"
            className={panelSecondaryBtnClass}
            disabled={applying}
            onClick={onClose}
          >
            Hayır
          </button>
          <button
            type="button"
            className={`${panelPrimaryBtnClass} gap-2`}
            disabled={applying}
            onClick={() => void apply()}
          >
            {applying ? (
              <>
                <TrPanelBusySpinner />
                Güncelleniyor…
              </>
            ) : (
              "Evet, güncelle"
            )}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-[14px] text-neutral-800">
        <p>Değiştirdiğiniz bedenler ürünlerinizde hâlâ eski adıyla duruyor:</p>
        <ul className="space-y-1">
          {offers.map((offer) => (
            <li key={offer.from}>
              <span className="font-semibold">{offer.from}</span> →{" "}
              <span className="font-semibold">{offer.to}</span>{" "}
              <span className="text-neutral-500">({offer.productCount} ürün)</span>
            </li>
          ))}
        </ul>
        <p className={panelHintClass}>
          Evet derseniz {productCount > 1 ? "bu ürünlerde" : "bu üründe"} beden adı
          değişir; stok aynı kalır. Hayır derseniz ürünler eski bedenle kalır.
        </p>
      </div>
    </TrPanelModal>
  );
}

/** The list, drawer included; the page below only adds the panel gate around it. */
export function TrVariantTypesList({ boutiqueId }: { boutiqueId: string }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState<StyleFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const filterCount = (styleFilter !== "all" ? 1 : 0) + (roleFilter !== "all" ? 1 : 0);
  const [version, setVersion] = useState(0);
  const [importing, setImporting] = useState(false);
  // `null` = closed; `{ type: null }` = creating; `{ type }` = editing.
  const [drawer, setDrawer] = useState<{ type: TrVariantType | null } | null>(null);
  // The drawer keeps showing what it last showed while it slides out.
  const [drawerType, setDrawerType] = useState<TrVariantType | null>(null);
  const [pendingRenames, setPendingRenames] = useState<{
    typeId: string;
    offers: SizeRenameOffer[];
  } | null>(null);

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
    return ready.types.filter(
      (type) =>
        (!query ||
          type.name.toLocaleLowerCase("tr").includes(query) ||
          type.values.some((value) => value.label.toLocaleLowerCase("tr").includes(query))) &&
        (styleFilter === "all" || type.selectionStyle === styleFilter) &&
        (roleFilter === "all" || (type.role ?? "other") === roleFilter),
    );
  }, [ready, query, styleFilter, roleFilter]);

  const openDrawer = (type: TrVariantType | null) => {
    setDrawerType(type);
    setDrawer({ type });
  };

  const importSizeTypes = async () => {
    setImporting(true);
    try {
      await importOwnerSizeTypes(boutiqueId);
      toast.success("Hazır bedenler aktarıldı.");
      setVersion((current) => current + 1);
    } catch (importError) {
      toast.error(importError, "İçe aktarılamadı.");
    } finally {
      setImporting(false);
    }
  };

  const showImport = Boolean(ready && ready.importable.sizeTypes.length > 0);

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
              sizeTypes={ready.importable.sizeTypes}
              importing={importing}
              onImport={() => void importSizeTypes()}
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
              <TrPanelTableToolbar
                search={search}
                onSearchChange={setSearch}
                searchLabel="Varyant türlerinde ara"
                filterCount={filterCount}
                filters={
                  <div className="space-y-4">
                    <TrPanelFilterChips
                      label="Seçim stili"
                      options={STYLE_FILTER}
                      value={styleFilter}
                      onChange={setStyleFilter}
                    />
                    <TrPanelFilterChips
                      label="Kullanım"
                      options={ROLE_FILTER}
                      value={roleFilter}
                      onChange={setRoleFilter}
                    />
                    <TrPanelFilterClear
                      active={filterCount > 0}
                      onClear={() => {
                        setStyleFilter("all");
                        setRoleFilter("all");
                      }}
                    />
                  </div>
                }
              />

              <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <div className="hidden grid-cols-[12rem_9rem_minmax(0,1fr)_6rem] gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[12px] font-semibold tracking-wide text-neutral-500 lg:grid">
                  <span>Ad</span>
                  <span>Seçim Stili</span>
                  <span>Varyantlar</span>
                  <span className="text-right">Ürünler</span>
                </div>
                {rows.length === 0 ? (
                  <p className="px-4 py-10 text-center text-[14px] text-neutral-500">
                    Aramanıza veya filtrelere uyan varyant türü yok.
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
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="min-w-0 truncate text-[14px] font-semibold text-neutral-900">
                              {type.name}
                            </span>
                            {type.role ? (
                              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                                {type.role === "size" ? "Beden" : "Renk"}
                              </span>
                            ) : null}
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
        onSaved={(saved, sizeRenames) => {
          setDrawer(null);
          setVersion((current) => current + 1);
          if (sizeRenames.length > 0) {
            setPendingRenames({ typeId: saved.id, offers: sizeRenames });
          }
        }}
        onDeleted={() => {
          setDrawer(null);
          setVersion((current) => current + 1);
        }}
      />
      <SizeRenameDialog pending={pendingRenames} onClose={() => setPendingRenames(null)} />
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
