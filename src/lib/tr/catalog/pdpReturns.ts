import { isMidiJeanElbiseProduct } from "@/lib/tr/catalog/midiJeanTwins";
import { boutiqueHasLiveShipping } from "@/lib/tr/shipping/registry";
import { trBoutiqueLegalPath } from "@/lib/tr/paths";
import {
  FLAT_SHIPPING_FEE_KURUS,
  FREE_SHIPPING_MIN_ITEMS,
  FREE_SHIPPING_PROMO_COPY,
} from "@/lib/tr/shipping/types";

export type TrPdpPolicyRun = {
  text: string;
  strong?: boolean;
};

export type TrPdpDeliverySummary = {
  paragraphs: TrPdpPolicyRun[][];
  legalHref: string | null;
};

function tryLabel(kurus: number): string {
  return `${Math.round(kurus / 100)} TL`;
}

function strong(text: string): TrPdpPolicyRun {
  return { text, strong: true };
}

function paragraph(
  ...runs: Array<string | TrPdpPolicyRun>
): TrPdpPolicyRun[] {
  return runs.map((run) => (typeof run === "string" ? { text: run } : run));
}

/** Homepage atelier info-strip kargo body — code-owned so DB JSON cannot drift. */
export function liveShippingHomeBody(): string {
  return `${FREE_SHIPPING_PROMO_COPY}. Tek üründe ${tryLabel(FLAT_SHIPPING_FEE_KURUS)}. Türkiye geneline gönderim.`;
}

/**
 * PDP “Teslimat ve İade” copy.
 * Live shipping (Lila) matches `quoteCheckoutShippingFee`. No carrier names.
 */
export function getPdpDeliverySummary(
  boutiqueSlug?: string | null,
  boutiqueName?: string | null,
  product?: {
    title?: string | null;
    features?: { color?: string | null };
    colors?: Array<{ name?: string | null }>;
  },
): TrPdpDeliverySummary {
  const legalHref = boutiqueSlug
    ? trBoutiqueLegalPath(boutiqueSlug, "iade")
    : null;
  const brand = boutiqueName?.trim() || "Mağazamız";

  if (!boutiqueSlug || !boutiqueHasLiveShipping(boutiqueSlug)) {
    return {
      legalHref,
      paragraphs: [
        paragraph(
          "Sipariş sonrası kargo bilgisi paylaşılır. Türkiye geneline gönderim yapılır.",
        ),
        paragraph(
          "Teslimden itibaren ",
          strong("14 gün"),
          " içinde cayma hakkınızı kullanabilirsiniz. WhatsApp’tan sipariş numaranızla yazmanız yeterlidir. Cayma kapsamındaki iade kargo ücreti bize aittir; yeniden stoklama ücreti alınmaz.",
        ),
        paragraph(
          "Beden veya model değişimi için WhatsApp’tan yazın. Talepler ",
          strong("stok durumuna göre"),
          " değerlendirilir.",
        ),
      ],
    };
  }

  const soloFree = Boolean(product && isMidiJeanElbiseProduct(product));

  return {
    legalHref,
    paragraphs: [
      soloFree
        ? paragraph(
            "Bu elbisede kargo ",
            strong("ücretsiz"),
            ". Tek parça yeter.",
          )
        : paragraph(
            `${brand} üzerinden verilen siparişlerde kargo ücreti `,
            strong(tryLabel(FLAT_SHIPPING_FEE_KURUS)),
            "’dir. ",
            strong(`${FREE_SHIPPING_MIN_ITEMS} ürün`),
            " ve üzeri alışverişlerde kargo ücretsizdir.",
          ),
      paragraph(
        "Siparişler ödeme onayından sonra ",
        strong("1–5 iş günü"),
        " içerisinde kargo firmasına teslim edilir. Türkiye geneline gönderim yapılır.",
      ),
      paragraph(
        "Teslimden itibaren ",
        strong("14 gün"),
        " içinde cayma hakkınızı kullanabilirsiniz. WhatsApp’tan sipariş numaranızla yazmanız yeterlidir. Cayma kapsamındaki iade kargo ücreti bize aittir; yeniden stoklama ücreti alınmaz. Ürünü kullanılmamış ve orijinal ambalajında gönderin.",
      ),
      paragraph(
        "Beden veya model değişimi için WhatsApp’tan yazın. Talepler ",
        strong("stok durumuna göre"),
        " değerlendirilir.",
      ),
    ],
  };
}
