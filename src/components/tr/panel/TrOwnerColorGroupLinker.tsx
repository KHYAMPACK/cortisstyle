"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  COLOR_GROUP_MANUAL_MAX,
  colorSiblingIdsOf,
  hasColorGroup,
} from "@/lib/tr/catalog/colorSiblings";
import { getProductCoverImageFor } from "@/lib/tr/productImages";
import {
  fetchOwnerProducts,
  setOwnerColorGroup,
} from "@/lib/tr/ownerClient";
import {
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import type { TrProduct } from "@/types/tr-marketplace";

interface TrOwnerColorGroupLinkerProps {
  boutiqueId: string;
  product: TrProduct;
  onLinked: (product: TrProduct) => void;
}

export function TrOwnerColorGroupLinker({
  boutiqueId,
  product,
  onLinked,
}: TrOwnerColorGroupLinkerProps) {
  const [catalog, setCatalog] = useState<TrProduct[]>([]);
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchOwnerProducts(boutiqueId)
      .then((result) => {
        if (!cancelled) setCatalog(result.products);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId, product.features?.colorGroupId, product.features?.colorSiblingIds]);

  const siblingIds = colorSiblingIdsOf(product);
  const siblings = useMemo(
    () =>
      siblingIds
        .map((id) =>
          id === product.id
            ? product
            : catalog.find((entry) => entry.id === id),
        )
        .filter((entry): entry is TrProduct => Boolean(entry)),
    [catalog, product, siblingIds],
  );

  const grouped = hasColorGroup(product);
  const canAdd = siblingIds.length < COLOR_GROUP_MANUAL_MAX && !busy;

  const candidates = useMemo(() => {
    const taken = new Set(siblingIds.length ? siblingIds : [product.id]);
    const needle = query.trim().toLocaleLowerCase("tr");
    return catalog.filter((entry) => {
      if (taken.has(entry.id)) return false;
      if (!needle) return true;
      return entry.title.toLocaleLowerCase("tr").includes(needle);
    });
  }, [catalog, product.id, query, siblingIds]);

  async function applyMembers(productIds: string[]) {
    setBusy(true);
    setError(null);
    try {
      const updated = await setOwnerColorGroup({
        boutiqueId,
        anchorProductId: product.id,
        productIds,
      });
      onLinked(updated);
      setPickerOpen(false);
      setQuery("");
    } catch (linkError) {
      setError(
        linkError instanceof Error
          ? linkError.message
          : "Renk grubu kaydedilemedi.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-neutral-200/80 pt-5">
      <div>
        <p className={panelLabelClass}>Aynı ürün, farklı renk</p>
        <p className={`mt-1 ${panelHintClass}`}>
          Daha önce yüklediğiniz renkleri bağlayın. Mağazada ürün sayfasında
          küçük fotoğraflarla geçiş çıkar.
        </p>
      </div>

      {grouped ? (
        <ul className="space-y-2">
          {siblings.map((sibling) => {
            const cover = getProductCoverImageFor("boutique", sibling);
            const current = sibling.id === product.id;
            return (
              <li
                key={sibling.id}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2"
              >
                {cover ? (
                  <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                    <Image
                      src={cover}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </span>
                ) : (
                  <span className="h-12 w-9 shrink-0 rounded-md bg-neutral-100" />
                )}
                <span className="min-w-0 flex-1 text-[14px] font-medium text-neutral-900">
                  {sibling.title}
                  {current ? (
                    <span className="mt-0.5 block text-[12px] font-normal text-neutral-500">
                      Bu ürün
                    </span>
                  ) : null}
                </span>
                {current ? null : (
                  <button
                    type="button"
                    className={`${panelSecondaryBtnClass} min-h-11 px-3 text-[13px]`}
                    disabled={busy}
                    onClick={() =>
                      void applyMembers(
                        siblingIds.filter((id) => id !== sibling.id),
                      )
                    }
                  >
                    Kaldır
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={panelHintClass}>Henüz bağlı renk yok.</p>
      )}

      {grouped ? (
        <button
          type="button"
          className={panelSecondaryBtnClass}
          disabled={busy}
          onClick={() => void applyMembers([product.id])}
        >
          Tüm bağlantıları kaldır
        </button>
      ) : null}

      {canAdd ? (
        pickerOpen ? (
          <div className="space-y-3 rounded-xl border border-neutral-200 bg-[#F7F5F1] p-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={panelFieldClass}
              placeholder="Ürün ara…"
              autoFocus
            />
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {candidates.length === 0 ? (
                <li className="px-1 py-2 text-[13px] text-neutral-500">
                  Uygun ürün yok.
                </li>
              ) : (
                candidates.slice(0, 20).map((entry) => {
                  const cover = getProductCoverImageFor("boutique", entry);
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void applyMembers([
                            ...(siblingIds.length ? siblingIds : [product.id]),
                            entry.id,
                          ])
                        }
                        className="flex min-h-14 w-full items-center gap-3 rounded-lg bg-white px-3 py-2 text-left"
                      >
                        {cover ? (
                          <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                            <Image
                              src={cover}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="36px"
                            />
                          </span>
                        ) : (
                          <span className="h-12 w-9 shrink-0 rounded-md bg-neutral-100" />
                        )}
                        <span className="min-w-0 flex-1 text-[14px] font-medium text-neutral-900">
                          {entry.title}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <button
              type="button"
              className={panelSecondaryBtnClass}
              onClick={() => setPickerOpen(false)}
            >
              Kapat
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={panelPrimaryBtnClass}
            onClick={() => setPickerOpen(true)}
          >
            Ürün bağla
          </button>
        )
      ) : null}

      {error ? (
        <p className="text-[13px] text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
