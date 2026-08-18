/**
 * Boutique / studio AI model registry.
 *
 * - Platform defaults: `studio:ayla` (woman) + `studio:deniz` (man)
 * - Boutique extras: add a row in `BOUTIQUE_AI_MODELS` (no owner upload UI)
 *
 * Ref URLs: env comma-lists override; else public/tr/ai-models paths.
 * Server try-on resolves local paths via data URI (FASHN cannot fetch localhost).
 */

import {
  STUDIO_AYLA_PUBLIC_PATH,
  STUDIO_DENIZ_PUBLIC_PATH,
} from "@/lib/tr/aiModel/prompts";
import type {
  TrAiModelGender,
  TrAiModelIdentity,
  TrAiModelOption,
  TrAiModelPose,
  TrLilaPhotographyStyle,
} from "@/lib/tr/aiModel/types";

export type { TrAiModelGender, TrLilaPhotographyStyle };

function parseEnvUrlList(envKey: string): string[] {
  // Server: TR_AI_STUDIO_* · Client picker: NEXT_PUBLIC_TR_AI_STUDIO_* (FASHN needs public URLs anyway)
  const raw =
    process.env[envKey]?.trim() ||
    process.env[`NEXT_PUBLIC_${envKey}`]?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function absolutePublicUrl(publicPath: string): string {
  const path = publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
  // Prefer env site URL only when not localhost — FASHN cannot fetch local origins.
  // Client picker still works with relative /tr/ai-models paths via getSiteUrl.
  const envSite = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const hostPart = envSite
    ? envSite.replace(/^https?:\/\//i, "").split("/")[0] ?? ""
    : "";
  const isLocal =
    Boolean(envSite) &&
    /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(hostPart);
  if (envSite && !isLocal) {
    return `${envSite}${path}`;
  }
  if (typeof window !== "undefined") {
    // Browser: relative is fine for <img>; keep absolute for consistency
    return `${window.location.origin}${path}`;
  }
  // Server fallback: relative path — providers convert via resolveModelImageForRemoteApi
  return path;
}

function hasRefs(urls: string[]): boolean {
  return urls.some((url) => Boolean(url?.trim()));
}

export const LILA_HOUSE_MODEL_ID = "boutique:lilabutik";
export const LILA_DEFAULT_PHOTOGRAPHY_STYLE: TrLilaPhotographyStyle = "blinds";
export const LILA_TRYON_SHOTS_PER_STYLE = 1;

export const LILA_PHOTOGRAPHY_STYLE_LABELS: Record<
  TrLilaPhotographyStyle,
  string
> = {
  blinds: "Panjur",
  flash: "Flaş",
};

export const LILABUTIK_LILA_TRYON_REFS_BY_STYLE: Record<
  TrLilaPhotographyStyle,
  readonly string[]
> = {
  blinds: [
    "/tr/ai-models/lilabutik-lila-blinds-front.jpg",
    "/tr/ai-models/lilabutik-lila-blinds-three-quarter.jpg",
    "/tr/ai-models/lilabutik-lila-blinds-hands-behind.jpg",
  ],
  flash: [
    "/tr/ai-models/lilabutik-lila-flash-front.jpg",
    "/tr/ai-models/lilabutik-lila-flash-three-quarter.jpg",
    "/tr/ai-models/lilabutik-lila-flash-hands-behind.jpg",
  ],
};

/** Full-body Lila plates: blinds + flash × front / three-quarter / hands-behind. */
export const LILABUTIK_LILA_TRYON_REFS = [
  ...LILABUTIK_LILA_TRYON_REFS_BY_STYLE.blinds,
  ...LILABUTIK_LILA_TRYON_REFS_BY_STYLE.flash,
] as const;

export function isLilaHouseModelId(modelId: string | null | undefined): boolean {
  return modelId?.trim() === LILA_HOUSE_MODEL_ID;
}

export function parseLilaPhotographyStyle(
  raw: unknown,
): TrLilaPhotographyStyle {
  return raw === "flash" ? "flash" : LILA_DEFAULT_PHOTOGRAPHY_STYLE;
}

export function lilaTryOnShotCount(modelId: string | null | undefined): number {
  return isLilaHouseModelId(modelId) ? LILA_TRYON_SHOTS_PER_STYLE : 1;
}

/** Owners pick the person (and Lila lighting), not the pose. */
export function pickRandomModelReferenceUrl(urls: string[]): string | null {
  const picked = pickDistinctModelReferenceUrls(urls, 1);
  return picked[0] ?? null;
}

/** Shuffle then take unique URLs — never repeats the same plate. */
export function pickDistinctModelReferenceUrls(
  urls: string[],
  count: number,
): string[] {
  const cleaned = [
    ...new Set(urls.map((url) => url.trim()).filter(Boolean)),
  ];
  if (cleaned.length === 0 || count <= 0) return [];
  for (let i = cleaned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = cleaned[i]!;
    cleaned[i] = cleaned[j]!;
    cleaned[j] = current;
  }
  return cleaned.slice(0, Math.min(count, cleaned.length));
}

/**
 * In-code model registry. Later: load from boutique editorial_content / DB.
 * Populate referenceImageUrls after in-shop portrait shoot (manual only).
 */
const BOUTIQUE_AI_MODELS: Record<string, TrAiModelIdentity> = {
  lilabutik: {
    boutiqueSlug: "lilabutik",
    displayName: "Lila",
    gender: "woman",
    referenceImageUrls: [...LILABUTIK_LILA_TRYON_REFS],
    faceReferenceUrls: [],
    defaultPose: "standing-front",
    notes:
      "House model for Lila Butik only. Owners pick blinds (default) or flash; try-on picks one random pose from that style’s three plates.",
  },
  pervinsoysalbutik: {
    boutiqueSlug: "pervinsoysalbutik",
    displayName: "Pervin Soysal",
    referenceImageUrls: [],
    faceReferenceUrls: [],
    defaultPose: "standing-front",
    notes:
      "Fill referenceImageUrls after portrait shoot at the boutique. Used for on-model AI.",
  },
};

type StudioModelDef = {
  id: string;
  label: string;
  hint: string;
  gender: TrAiModelGender;
  envKey: string;
  publicPathFallback: string;
  defaultPose: TrAiModelPose;
};

const STUDIO_MODELS: StudioModelDef[] = [
  {
    id: "studio:ayla",
    label: "Ayla",
    hint: "Kadın · stüdyo",
    gender: "woman",
    envKey: "TR_AI_STUDIO_AYLA_REF_URLS",
    publicPathFallback: STUDIO_AYLA_PUBLIC_PATH,
    defaultPose: "standing-front",
  },
  {
    id: "studio:deniz",
    label: "Deniz",
    hint: "Erkek · stüdyo",
    gender: "man",
    envKey: "TR_AI_STUDIO_DENIZ_REF_URLS",
    publicPathFallback: STUDIO_DENIZ_PUBLIC_PATH,
    defaultPose: "standing-three-quarter",
  },
];

function resolveStudioRefs(def: StudioModelDef): string[] {
  const fromEnv = parseEnvUrlList(def.envKey);
  if (hasRefs(fromEnv)) return fromEnv;
  return [absolutePublicUrl(def.publicPathFallback)];
}

function studioOption(def: StudioModelDef): TrAiModelOption {
  const referenceImageUrls = resolveStudioRefs(def);
  const ready = hasRefs(referenceImageUrls);
  return {
    id: def.id,
    label: def.label,
    hint: def.hint,
    gender: def.gender,
    ready,
    kind: "studio",
    referenceImageUrls,
    faceReferenceUrls: [],
    defaultPose: def.defaultPose,
  };
}

function boutiqueOption(identity: TrAiModelIdentity): TrAiModelOption {
  const ready = hasRefs(identity.referenceImageUrls);
  return {
    id: `boutique:${identity.boutiqueSlug}`,
    label: identity.displayName,
    hint: ready
      ? identity.boutiqueSlug === "lilabutik"
        ? "Butik modeli · stil seçin, poz rastgele"
        : "Butik modeli · poz rastgele"
      : "Referans fotoğrafı bekleniyor",
    gender: identity.gender,
    ready,
    kind: "boutique",
    referenceImageUrls: identity.referenceImageUrls,
    faceReferenceUrls: identity.faceReferenceUrls ?? [],
    defaultPose: identity.defaultPose,
  };
}

/** Ready first; boutique house model before studio; prefer woman among ready options. */
function sortPickerOptions(options: TrAiModelOption[]): TrAiModelOption[] {
  return [...options].sort((a, b) => {
    if (a.ready !== b.ready) return a.ready ? -1 : 1;
    if (a.kind === "boutique" && b.kind !== "boutique") return -1;
    if (b.kind === "boutique" && a.kind !== "boutique") return 1;
    if (a.gender === "woman" && b.gender !== "woman") return -1;
    if (b.gender === "woman" && a.gender !== "woman") return 1;
    return a.label.localeCompare(b.label, "tr");
  });
}

export function getBoutiqueAiModelIdentity(
  boutiqueSlug: string,
): TrAiModelIdentity | null {
  const slug = boutiqueSlug.trim().toLowerCase();
  return BOUTIQUE_AI_MODELS[slug] ?? null;
}

export function listRegisteredAiModelBoutiqueSlugs(): string[] {
  return Object.keys(BOUTIQUE_AI_MODELS);
}

/** Runtime/test helper — does not persist across deploys. */
export function registerBoutiqueAiModelIdentity(
  identity: TrAiModelIdentity,
): void {
  BOUTIQUE_AI_MODELS[identity.boutiqueSlug.trim().toLowerCase()] = identity;
}

export function boutiqueAiModelHasReferences(boutiqueSlug: string): boolean {
  const identity = getBoutiqueAiModelIdentity(boutiqueSlug);
  if (!identity) return false;
  return hasRefs(identity.referenceImageUrls);
}

export function getAiModelOptionById(
  modelId: string,
  boutiqueSlug?: string | null,
): TrAiModelOption | null {
  const id = modelId.trim();
  if (!id) return null;

  if (id.startsWith("studio:")) {
    const def = STUDIO_MODELS.find((m) => m.id === id);
    return def ? studioOption(def) : null;
  }

  if (id.startsWith("boutique:")) {
    const slug = id.slice("boutique:".length).trim().toLowerCase();
    const identity = getBoutiqueAiModelIdentity(slug);
    return identity ? boutiqueOption(identity) : null;
  }

  const slug = (boutiqueSlug ?? id).trim().toLowerCase();
  const identity = getBoutiqueAiModelIdentity(slug);
  return identity ? boutiqueOption(identity) : null;
}

/** Options for the owner panel model picker. */
export function listAiModelOptions(
  boutiqueSlug: string | null | undefined,
): TrAiModelOption[] {
  const options: TrAiModelOption[] = [];
  const slug = boutiqueSlug?.trim().toLowerCase() ?? "";
  const boutiqueModel = slug ? getBoutiqueAiModelIdentity(slug) : null;

  if (boutiqueModel) {
    options.push(boutiqueOption(boutiqueModel));
  }

  for (const def of STUDIO_MODELS) {
    options.push(studioOption(def));
  }

  return sortPickerOptions(options);
}

export function aiModelOptionHasReferences(modelId: string): boolean {
  const option = getAiModelOptionById(modelId);
  return Boolean(option?.ready);
}

/** First ready model for auto-select (boutique house model wins when ready). */
export function getDefaultReadyAiModelId(
  boutiqueSlug: string | null | undefined,
): string | null {
  const options = listAiModelOptions(boutiqueSlug);
  const boutique = options.find((o) => o.kind === "boutique" && o.ready);
  if (boutique) return boutique.id;
  return options.find((o) => o.ready)?.id ?? null;
}
