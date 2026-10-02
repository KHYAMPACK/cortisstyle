"use client";

import { useEffect, useMemo, useState } from "react";
import { TrAttributeDrawer, ATTRIBUTE_INPUT_OPTIONS } from "@/components/tr/panel/TrAttributeDrawer";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { TrPanelFadeIn, TrPanelListSkeleton } from "@/components/tr/panel/TrPanelMotion";
import {
  TrPanelFilterSelect,
  TrPanelFilterClear,
  TrPanelTableToolbar,
} from "@/components/tr/panel/TrPanelTableToolbar";
import {
  panelBackLinkClass,
  panelEmptyClass,
  panelErrorClass,
  panelHintClass,
  panelPrimaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { fetchOwnerAttributes } from "@/lib/tr/ownerClient";
import { trPanelDefinitionsPath, trPanelProductKindsPath } from "@/lib/tr/paths";
import type {
  TrAttributeDefinition,
  TrAttributeInput,
  TrAttributeListEntry,
} from "@/lib/tr/productKinds/types";

const PREVIEW_OPTIONS = 5;

const INPUT_FILTER: ReadonlyArray<{ id: "all" | TrAttributeInput; label: string }> = [
  { id: "all", label: "Tümü" },
  ...ATTRIBUTE_INPUT_OPTIONS.map((option) => ({ id: option.id, label: option.label })),
];

const USE_FILTER: ReadonlyArray<{ id: "all" | "used" | "unused"; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "used", label: "Bir türde kullanılan" },
  { id: "unused", label: "Kullanılmayan" },
];

function inputLabel(attribute: TrAttributeDefinition): string {
  return ATTRIBUTE_INPUT_OPTIONS.find((option) => option.id === attribute.input)?.label ?? "";
}

function optionsPreview(attribute: TrAttributeDefinition): string {
  if (attribute.input !== "choice") return "—";
  const shown = attribute.options.slice(0, PREVIEW_OPTIONS);
  const more = attribute.options.length - shown.length;
  return `${shown.join(", ")}${more > 0 ? ` +${more}` : ""}`;
}

