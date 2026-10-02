import { isTrCategoryMatch } from "@/lib/tr/fashion/categories";
import type { ConstructionCatalogFamily } from "@/lib/tr/fashion/types";

/** Pantolon / eşofman have a Paça; etek doesn't (an unknown bottom has one). */
function altGiyimUsesPaca(category: string | null | undefined): boolean {
  return !isTrCategoryMatch(category, "etek");
}

/** Structured elbise / üst giyim PDP chips: option ids, stored as Turkish labels. */

export type DressFeatureKey =
  | "neckline"
  | "sleeves"
  | "fit"
  | "length"
  | "decollete"
  | "rise"
  | "hem"
  | "fabric"
  | "zipper"
  | "stretch"
  | "silhouette"
  | "color"
  | "composition"
  | "gender";

export interface DressFeatureOption {
  id: string;
  label: string;
}

export interface DressFeatureGroup {
  key: DressFeatureKey;
  label: string;
  options: DressFeatureOption[];
  /** Owner can leave it empty. */
  optional?: boolean;
}

export const DRESS_LENGTH_OPTIONS: DressFeatureOption[] = [
  { id: "mikro", label: "Mikro" },
  { id: "mini", label: "Mini" },
  { id: "diz-ustu", label: "Diz üstü" },
  { id: "diz-boyu", label: "Diz boyu" },
  { id: "midi", label: "Midi" },
  { id: "maxi", label: "Maxi" },
  { id: "asimetrik", label: "Asimetrik" },
];

/** Same `features.length` key — tops never show midi/maxi. */
export const TOP_LENGTH_OPTIONS: DressFeatureOption[] = [
  { id: "crop", label: "Crop" },
  { id: "normal", label: "Normal" },
  { id: "uzun", label: "Uzun" },
  { id: "tunik", label: "Tunik boy" },
];

/** Same `features.fit` key generic uploads already use. Tops only. */
export const TOP_FIT_OPTIONS: DressFeatureOption[] = [
  { id: "slim", label: "Slim" },
  { id: "regular", label: "Regular" },
  { id: "rahat", label: "Rahat" },
  { id: "oversize", label: "Oversize" },
];

const TOP_FIT_GROUP: DressFeatureGroup = {
  key: "fit",
  label: "Kalıp",
  options: TOP_FIT_OPTIONS,
};

/** Same `features.length` key — pants never show midi/maxi. */
export const BOTTOM_LENGTH_OPTIONS: DressFeatureOption[] = [
  { id: "kisa", label: "Kısa" },
  { id: "normal", label: "Normal" },
  { id: "uzun", label: "Uzun" },
];

/** Same `features.fit` key. Bottoms use Wide instead of Oversize. */
export const BOTTOM_FIT_OPTIONS: DressFeatureOption[] = [
  { id: "slim", label: "Slim" },
  { id: "regular", label: "Regular" },
  { id: "rahat", label: "Rahat" },
  { id: "wide", label: "Wide" },
];

const BOTTOM_FIT_GROUP: DressFeatureGroup = {
  key: "fit",
  label: "Kalıp",
  options: BOTTOM_FIT_OPTIONS,
};

export const BOTTOM_RISE_OPTIONS: DressFeatureOption[] = [
  { id: "yuksek", label: "Yüksek bel" },
  { id: "normal", label: "Normal bel" },
  { id: "dusuk", label: "Düşük bel" },
];

const BOTTOM_RISE_GROUP: DressFeatureGroup = {
  key: "rise",
  label: "Bel",
  options: BOTTOM_RISE_OPTIONS,
};

/** Stored on `features.neckHem`. */
export const BOTTOM_HEM_OPTIONS: DressFeatureOption[] = [
  { id: "dar", label: "Dar" },
  { id: "duz", label: "Düz" },
  { id: "bol", label: "Bol" },
  { id: "ispanyol", label: "İspanyol" },
  { id: "lastikli", label: "Lastikli" },
  { id: "katlamali", label: "Katlamalı" },
];

