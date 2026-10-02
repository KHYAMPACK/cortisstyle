import type { TrCategory } from "@/lib/tr/categories/types";
import { isTrCategoryMatch } from "@/lib/tr/fashion/categories";
import {
  BOTTOM_FIT_OPTIONS,
  BOTTOM_HEM_OPTIONS,
  BOTTOM_LENGTH_OPTIONS,
  BOTTOM_RISE_OPTIONS,
  DRESS_FEATURE_GROUPS,
  DRESS_LENGTH_OPTIONS,
  TOP_FIT_OPTIONS,
  TOP_LENGTH_OPTIONS,
  type DressFeatureOption,
} from "@/lib/tr/fashion/dressFeatures";
import { garmentCategoryFor } from "@/lib/tr/fashion/garmentCategory";
import { TR_PRODUCT_FEATURE_LABELS } from "@/lib/tr/catalog/productFeatures";
import type { TrKindTemplate } from "@/lib/tr/productKinds/types";

/**
 * The fashion starter kinds and fields: exactly what the fashion editor shows today
 * (`TrOwnerProductFeaturesFields`, `getConstructionFeatureGroups`), as data. Copied once
 * into a boutique's own rows ("Hazır türleri içe aktar", and at store creation); nothing
 * reads it at runtime. Values keep their `features` keys, so no product data moves.
 *
 * - Elbise / Üst giyim / Etek / Pantolon are the four field sets the editor builds (the
 *   "dress" chips per garment family; Etek and Pantolon differ by Paça and Boy).
 * - Takım, Aksesuar and Ev get the editor's plain field grid, minus fields that don't
 *   apply (Kalıp on accessories and home textiles). "Yaka / Paça detay" is the Paça
 *   field's key (`neckHem`), so it is only on Pantolon; old values stay on products.
 * - Kalıp and Kumaş take typed values too: products filled in before (by hand or by AI)
 *   carry wordings outside the chip lists ("Hafif dokuma", "Relaxed").
 */

const labels = (options: readonly DressFeatureOption[]): string[] =>
  options.map((option) => option.label);

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLocaleLowerCase("tr");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function group(key: string): string[] {
  return labels(DRESS_FEATURE_GROUPS.find((entry) => entry.key === key)?.options ?? []);
}

const GENDER = ["Kadın", "Erkek", "Unisex"];

