/**
 * Owner-facing Cortisstyle credit pricing.
 *
 * - Ürün (ön + arka packshot): 1 kredi
 * - Model: 1 kredi per generated shot (generic = 1; elbise = 2, or 3 with detay photo)
 * - 1 kredi = $0.25 → TRY via tryPerUsd
 */

import { elbiseModelShotCount } from "@/lib/tr/aiModel/elbiseTryOn";
import type { ElbiseConstructionChips } from "@/lib/tr/fashion/aiCatalog/elbiseConstructionLock";
import { constructionCatalogFamily, isConstructionCatalogUpload } from "@/lib/tr/catalog/garmentUploadTypes";

export const TR_AI_CATALOG_CREDITS = {
  /** Front + back packshot together */
  productPackage: 1,
  /** Single front model try-on package */
  modelPackage: 1,
  /** How many lifestyle shots the model package produces */
  modelPackageShots: 1,
  /** List price per credit in USD */
  priceUsdPerCredit: 0.25,
  /** Approx TRY per USD for display */
  tryPerUsd: 47.5,
} as const;

/** Boutique-facing credits per logged usage kind (not raw FASHN units). */
export function boutiqueCreditsForUsageKind(
  kind: "packshot" | "tryon" | "bg_removal",
): number {
  if (kind === "packshot") {
    // Ön + arka together = 1 product package → 0.5 each event
    return TR_AI_CATALOG_CREDITS.productPackage / 2;
  }
  if (kind === "tryon") {
    return TR_AI_CATALOG_CREDITS.modelPackage;
  }
  return 0;
}

/** TRY list price per credit (rounded for display). */
export function priceTryPerCredit(): number {
  return Math.round(
    TR_AI_CATALOG_CREDITS.priceUsdPerCredit * TR_AI_CATALOG_CREDITS.tryPerUsd,
  );
}

export function creditsToUsd(credits: number): number {
  return credits * TR_AI_CATALOG_CREDITS.priceUsdPerCredit;
}

export function creditsToTry(credits: number): number {
  return credits * priceTryPerCredit();
}

export function formatCreditPriceTry(credits: number): string {
  return `${creditsToTry(credits).toLocaleString("tr-TR")} ₺`;
}

export function formatCreditPriceUsd(credits: number): string {
  const usd = creditsToUsd(credits);
  if (usd < 1) return `~$${usd.toFixed(2)}`;
  return `~$${usd.toFixed(2)}`;
}

export function formatCreditPriceBoth(credits: number): string {
  return `${formatCreditPriceTry(credits)} (${formatCreditPriceUsd(credits)})`;
}

const exampleFullCredits =
  TR_AI_CATALOG_CREDITS.productPackage + TR_AI_CATALOG_CREDITS.modelPackage;

export const TR_AI_CREDITS_INFO_LINES = [
  `Ürün katalog paketi (ön + arka): ${TR_AI_CATALOG_CREDITS.productPackage} kredi → ${formatCreditPriceBoth(TR_AI_CATALOG_CREDITS.productPackage)}`,
  `Model fotoğrafı (isteğe bağlı): ${TR_AI_CATALOG_CREDITS.modelPackage} kredi / kare. Elbise / üst giyim 2 kare (detay fotoğrafı varsa 3). Takım: 2 packshot + 2 birlikte giydirme karesi.`,
  `Örnek: katalog + 1 model karesi = ${exampleFullCredits} kredi → ${formatCreditPriceBoth(exampleFullCredits)}`,
  `1 kredi = $${TR_AI_CATALOG_CREDITS.priceUsdPerCredit.toFixed(2)} (~${priceTryPerCredit()} ₺)`,
  "Ödeme: krediler butik hesabınızdan düşülür.",
  "Tahsilat: aylık paket veya dönem sonu fatura.",
  "Bakiye yetersizse işlem yapılmaz.",
] as const;