const BOTTOM_HEM_GROUP: DressFeatureGroup = {
  key: "hem",
  label: "Paça",
  options: BOTTOM_HEM_OPTIONS,
};

export const DRESS_FEATURE_GROUPS: DressFeatureGroup[] = [
  {
    key: "neckline",
    label: "Yaka",
    options: [
      { id: "yuvarlak", label: "Yuvarlak yaka" },
      { id: "bisiklet", label: "Bisiklet yaka" },
      { id: "v", label: "V yaka" },
      { id: "kare", label: "Kare yaka" },
      { id: "u", label: "U yaka" },
      { id: "kayik", label: "Kayık yaka" },
      { id: "ince-aski", label: "İnce askı" },
      { id: "straplez", label: "Straplez" },
      { id: "halter", label: "Halter" },
      { id: "tek-omuz", label: "Tek omuz" },
      { id: "dik", label: "Dik yaka" },
      { id: "polo", label: "Polo yaka" },
      { id: "capraz", label: "Çapraz / wrap" },
    ],
  },
  {
    key: "sleeves",
    label: "Kol",
    options: [
      { id: "kolsuz", label: "Kolsuz" },
      { id: "kisa", label: "Kısa kol" },
      { id: "uc-ceyrek", label: "Üç çeyrek" },
      { id: "uzun", label: "Uzun kol" },
    ],
  },
  {
    key: "length",
    label: "Boy",
    options: DRESS_LENGTH_OPTIONS,
  },
  {
    key: "decollete",
    label: "Dekolte",
    optional: true,
    options: [
      { id: "yok", label: "Yok" },
      { id: "hafif", label: "Hafif" },
      { id: "gogus", label: "Göğüs" },
      { id: "sirt", label: "Sırt" },
      { id: "omuz", label: "Omuz" },
      { id: "derin-v", label: "Derin V" },
    ],
  },
  {
    key: "fabric",
    label: "Kumaş",
    options: [
      { id: "saten", label: "Saten" },
      { id: "krep", label: "Krep" },
      { id: "keten", label: "Keten" },
      { id: "pamuk", label: "Pamuk" },
      { id: "orme", label: "Örme" },
      { id: "sifon", label: "Şifon" },
      { id: "kadife", label: "Kadife" },
      { id: "dantel", label: "Dantel" },
      { id: "tul", label: "Tül" },
      { id: "jersey", label: "Scuba / jersey" },
    ],
  },
  {
    key: "zipper",
    label: "Fermuar",
    optional: true,
    options: [
      { id: "yok", label: "Yok" },
      { id: "sirt", label: "Sırt fermuar" },
      { id: "yan", label: "Yan fermuar" },
      { id: "gizli", label: "Gizli fermuar" },
    ],
  },
  {
    key: "stretch",
    label: "Esneklik",
    options: [
      { id: "degil", label: "Esnek değil" },
      { id: "hafif", label: "Hafif esnek" },
      { id: "esnek", label: "Esnek" },
    ],
  },
  {
    key: "silhouette",
    label: "Silüet",
    optional: true,
    options: [
      { id: "a-kesim", label: "A kesim" },
      { id: "vucuda", label: "Vücuda oturan" },
      { id: "wrap", label: "Wrap" },
      { id: "gomlek", label: "Gömlek elbise" },
      { id: "bol", label: "Rahat / bol" },
    ],
  },
];

const LENGTH_ALIASES: Record<string, string> = {
  "bel üstü": "crop",
  "crop (bel üstü)": "crop",
  "bel / kalça üstü": "normal",
  "kalça üstü": "normal",
  longline: "uzun",
  "uzun / longline": "uzun",
  "tunik boy": "tunik",
  "üst uyluk": "tunik",
};

