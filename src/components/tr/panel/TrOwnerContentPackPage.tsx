"use client";

import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  TrPanelFadeIn,
  TrPanelLoading,
} from "@/components/tr/panel/TrPanelMotion";
import { TR_CONTENT_PACK_ASPECTS } from "@/lib/tr/contentPacks/aspects";
import type { TrContentPack } from "@/lib/tr/contentPacks/types";
import {
  fetchOwnerContentPack,
  fetchOwnerProduct,
} from "@/lib/tr/ownerClient";
import {
  trPanelContentPath,
  trPanelEditProductPath,
  trPanelPath,
} from "@/lib/tr/paths";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function downloadImage(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function PackDetail({
  boutiqueId,
  packId,
}: {
  boutiqueId: string;
  packId: string;
}) {
  const [pack, setPack] = useState<TrContentPack | null>(null);
  const [productTitle, setProductTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"caption" | "link" | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const loaded = await fetchOwnerContentPack(packId);
        if (cancelled) return;
        if (loaded.boutiqueId !== boutiqueId) {
          setError("Bu paket seçili butiğe ait değil.");
          setPack(null);
          return;
        }
        setPack(loaded);
        try {
          const { product } = await fetchOwnerProduct(loaded.productId);
          if (!cancelled) setProductTitle(product.title);
        } catch {
          if (!cancelled) setProductTitle(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Paket yüklenemedi.",
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
  }, [boutiqueId, packId]);

  const onCopyCaption = async () => {
    if (!pack?.caption) return;
    const ok = await copyText(pack.caption);
    if (ok) {
      setCopied("caption");
      window.setTimeout(() => setCopied(null), 2000);
    }
  };

  const onCopyLink = async () => {
    if (!pack?.deepLink) return;
    const ok = await copyText(pack.deepLink);
    if (ok) {
      setCopied("link");
      window.setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <TrPanelLoading key="pack-loading" label="Paket yükleniyor…" />
      ) : (
        <TrPanelFadeIn key="pack-ready" className="space-y-8">
          {error ? (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
              {error}
            </p>
          ) : null}

          {!pack ? null : (
            <>
              <section className="space-y-2 border border-black/10 bg-white px-4 py-5">
                <p className="text-[11px] tracking-[0.12em] text-neutral-500 uppercase">
                  {pack.status === "ready"
                    ? "Hazır"
                    : pack.status === "failed"
                      ? "Başarısız"
                      : "Sırada"}
                  {pack.usedAiLifestyle ? " · AI model" : " · Katalog kesiti"}
                </p>
                <h3 className="font-serif text-xl text-neutral-900">
                  {productTitle ?? "Ürün paketi"}
                </h3>
                {productTitle ? (
                  <Link
                    href={trPanelEditProductPath(pack.productId)}
                    className="text-[12px] text-neutral-600 underline underline-offset-2"
                  >
                    Ürünü düzenle
                  </Link>
                ) : null}
                {pack.error ? (
                  <p className="text-[13px] text-red-700">{pack.error}</p>
                ) : null}
              </section>

              <section className="space-y-3">
                <h3 className="text-[12px] tracking-[0.14em] text-neutral-700 uppercase">
                  Format önizleme
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  {pack.formats.map((format) => {
                    const preset = TR_CONTENT_PACK_ASPECTS.find(
                      (entry) => entry.id === format.aspectId,
                    );
                    return (
                      <div
                        key={format.aspectId}
                        className="border border-black/10 bg-white p-3"
                      >
                        <p className="text-[10px] tracking-[0.1em] text-neutral-500 uppercase">
                          {preset?.label ?? format.aspectId}
                        </p>
                        <p className="mt-0.5 text-[11px] text-neutral-500">
                          {preset?.platformHint ?? ""} · {format.width}×
                          {format.height}
                        </p>
                        <div
                          className="relative mt-3 w-full overflow-hidden bg-neutral-100"
                          style={{ aspectRatio: format.aspectRatio }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={format.imageUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            downloadImage(
                              format.imageUrl,
                              `${format.aspectId}.jpg`,
                            )
                          }
                          className="mt-3 w-full border border-black/15 px-3 py-2 text-[11px] tracking-[0.08em] uppercase"
                        >
                          İndir
                        </button>
                      </div>
                    );
                  })}
                </div>
                {pack.formats.length === 0 ? (
                  <p className="border border-black/10 bg-white px-4 py-6 text-[13px] text-neutral-600">
                    Bu pakette indirme görseli yok.
                  </p>
                ) : null}
              </section>

              <section className="space-y-3 border border-black/10 bg-white px-4 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[12px] tracking-[0.14em] text-neutral-700 uppercase">
                    Caption
                  </h3>
                  <button
                    type="button"
                    onClick={() => void onCopyCaption()}
                    className="border border-black/15 px-3 py-2 text-[11px] tracking-[0.08em] uppercase"
                  >
                    {copied === "caption" ? "Kopyalandı" : "Kopyala"}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-neutral-800">
                  {pack.caption || "—"}
                </pre>
              </section>

              <section className="space-y-3 border border-black/10 bg-white px-4 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[12px] tracking-[0.14em] text-neutral-700 uppercase">
                    Satış linki
                  </h3>
                  <button
                    type="button"
                    onClick={() => void onCopyLink()}
                    className="border border-black/15 px-3 py-2 text-[11px] tracking-[0.08em] uppercase"
                  >
                    {copied === "link" ? "Kopyalandı" : "Kopyala"}
                  </button>
                </div>
                <a
                  href={pack.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-[13px] text-neutral-800 underline underline-offset-2"
                >
                  {pack.deepLink}
                </a>
                <p className="text-[12px] text-neutral-500">
                  Instagram’da paylaşırken bu linki bio veya caption’a ekleyin.
                  UTM’ler satış kaynağını takip eder.
                </p>
              </section>
            </>
          )}
        </TrPanelFadeIn>
      )}
    </AnimatePresence>
  );
}

export function TrOwnerContentPackPage({ packId }: { packId: string }) {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-4">
          <div>
            <Link
              href={trPanelContentPath()}
              className="text-[12px] tracking-[0.08em] text-neutral-500 uppercase hover:text-neutral-800"
            >
              ← İçerik
            </Link>
            <h2 className="mt-2 font-serif text-2xl text-neutral-900">
              Paket detayı
            </h2>
            <p className="mt-1 text-[13px] text-neutral-600">
              Görselleri indir, caption’ı kopyala, Instagram’da paylaş.
            </p>
            <Link
              href={trPanelPath()}
              className="mt-2 inline-block text-[11px] text-neutral-500 hover:underline"
            >
              Ana sayfa
            </Link>
          </div>
          <PackDetail boutiqueId={activeBoutique.id} packId={packId} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
