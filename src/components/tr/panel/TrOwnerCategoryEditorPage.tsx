"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TrCategoryEditor } from "@/components/tr/panel/TrCategoryEditor";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrPanelEditor } from "@/components/tr/panel/TrPanelEditor";
import {
  TrPanelFadeIn,
  TrPanelLoading,
} from "@/components/tr/panel/TrPanelMotion";
import { panelErrorClass } from "@/components/tr/panel/panelUi";
import type { TrCategory } from "@/lib/tr/categories/types";
import { fetchOwnerCategory } from "@/lib/tr/ownerClient";
import {
  trPanelCategoriesPath,
  trPanelEditCategoryPath,
} from "@/lib/tr/paths";

/**
 * Create (no `categoryId`) or edit a category in the editor layout. A boutique on
 * the built-in category tree sees an explanation instead of the form.
 */
export function TrOwnerCategoryEditorPage({
  categoryId,
}: {
  categoryId?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<{
    id: string;
    category: TrCategory | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    fetchOwnerCategory(categoryId)
      .then((category) => {
        if (!cancelled) setState({ id: categoryId, category, error: null });
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setState({
            id: categoryId,
            category: null,
            error:
              loadError instanceof Error
                ? loadError.message
                : "Kategori yüklenemedi.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const loaded = categoryId && state?.id === categoryId ? state : null;

  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <TrPanelEditor
            backHref={trPanelCategoriesPath()}
            parentLabel="Kategoriler"
            title={categoryId ? "Kategoriyi düzenle" : "Kategori ekle"}
            subject={loaded?.category?.name}
          >
            {categoryId && !loaded ? (
              <TrPanelLoading key="category-loading" label="Kategori yükleniyor…" />
            ) : loaded?.error ? (
              <p className={`${panelErrorClass} mt-4`}>{loaded.error}</p>
            ) : (
              <TrPanelFadeIn shift={false}>
                <TrCategoryEditor
                  key={loaded?.category?.id ?? "new"}
                  boutiqueId={activeBoutique.id}
                  boutiqueSlug={activeBoutique.slug}
                  customDomain={activeBoutique.customDomain}
                  category={loaded?.category ?? undefined}
                  onCreated={(created) =>
                    router.replace(trPanelEditCategoryPath(created.id))
                  }
                  onSaved={(saved) =>
                    setState({ id: saved.id, category: saved, error: null })
                  }
                  onDeleted={() => router.push(trPanelCategoriesPath())}
                />
              </TrPanelFadeIn>
            )}
          </TrPanelEditor>
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}