const OPTION_BY_KEY = new Map<DressFeatureKey, Map<string, DressFeatureOption>>();
for (const group of [
  ...DRESS_FEATURE_GROUPS,
  TOP_FIT_GROUP,
  BOTTOM_FIT_GROUP,
  BOTTOM_RISE_GROUP,
  BOTTOM_HEM_GROUP,
]) {
  const map = new Map<string, DressFeatureOption>();
  const options =
    group.key === "length"
      ? [...DRESS_LENGTH_OPTIONS, ...TOP_LENGTH_OPTIONS, ...BOTTOM_LENGTH_OPTIONS]
      : group.key === "fit"
        ? [...TOP_FIT_OPTIONS, ...BOTTOM_FIT_OPTIONS]
        : group.options;
  for (const option of options) {
    map.set(option.id, option);
    map.set(option.label.toLocaleLowerCase("tr"), option);
  }
  OPTION_BY_KEY.set(group.key, map);
}

const lengthMap = OPTION_BY_KEY.get("length");
if (lengthMap) {
  for (const [alias, id] of Object.entries(LENGTH_ALIASES)) {
    const option = lengthMap.get(id);
    if (option) lengthMap.set(alias, option);
  }
}

const FIT_ALIASES: Record<string, string> = {
  fitted: "slim",
  "vücuda oturan": "slim",
  "vucuda oturan": "slim",
  "regular fit": "regular",
  relaxed: "rahat",
  oversized: "oversize",
  "geniş": "wide",
  "wide leg": "wide",
};

const fitMap = OPTION_BY_KEY.get("fit");
if (fitMap) {
  for (const [alias, id] of Object.entries(FIT_ALIASES)) {
    const option = fitMap.get(id);
    if (option) fitMap.set(alias, option);
  }
}

export function dressFeatureLabel(
  key: DressFeatureKey,
  raw: string | null | undefined,
): string | null {
  const value = raw?.trim();
  if (!value) return null;
  const option = OPTION_BY_KEY.get(key)?.get(value) ??
    OPTION_BY_KEY.get(key)?.get(value.toLocaleLowerCase("tr"));
  return option?.label ?? value;
}

/** Map an option id or owner chip to the stored Turkish label. */
export function resolveDressFeatureValue(
  key: DressFeatureKey,
  raw: string | null | undefined,
): string {
  return dressFeatureLabel(key, raw) ?? "";
}

export function getConstructionFeatureGroups(
  family: ConstructionCatalogFamily = "elbise",
  category?: string | null,
): DressFeatureGroup[] {
  if (family === "alt-giyim") {
    const extras = DRESS_FEATURE_GROUPS.filter(
      (group) =>
        group.key === "fabric" ||
        group.key === "zipper" ||
        group.key === "stretch",
    );
    return [
      {
        key: "length",
        label: "Boy",
        options: altGiyimUsesPaca(category)
          ? BOTTOM_LENGTH_OPTIONS
          : DRESS_LENGTH_OPTIONS,
      },
      BOTTOM_RISE_GROUP,
      BOTTOM_FIT_GROUP,
      ...(altGiyimUsesPaca(category) ? [BOTTOM_HEM_GROUP] : []),
      ...extras,
    ];
  }
  const groups: DressFeatureGroup[] = [];
  for (const group of DRESS_FEATURE_GROUPS) {
    if (group.key === "length") {
      groups.push({
        ...group,
        options:
          family === "ust-giyim" ? TOP_LENGTH_OPTIONS : DRESS_LENGTH_OPTIONS,
      });
      continue;
    }
    if (group.key === "sleeves") {
      groups.push(group);
      if (family === "ust-giyim") groups.push(TOP_FIT_GROUP);
      continue;
    }
    if (group.key === "silhouette" && family === "ust-giyim") continue;
    groups.push(group);
  }
  return groups;
}

export function getDressFeatureGroup(
  key: DressFeatureKey,
): DressFeatureGroup | null {
  return DRESS_FEATURE_GROUPS.find((group) => group.key === key) ?? null;
}

/** Chip id from an option id or stored Turkish label. */
export function dressFeatureOptionId(
  key: DressFeatureKey,
  raw: string | null | undefined,
): string | null {
  const value = raw?.trim();
  if (!value) return null;
  const option =
    OPTION_BY_KEY.get(key)?.get(value) ??
    OPTION_BY_KEY.get(key)?.get(value.toLocaleLowerCase("tr"));
  return option?.id ?? null;
}