/** Özellikler: the fields product kinds draw on (Kumaş, Yaka, Boy…). */
function AttributesList({ boutiqueId }: { boutiqueId: string }) {
  const [loaded, setLoaded] = useState<{
    boutiqueId: string;
    attributes: TrAttributeListEntry[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [drawer, setDrawer] = useState<{ attribute: TrAttributeListEntry | null } | null>(null);
  const [drawerAttribute, setDrawerAttribute] = useState<TrAttributeListEntry | null>(null);
  const [search, setSearch] = useState("");
  const [inputFilter, setInputFilter] = useState<"all" | TrAttributeInput>("all");
  const [useFilter, setUseFilter] = useState<"all" | "used" | "unused">("all");
  const filterCount = (inputFilter !== "all" ? 1 : 0) + (useFilter !== "all" ? 1 : 0);

  useEffect(() => {
    let cancelled = false;
    fetchOwnerAttributes(boutiqueId)
      .then((attributes) => {
        if (!cancelled) {
          setError(null);
          setLoaded({ boutiqueId, attributes });
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Özellikler yüklenemedi.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId, version]);

  const ready = loaded?.boutiqueId === boutiqueId ? loaded : null;
  const rows = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("tr");
    return (ready?.attributes ?? []).filter(
      (attribute) =>
        (!needle ||
          `${attribute.label} ${attribute.options.join(" ")}`
            .toLocaleLowerCase("tr")
            .includes(needle)) &&
        (inputFilter === "all" || attribute.input === inputFilter) &&
        (useFilter === "all" || (attribute.kindCount > 0) === (useFilter === "used")),
    );
  }, [ready, search, inputFilter, useFilter]);
  const openDrawer = (attribute: TrAttributeListEntry | null) => {
    setDrawerAttribute(attribute);
    setDrawer({ attribute });
  };
  const refresh = () => {
    setDrawer(null);
    setVersion((current) => current + 1);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Link href={trPanelDefinitionsPath()} className={panelBackLinkClass}>
          ← Tanımlamalar
        </Link>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[1.25rem] font-semibold tracking-tight text-neutral-900 sm:text-[1.375rem]">
            Özellikler
          </h2>
          {ready ? (
            <button type="button" onClick={() => openDrawer(null)} className={panelPrimaryBtnClass}>
              Özellik Ekle
            </button>
          ) : null}
        </div>
        <p className={panelHintClass}>
          Ürün sayfasındaki “Ürün özellikleri” alanları. Hangi ürünün hangilerini
          doldurduğunu{" "}
          <Link href={trPanelProductKindsPath()} className="font-medium underline">
            Ürün türleri
          </Link>{" "}
          belirler.
        </p>
      </div>

      {error ? <p className={panelErrorClass}>{error}</p> : null}

      {!ready ? (
        error ? null : <TrPanelListSkeleton rows={4} label="Özellikler yükleniyor" />
      ) : (
        <TrPanelFadeIn className="space-y-4" shift={false}>
          {ready.attributes.length === 0 ? (
            <div className={panelEmptyClass}>
              <p className="font-semibold text-neutral-900">Henüz özellik eklemediniz.</p>
              <p className={`mt-1 ${panelHintClass}`}>
                Hazır alanlarla başlamak için Ürün türleri sayfasındaki “Hazır türleri içe
                aktar”ı kullanabilirsiniz.
              </p>
            </div>
          ) : (
            <>
            <TrPanelTableToolbar
              search={search}
              onSearchChange={setSearch}
              searchLabel="Özelliklerde ara"
              filterCount={filterCount}
              filters={
                <div className="space-y-4">
                  <TrPanelFilterSelect
                    label="Giriş"
                    options={INPUT_FILTER}
                    value={inputFilter}
                    onChange={setInputFilter}
                  />
                  <TrPanelFilterSelect
                    label="Kullanım"
                    options={USE_FILTER}
                    value={useFilter}
                    onChange={setUseFilter}
                  />
                  <TrPanelFilterClear
                    active={filterCount > 0}
                    onClear={() => {
                      setInputFilter("all");
                      setUseFilter("all");
                    }}
                  />
                </div>
              }
            />
            <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="hidden grid-cols-[12rem_8rem_minmax(0,1fr)_6rem] gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[12px] font-semibold tracking-wide text-neutral-500 lg:grid">
                <span>Ad</span>
                <span>Giriş</span>
                <span>Seçenekler</span>
                <span className="text-right">Türler</span>
              </div>
              {rows.length === 0 ? (
                <p className="px-4 py-10 text-center text-[14px] text-neutral-500">
                  Aramanıza veya filtrelere uyan özellik yok.
                </p>
              ) : (
              <ul className="divide-y divide-neutral-100">
                {rows.map((attribute) => (
                  <li key={attribute.id}>
                    <button
                      type="button"
                      onClick={() => openDrawer(attribute)}
                      className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 text-left transition-colors duration-150 hover:bg-[color:var(--panel-accent-soft)]/60 focus-visible:bg-[color:var(--panel-accent-soft)]/60 focus-visible:outline-none lg:grid-cols-[12rem_8rem_minmax(0,1fr)_6rem] motion-reduce:transition-none"
                    >
                      <span className="min-w-0 truncate text-[14px] font-semibold text-neutral-900">
                        {attribute.label}
                      </span>
                      <span className="text-[13px] text-neutral-600">{inputLabel(attribute)}</span>
                      <span className="col-span-2 min-w-0 truncate text-[13px] text-neutral-600 lg:col-span-1">
                        {optionsPreview(attribute)}
                      </span>
                      <span className="hidden text-right text-[13px] text-neutral-600 tabular-nums lg:block">
                        {attribute.kindCount} tür
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

      <TrAttributeDrawer
        open={drawer !== null}
        boutiqueId={boutiqueId}
        attribute={drawerAttribute}
        kindCount={drawerAttribute?.kindCount ?? 0}
        onClose={() => setDrawer(null)}
        onSaved={refresh}
        onDeleted={refresh}
      />
    </div>
  );
}

export function TrOwnerAttributesPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <AttributesList boutiqueId={activeBoutique.id} />
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}
