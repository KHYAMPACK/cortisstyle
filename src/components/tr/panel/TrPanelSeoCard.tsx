"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { TrPanelInfoTip } from "@/components/tr/panel/TrPanelEditor";
import {
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
} from "@/components/tr/panel/panelUi";
import {
  normalizeCanonicalInput,
  SEO_LIMITS,
} from "@/lib/tr/seo/seoFields";
import { sanitizeSlugInput, SLUG_MAX_LENGTH } from "@/lib/tr/seo/slug";

/** What the SEO card edits, as the owner typed it. */
export interface TrSeoFormValue {
  slug: string;
  title: string;
  description: string;
  noindex: boolean;
  /** The part after the fixed "/" (so "urun/keten-gomlek"). */
  canonical: string;
}

export const EMPTY_SEO_FORM: TrSeoFormValue = {
  slug: "",
  title: "",
  description: "",
  noindex: false,
  canonical: "",
};

/**
 * The SEO card every editor shares (products now, categories and pages next):
 * slug, search title and description, "do not index" and a canonical path, with a
 * live search-result preview beside it. The page passes what it needs to preview
 * (its name, fallback description, where its slug lives) and owns the state.
 */
export function TrPanelSeoCard({
  id,
  value,
  onChange,
  entityName,
  fallbackDescription = "",
  urlPrefix,
  suggestedSlug = "",
}: {
  /** DOM id, so a tab can jump to the card. */
  id: string;
  value: TrSeoFormValue;
  onChange: (patch: Partial<TrSeoFormValue>) => void;
  /** Shown as the title in the preview until a search title is set. */
  entityName: string;
  fallbackDescription?: string;
  /** Where the slug lives, e.g. "lilaboutiquedenizli.com/urun/" (`storeProductUrlPrefix`). */
  urlPrefix: string;
  /** The slug the server picks when the field is left empty (a new product). */
  suggestedSlug?: string;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(
    value.noindex || value.canonical !== "",
  );

  const slashAt = urlPrefix.indexOf("/");
  const host = slashAt === -1 ? urlPrefix : urlPrefix.slice(0, slashAt);
  const pathPrefix = slashAt === -1 ? "/" : urlPrefix.slice(slashAt);

  const slugForPreview = value.slug || suggestedSlug;
  const previewTitle = value.title.trim() || entityName.trim();
  const previewDescription =
    value.description.trim() || fallbackDescription.trim();
  const hasPreview = previewTitle !== "";
  const previewCrumbs = [
    host,
    ...`${pathPrefix}${slugForPreview}`.split("/").filter(Boolean),
  ].join(" › ");

  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="scroll-mt-32 overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
    >
      <div className="grid lg:grid-cols-2">
        <div className="min-w-0">
          <header className="flex items-center gap-2 border-b border-neutral-200/80 px-4 py-3.5 sm:px-6 sm:py-4">
            <h2
              id={titleId}
              className="text-[16px] font-semibold text-neutral-900 sm:text-[17px]"
            >
              Arama Motoru Optimizasyonu (SEO)
            </h2>
            <TrPanelInfoTip text="Sayfanın adresi ve arama sonuçlarında nasıl görüneceği." />
          </header>

          <div className="space-y-5 p-4 sm:p-6">
            <label className="block space-y-2">
              <span className={panelLabelClass}>Slug</span>
              <span className="flex overflow-hidden rounded-lg border border-neutral-200 bg-white focus-within:border-[color:var(--panel-accent)]">
                <span className="flex max-w-[55%] shrink-0 items-center truncate border-r border-neutral-200 bg-neutral-50 px-3 text-[13px] text-neutral-500">
                  {pathPrefix}
                </span>
                <input
                  value={value.slug}
                  onChange={(event) =>
                    onChange({ slug: sanitizeSlugInput(event.target.value) })
                  }
                  onBlur={() =>
                    onChange({ slug: value.slug.replace(/-+$/, "") })
                  }
                  placeholder={suggestedSlug}
                  maxLength={SLUG_MAX_LENGTH}
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[16px] text-neutral-900 outline-none placeholder:text-neutral-400 lg:py-2.5 lg:text-[13px]"
                />
                <span className="flex items-center pr-3 text-[12px] text-neutral-400 tabular-nums">
                  {value.slug.length}/{SLUG_MAX_LENGTH}
                </span>
              </span>
              <span className={`block ${panelHintClass}`}>
                Boş bırakırsanız ürün adından oluşturulur. Adresi değiştirirseniz
                eski adres yenisine yönlenir.
              </span>
            </label>

            <label className="block space-y-2">
              <span className={panelLabelClass}>Sayfa Başlığı</span>
              <span className="relative block">
                <input
                  value={value.title}
                  onChange={(event) =>
                    onChange({
                      title: event.target.value.slice(0, SEO_LIMITS.title),
                    })
                  }
                  placeholder={entityName}
                  className={`${panelFieldClass} pr-16`}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-neutral-400 tabular-nums">
                  {value.title.length}/{SEO_LIMITS.title}
                </span>
              </span>
            </label>

            <label className="block space-y-2">
              <span className={panelLabelClass}>Açıklama</span>
              <textarea
                value={value.description}
                onChange={(event) =>
                  onChange({
                    description: event.target.value.slice(
                      0,
                      SEO_LIMITS.description,
                    ),
                  })
                }
                rows={3}
                className={panelFieldClass}
              />
              <span className={`block text-right ${panelHintClass}`}>
                {value.description.length}/{SEO_LIMITS.description}
              </span>
            </label>
          </div>

          <div className="border-t border-neutral-200/80">
            <button
              type="button"
              onClick={() => setAdvancedOpen((open) => !open)}
              aria-expanded={advancedOpen}
              className="flex w-full items-center gap-1.5 px-4 py-4 text-left text-[13px] font-semibold text-[color:var(--panel-accent-deep)] sm:px-6"
            >
              Gelişmiş SEO Ayarları
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${
                  advancedOpen ? "rotate-180" : ""
                }`}
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
            {advancedOpen ? (
              <div className="space-y-5 border-t border-neutral-200/80 p-4 sm:p-6">
                <label className="flex items-start gap-3 text-[14px] text-neutral-800">
                  <input
                    type="checkbox"
                    checked={value.noindex}
                    onChange={(event) =>
                      onChange({ noindex: event.target.checked })
                    }
                    className="mt-0.5 h-4 w-4 accent-[color:var(--panel-accent)]"
                  />
                  Bu sayfayı arama motorlarının taramasını engelle.
                </label>

                <label className="block space-y-2">
                  <span className={panelLabelClass}>Canonical URL</span>
                  <span className="flex overflow-hidden rounded-lg border border-neutral-200 bg-white focus-within:border-[color:var(--panel-accent)]">
                    <span className="flex shrink-0 items-center border-r border-neutral-200 bg-neutral-50 px-3 text-[13px] text-neutral-500">
                      /
                    </span>
                    <input
                      value={value.canonical}
                      onChange={(event) =>
                        onChange({
                          canonical: normalizeCanonicalInput(event.target.value),
                        })
                      }
                      placeholder="urun/ornek-adres"
                      className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[16px] text-neutral-900 outline-none placeholder:text-neutral-400 lg:py-2.5 lg:text-[13px]"
                    />
                  </span>
                  <span className={`block ${panelHintClass}`}>
                    Boş bırakırsanız sayfanın kendi adresi kullanılır.
                  </span>
                </label>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-neutral-200/80 lg:border-t-0 lg:border-l">
          <header className="border-b border-neutral-200/80 px-4 py-3.5 sm:px-6 sm:py-4">
            <h3 className="text-[16px] font-semibold text-neutral-900 sm:text-[17px]">
              Önizleme
            </h3>
          </header>
          <div className="p-4 sm:p-6">
            {hasPreview ? (
              <div className="min-w-0 rounded-lg border border-neutral-200 p-4">
                <p className="truncate text-[12px] text-neutral-600">
                  {previewCrumbs}
                </p>
                <p className="mt-1 text-[18px] leading-snug text-[#1a0dab]">
                  {previewTitle}
                </p>
                {previewDescription ? (
                  <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-neutral-600">
                    {previewDescription}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-[15px] font-semibold text-neutral-900">
                  Henüz önizlemeniz görünmüyor
                </p>
                <p className={`mt-1 ${panelHintClass}`}>
                  Önizleme için bilgi girmeniz gerekmektedir.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
