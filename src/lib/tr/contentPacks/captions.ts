import type { TrContentPackCaptionInput } from "@/lib/tr/contentPacks/types";

type CaptionTemplate = {
  /** Match against normalized category substring; empty = default. */
  categoryHints: string[];
  body: string;
  hashtags: string[];
};

const TEMPLATES: CaptionTemplate[] = [
  {
    categoryHints: ["elbise", "dress"],
    body: `{{title}} — {{boutique}}

{{price}}

Mağazada dene, tek tıkla sipariş ver.
{{link}}`,
    hashtags: ["#elbise", "#butik", "#modaturkiye", "#alışveriş"],
  },
  {
    categoryHints: ["üst", "bluz", "gömlek", "top", "tişört"],
    body: `Yeni üst: {{title}}

{{boutique}} · {{price}}

Linkten bak → {{link}}`,
    hashtags: ["#üstgiyim", "#butik", "#stil", "#günlükstil"],
  },
  {
    categoryHints: ["alt", "pantolon", "etek", "jean"],
    body: `{{title}}

{{boutique}} koleksiyonunda · {{price}}

Alışveriş: {{link}}`,
    hashtags: ["#altgiyim", "#butik", "#modaturkiye"],
  },
  {
    categoryHints: ["ayakkabı", "çanta", "aksesuar", "shoe", "bag"],
    body: `Detay parçası: {{title}}

{{boutique}} · {{price}}

{{link}}`,
    hashtags: ["#aksesuar", "#butik", "#stil"],
  },
  {
    categoryHints: [],
    body: `{{title}}

{{boutique}} · {{price}}

Satın al: {{link}}`,
    hashtags: ["#butik", "#modaturkiye", "#alışveriş", "#stil"],
  },
];

function normalizeCategory(category: string | null | undefined): string {
  return (category ?? "").trim().toLowerCase();
}

function pickTemplate(category: string | null | undefined): CaptionTemplate {
  const normalized = normalizeCategory(category);
  if (!normalized) {
    return TEMPLATES[TEMPLATES.length - 1]!;
  }
  for (const template of TEMPLATES) {
    if (template.categoryHints.length === 0) continue;
    if (
      template.categoryHints.some(
        (hint) => normalized.includes(hint) || hint.includes(normalized),
      )
    ) {
      return template;
    }
  }
  return TEMPLATES[TEMPLATES.length - 1]!;
}

function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return values[key] ?? "";
  });
}

/** Turkish Instagram caption + hashtags for a product content pack. */
export function buildContentPackCaption(
  input: TrContentPackCaptionInput,
): string {
  const template = pickTemplate(input.category);
  const body = fillTemplate(template.body, {
    title: input.title.trim(),
    boutique: input.boutiqueName.trim(),
    price: input.priceLabel.trim(),
    link: input.deepLink.trim(),
  }).trim();

  const tags = template.hashtags.join(" ");
  return `${body}\n\n${tags}`.trim();
}