export function fashionKindTemplate(): TrKindTemplate {
  const choice = (key: keyof typeof TR_PRODUCT_FEATURE_LABELS, options: string[], allowCustom = false) => ({
    key,
    label: TR_PRODUCT_FEATURE_LABELS[key],
    input: "choice" as const,
    options,
    allowCustom,
  });

  const attributes: TrKindTemplate["attributes"] = [
    choice("gender", GENDER),
    choice("neckline", group("neckline")),
    choice("sleeves", group("sleeves")),
    choice("fit", unique([...labels(TOP_FIT_OPTIONS), ...labels(BOTTOM_FIT_OPTIONS)]), true),
    choice(
      "length",
      unique([
        ...labels(DRESS_LENGTH_OPTIONS),
        ...labels(TOP_LENGTH_OPTIONS),
        ...labels(BOTTOM_LENGTH_OPTIONS),
      ]),
    ),
    choice("decollete", group("decollete")),
    choice("rise", labels(BOTTOM_RISE_OPTIONS)),
    { ...choice("neckHem", labels(BOTTOM_HEM_OPTIONS)), label: "Paça" },
    choice("fabric", group("fabric"), true),
    choice("zipper", group("zipper")),
    choice("stretch", group("stretch")),
    choice("silhouette", group("silhouette")),
    {
      key: "ornament",
      label: TR_PRODUCT_FEATURE_LABELS.ornament,
      input: "text",
      options: [],
      allowCustom: false,
    },
    { key: "color", label: TR_PRODUCT_FEATURE_LABELS.color, input: "text", options: [], allowCustom: false },
    {
      key: "composition",
      label: TR_PRODUCT_FEATURE_LABELS.composition,
      input: "textarea",
      options: [],
      allowCustom: false,
    },
  ];

  const field = (key: string, options: string[] | null = null) => ({ key, options });
  const tail = [field("color"), field("composition")];

  return {
    attributes,
    kinds: [
      {
        systemKey: "elbise",
        name: "Elbise",
        optionTypeNames: ["Beden"],
        suggestedCategoryKey: "elbise",
        attributes: [
          field("gender"),
          field("neckline"),
          field("sleeves"),
          field("length", labels(DRESS_LENGTH_OPTIONS)),
          field("decollete"),
          field("fabric"),
          field("zipper"),
          field("stretch"),
          field("silhouette"),
          ...tail,
        ],
      },
      {
        systemKey: "ust-giyim",
        name: "Üst giyim",
        optionTypeNames: ["Beden"],
        suggestedCategoryKey: "ust-giyim",
        attributes: [
          field("gender"),
          field("neckline"),
          field("sleeves"),
          field("fit", labels(TOP_FIT_OPTIONS)),
          field("length", labels(TOP_LENGTH_OPTIONS)),
          field("decollete"),
          field("fabric"),
          field("zipper"),
          field("stretch"),
          ...tail,
        ],
      },
      {
        systemKey: "etek",
        name: "Etek",
        optionTypeNames: ["Beden"],
        suggestedCategoryKey: "etek",
        attributes: [
          field("gender"),
          field("length", labels(DRESS_LENGTH_OPTIONS)),
          field("rise"),
          field("fit", labels(BOTTOM_FIT_OPTIONS)),
          field("fabric"),
          field("zipper"),
          field("stretch"),
          field("ornament"),
          ...tail,
        ],
      },
      {
        systemKey: "pantolon",
        name: "Pantolon",
        optionTypeNames: ["Pantolon bedeni"],
        suggestedCategoryKey: "pantolon",
        attributes: [
          field("gender"),
          field("length", labels(BOTTOM_LENGTH_OPTIONS)),
          field("rise"),
          field("fit", labels(BOTTOM_FIT_OPTIONS)),
          field("neckHem"),
          field("fabric"),
          field("zipper"),
          field("stretch"),
          field("ornament"),
          ...tail,
        ],
      },
      {
        systemKey: "takim",
        name: "Takım",
        optionTypeNames: ["Beden"],
        suggestedCategoryKey: "takim",
        attributes: [field("gender"), field("fit"), field("fabric"), ...tail],
      },
      {
        systemKey: "aksesuar",
        name: "Aksesuar",
        suggestedCategoryKey: "aksesuar",
        attributes: [field("gender"), field("fabric"), ...tail],
      },
      {
        systemKey: "ev",
        name: "Ev tekstili",
        suggestedCategoryKey: "ev",
        attributes: [field("fabric"), ...tail],
      },
    ],
  };
}

/**
 * The starter kind for a built-in garment id, the way the fashion editor tells garments
 * apart today: takım before üst giyim (it sits under it), etek before alt giyim.
 * `null` = no kind (an unknown id, or the legacy "Dış giyim").
 */
export function fashionKindKeyForGarment(garmentId: string | null): string | null {
  if (!garmentId) return null;
  if (isTrCategoryMatch(garmentId, "takim")) return "takim";
  if (isTrCategoryMatch(garmentId, "elbise")) return "elbise";
  if (isTrCategoryMatch(garmentId, "ust-giyim")) return "ust-giyim";
  if (isTrCategoryMatch(garmentId, "etek")) return "etek";
  if (isTrCategoryMatch(garmentId, "alt-giyim")) return "pantolon";
  if (isTrCategoryMatch(garmentId, "aksesuar")) return "aksesuar";
  if (isTrCategoryMatch(garmentId, "ev")) return "ev";
  return null;
}

/** A product's starter kind from its category slug, read through the boutique's system keys. */
export function fashionKindKeyForCategory(
  slug: string | null,
  categories: ReadonlyArray<Pick<TrCategory, "id" | "parentId" | "slug" | "systemKey">>,
): string | null {
  return fashionKindKeyForGarment(garmentCategoryFor(slug, categories));
}
