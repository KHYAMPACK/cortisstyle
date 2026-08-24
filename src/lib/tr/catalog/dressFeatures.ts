/** Structured elbise PDP chips — Gemini suggests ids, we store Turkish labels. */

export type DressFeatureKey =
  | "neckline"
  | "sleeves"
  | "length"
  | "decollete"
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
  /** Owner can leave empty / Gemini omits when not visible. */
  optional?: boolean;
}

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
    options: [
      { id: "mikro", label: "Mikro" },
      { id: "mini", label: "Mini" },
      { id: "diz-ustu", label: "Diz üstü" },
      { id: "diz-boyu", label: "Diz boyu" },
      { id: "midi", label: "Midi" },
      { id: "maxi", label: "Maxi" },
      { id: "asimetrik", label: "Asimetrik" },
    ],
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

const OPTION_BY_KEY = new Map<DressFeatureKey, Map<string, DressFeatureOption>>();
for (const group of DRESS_FEATURE_GROUPS) {
  const map = new Map<string, DressFeatureOption>();
  for (const option of group.options) {
    map.set(option.id, option);
    map.set(option.label.toLocaleLowerCase("tr"), option);
  }
  OPTION_BY_KEY.set(group.key, map);
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

/** Map Gemini id or owner chip to the stored Turkish label. */
export function resolveDressFeatureValue(
  key: DressFeatureKey,
  raw: string | null | undefined,
): string {
  return dressFeatureLabel(key, raw) ?? "";
}

export function dressGeminiEnumHint(): string {
  return DRESS_FEATURE_GROUPS.map((group) => {
    const ids = group.options.map((option) => option.id).join(" | ");
    const omit = group.optional ? " (omit if not visible)" : "";
    return `- ${group.key}: ${ids}${omit}`;
  }).join("\n");
}

export function getDressFeatureGroup(
  key: DressFeatureKey,
): DressFeatureGroup | null {
  return DRESS_FEATURE_GROUPS.find((group) => group.key === key) ?? null;
}

/** Chip id from Gemini id or stored Turkish label. */
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

/** Boy / yaka / kol / detay shown before FASHN. */
export const DRESS_PACKSHOT_GATE_GROUPS: Array<{
  key: "length" | "neckline" | "sleeves" | "decollete";
  label: string;
  required: boolean;
}> = [
  { key: "length", label: "Boy", required: true },
  { key: "neckline", label: "Yaka", required: true },
  { key: "sleeves", label: "Kol", required: true },
  { key: "decollete", label: "Detay", required: false },
];

const SLEEVELESS_NECKLINE_IDS = new Set([
  "straplez",
  "ince-aski",
  "halter",
  "tek-omuz",
]);

/** Preselect Kolsuz for straplez / askı / halter / tek omuz when Kol is empty. */
export function defaultSleevesForNeckline(
  neckline: string | null | undefined,
): string {
  const id = dressFeatureOptionId("neckline", neckline);
  if (!id || !SLEEVELESS_NECKLINE_IDS.has(id)) return "";
  return resolveDressFeatureValue("sleeves", "kolsuz");
}

export function withDefaultSleeves<
  T extends { neckline?: string | null; sleeves?: string | null },
>(chips: T): T {
  if (chips.sleeves?.trim()) return chips;
  const sleeves = defaultSleevesForNeckline(chips.neckline);
  if (!sleeves) return chips;
  return { ...chips, sleeves };
}
