"use client";

import Image from "next/image";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrProductImageLightbox } from "@/components/tr/panel/TrProductImageLightbox";
import {
  panelBackLinkClass,
  panelEmptyClass,
  panelErrorClass,
  panelHintClass,
  panelPageTitleClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelListSkeleton,
} from "@/components/tr/panel/TrPanelMotion";
import {
  fetchOwnerProductOriginals,
  type TrOwnerProductOriginals,
} from "@/lib/tr/ownerClient";
import {
  getProductPhotoRole,
  productPhotoRoleLabel,
} from "@/lib/tr/ownerProductConstraints";
import {
  trPanelEditProductPath,
  trPanelPath,
  trPanelSettingsPath,
} from "@/lib/tr/paths";

function originalSlotLabel(index: number): string {
  const role = getProductPhotoRole(index);
  if (role === "extra") return `Ek ${index - 1}`;
  return productPhotoRoleLabel(role);
}

export function TrOwnerOriginalsPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique, isStaff }) =>
        isStaff ? (
          <OriginalsBrowser
            boutiqueId={activeBoutique.id}
            boutiqueName={activeBoutique.name}
          />
        ) : (
          <TrPanelFadeIn className="space-y-4">
            <Link href={trPanelPath()} className={panelBackLinkClass}>
              ← Giriş
            </Link>
            <p className={panelEmptyClass}>Sayfa bulunamadı.</p>
          </TrPanelFadeIn>
        )
      }
    </TrOwnerPanelGate>
  );
}

function OriginalsBrowser({
  boutiqueId,
  boutiqueName,
}: {
  boutiqueId: string;
  boutiqueName: string;
}) {
  const [products, setProducts] = useState<TrOwnerProductOriginals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{
    src: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchOwnerProductOriginals(boutiqueId);
        if (!cancelled) setProducts(list);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Orijinal fotoğraflar yüklenemedi.",
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

  const withOriginals = products.filter((product) => product.images.length > 0);

  return (
    <TrPanelFadeIn className="space-y-6">
      <div>
        <Link href={trPanelSettingsPath()} className={panelBackLinkClass}>
          ← Ayarlar
        </Link>
        <h2 className={panelPageTitleClass}>Orijinal fotoğraflar</h2>
        <p className={`mt-2 ${panelHintClass}`}>
          {boutiqueName} — yüklenen ham kareler (packshot değil). Butik
          değiştirmek için panel üstündeki butik seçiciyi kullanın.
        </p>
      </div>

      {loading ? (
        <TrPanelListSkeleton rows={4} label="Orijinaller yükleniyor" />
      ) : error ? (
        <p className={panelErrorClass}>{error}</p>
      ) : withOriginals.length === 0 ? (
        <p className={panelEmptyClass}>Bu butikte orijinal yükleme yok.</p>
      ) : (
        <div className="space-y-4">
          {withOriginals.map((product) => (
            <section key={product.id} className={panelSectionClass}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="min-w-0 truncate text-[16px] font-semibold text-neutral-900">
                  {product.title}
                </h3>
                <Link
                  href={trPanelEditProductPath(product.id)}
                  className="shrink-0 text-[13px] font-medium text-neutral-500 hover:text-neutral-800"
                >
                  Düzenle
                </Link>
              </div>

              <ul className="flex flex-wrap gap-3">
                {product.images.map((src, index) => {
                  const label = originalSlotLabel(index);
                  return (
                    <li key={`${product.id}-orig-${index}`} className="w-[7.5rem]">
                      <button
                        type="button"
                        aria-label={`${product.title}, ${label}`}
                        onClick={() => setLightbox({ src, label: `${product.title} · ${label}` })}
                        className="relative block h-28 w-full min-h-11 overflow-hidden rounded-lg bg-neutral-100"
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          unoptimized
                          className="object-contain p-1.5"
                          sizes="120px"
                        />
                      </button>
                      <div className="mt-1.5 flex items-center justify-between gap-1">
                        <span className="truncate text-[11px] text-neutral-500">
                          {label}
                        </span>
                        <a
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-[11px] font-medium text-neutral-400 hover:text-neutral-700"
                        >
                          Yeni sekmede aç
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {product.marketplaceImages.length > 0 ? (
                <div className="border-t border-neutral-100 pt-3">
                  <p className="mb-2 text-[11px] tracking-wide text-neutral-400 uppercase">
                    Katalog
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {product.marketplaceImages.map((src, index) => (
                      <li key={`${product.id}-mkt-${index}`}>
                        <button
                          type="button"
                          onClick={() =>
                            setLightbox({
                              src,
                              label: `${product.title} · Katalog ${index + 1}`,
                            })
                          }
                          className="relative block h-16 w-14 overflow-hidden rounded-md bg-neutral-50 opacity-70 hover:opacity-100"
                        >
                          <Image
                            src={src}
                            alt=""
                            fill
                            unoptimized
                            className="object-contain p-1"
                            sizes="56px"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}

      <TrProductImageLightbox
        open={Boolean(lightbox)}
        src={lightbox?.src ?? null}
        label={lightbox?.label ?? null}
        onClose={() => setLightbox(null)}
      />
    </TrPanelFadeIn>
  );
}