export function describePhotoSlotCost(
  slotIndex: number,
  uploadType?: string | null,
  options?: { deferPackshot?: boolean },
): {
  title: string;
  subtitle: string;
  bullets: string[];
  credits: number | null;
  costPrefix: string;
} {
  if (isConstructionCatalogUpload(uploadType) || options?.deferPackshot) {
    if (slotIndex === 0) {
      return {
        title: "Ön manken",
        subtitle: "Önden tam boy manken fotoğrafı.",
        bullets: [
          "Olduğu gibi kaydedilir — packshot sonra üretilir.",
          "Kişi kesilmez.",
        ],
        credits: null,
        costPrefix: "",
      };
    }
    if (slotIndex === 1) {
      return {
        title: "Arka manken",
        subtitle: "Arkadan tam boy manken fotoğrafı.",
        bullets: options?.deferPackshot
          ? [
              "Askı, sırt detay ve etek / paça arkası görünsün.",
              "Özellikler sonraki adımda onaylanır; sonra 1 ön packshot (1 kredi).",
            ]
          : [
              "Askı, sırt detay ve etek / paça arkası görünsün.",
              constructionCatalogFamily(uploadType) === "elbise"
                ? "Ön ve arka tamamınca 1 ön packshot üretilir (beyaz zemin, ghost mannequin)."
                : "Ön ve arka tamamınca 1 ön packshot üretilir (beyaz zemin, düz serim).",
              "Ürün paketi: 1 kredi.",
            ],
        credits: options?.deferPackshot
          ? null
          : TR_AI_CATALOG_CREDITS.productPackage,
        costPrefix: options?.deferPackshot ? "" : "Ön packshot",
      };
    }
    if (slotIndex === 2) {
      return {
        title: "Dekolte / detay (isteğe bağlı)",
        subtitle: "Yaka, dekolte veya dantel gibi yakın çekim.",
        bullets: [
          "Packshot için gerekli değil — atlayabilirsiniz.",
          "Sonradan da ekleyebilirsiniz.",
        ],
        credits: null,
        costPrefix: "",
      };
    }
  }
  if (slotIndex === 0) {
    return {
      title: "Ön yüz katalog görseli",
      subtitle:
        "Bu ham fotoğraf değil — onayda satışa hazır katalog görseli (packshot) oluşturulur.",
      bullets: [
        "Kaynak olarak seçtiğiniz kare kullanılır.",
        "Ön + arka birlikte 1 kredi (ürün paketi).",
        "Sonuç: temiz, vitrin tipi ürün görseli.",
      ],
      credits: TR_AI_CATALOG_CREDITS.productPackage,
      costPrefix: "Ürün paketi",
    };
  }

  if (slotIndex === 1) {
    return {
      title: "Arka yüz katalog görseli",
      subtitle:
        "Bu ham fotoğraf değil — onayda satışa hazır katalog görseli (packshot) oluşturulur.",
      bullets: [
        "Kaynak olarak seçtiğiniz kare kullanılır.",
        "Ön ile aynı ürün paketine dahil — ekstra kredi yok.",
      ],
      credits: null,
      costPrefix: "",
    };
  }

  return {
    title: "Ek fotoğraf",
    subtitle: "Onaylarsanız galeriye olduğu gibi eklenir.",
    bullets: ["Katalog dönüşümü uygulanmaz."],
    credits: null,
    costPrefix: "",
  };
}

export type ModelPackageCostContext = {
  uploadType?: string | null;
  features?: ElbiseConstructionChips | null;
  detailImageUrl?: string | null;
};

/** Credits for the model package (1 kredi per shot; elbise is 2 or 3). */
export function describeModelPackageCredits(
  modelId?: string | null,
  context?: ModelPackageCostContext,
): number {
  return (
    describeModelPackageShots(modelId, context) *
    TR_AI_CATALOG_CREDITS.modelPackage
  );
}

/** How many lifestyle shots this model run produces. */
export function describeModelPackageShots(
  _modelId?: string | null,
  context?: ModelPackageCostContext,
): number {
  if (isConstructionCatalogUpload(context?.uploadType)) {
    return elbiseModelShotCount(
      context?.features,
      _modelId,
      context?.detailImageUrl,
      constructionCatalogFamily(context?.uploadType),
    );
  }
  return TR_AI_CATALOG_CREDITS.modelPackageShots;
}

/** @deprecated Use describeModelPackageCredits */
export function describeEnhanceCredits(_modelShots?: number): number {
  return describeModelPackageCredits();
}
