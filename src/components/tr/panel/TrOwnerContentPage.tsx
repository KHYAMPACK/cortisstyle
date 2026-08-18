"use client";

import Link from "next/link";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrPanelFadeIn } from "@/components/tr/panel/TrPanelMotion";
import { trPanelPath } from "@/lib/tr/paths";

const UPCOMING_FEATURES = [
  {
    title: "Üründen Instagram paketi",
    body: "Katalogdaki bir ürünü seçince hazır görseller, caption ve satış linki tek pakette çıkar.",
  },
  {
    title: "AI model / yaşam stili görselleri",
    body: "Düz ürün fotoğrafından giyilmiş, paylaşmaya hazır stiller üretilir (kesit varsa).",
  },
  {
    title: "Feed, story ve reel boyutları",
    body: "1:1, 4:5 ve 9:16 önizlemeler — indirdiğin görselleri doğrudan Instagram’a koyarsın.",
  },
  {
    title: "Hazır caption + satış linki",
    body: "Türkçe metin, hashtag’ler ve ürün sayfana giden UTM’li link; kopyala, paylaş, satışa yönlendir.",
  },
] as const;

export function TrOwnerContentPage() {
  return (
    <TrOwnerPanelGate>
      {() => (
        <TrPanelFadeIn className="space-y-6">
          <div>
            <Link
              href={trPanelPath()}
              className="inline-block text-[11px] tracking-[0.1em] text-neutral-500 uppercase"
            >
              ← Giriş
            </Link>
            <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950">
              İçerik
            </h2>
            <p className="mt-1 max-w-xl text-[13px] text-neutral-600">
              Instagram’da daha çok satmak için ürünlerinden hazır paylaşım
              paketleri — yakında panelde.
            </p>
          </div>

          <div className="border border-black/10 bg-white px-5 py-8">
            <p className="text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
              Yakında
            </p>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-neutral-700">
              Bu bölüm açıldığında butiğin ürünlerinden Instagram’a hazır içerik
              üretebileceksin. Fotoğraf çekimi veya ajans beklemeden, katalogdaki
              parçaları paylaşıp satış linkine yönlendireceksin.
            </p>
          </div>

          <section className="space-y-3">
            <h3 className="text-[12px] tracking-[0.14em] text-neutral-700 uppercase">
              Açılınca neler olacak
            </h3>
            <ul className="divide-y divide-black/10 border border-black/10 bg-white">
              {UPCOMING_FEATURES.map((feature) => (
                <li key={feature.title} className="px-4 py-4">
                  <p className="text-[14px] text-neutral-900">{feature.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
                    {feature.body}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-[12px] text-neutral-500">
            Reels videosu, otomatik paylaşım ve reklam paneli bu ilk sürümde yok —
            önce stiller + caption + link ile satış döngüsünü kuruyoruz.
          </p>
        </TrPanelFadeIn>
      )}
    </TrOwnerPanelGate>
  );
}
