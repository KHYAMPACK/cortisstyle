import type {
  TrAiModelIdentity,
  TrAiModelOption,
  TrAiModelPose,
} from "@/lib/tr/aiModel/types";

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

/**
 * In-code model registry. Later: load from boutique editorial_content / DB.
 * Populate referenceImageUrls after in-shop portrait shoot.
 */
const BOUTIQUE_AI_MODELS: Record<string, TrAiModelIdentity> = {
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
  envKey: string;
  defaultPose: TrAiModelPose;
};

const STUDIO_MODELS: StudioModelDef[] = [
  {
    id: "studio:ayla",
    label: "Ayla",
    hint: "Stüdyo modeli",
    envKey: "TR_AI_STUDIO_AYLA_REF_URLS",
    defaultPose: "standing-front",
  },
  {
    id: "studio:deniz",
    label: "Deniz",
    hint: "Stüdyo modeli",
    envKey: "TR_AI_STUDIO_DENIZ_REF_URLS",
    defaultPose: "standing-three-quarter",
  },
];

function hasRefs(urls: string[]): boolean {
  return urls.some((url) => Boolean(url?.trim()));
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

function studioOption(def: StudioModelDef): TrAiModelOption {
  const referenceImageUrls = parseEnvUrlList(def.envKey);
  const ready = hasRefs(referenceImageUrls);
  return {
    id: def.id,
    label: def.label,
    hint: ready ? def.hint : `${def.hint} · referans bekleniyor`,
    ready,
    kind: "studio",
    referenceImageUrls,
    faceReferenceUrls: [],
    defaultPose: def.defaultPose,
  };
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
    if (!identity) return null;
    return {
      id,
      label: identity.displayName,
      hint: hasRefs(identity.referenceImageUrls)
        ? "Butik modeli"
        : "Referans fotoğrafı bekleniyor",
      ready: hasRefs(identity.referenceImageUrls),
      kind: "boutique",
      referenceImageUrls: identity.referenceImageUrls,
      faceReferenceUrls: identity.faceReferenceUrls ?? [],
      defaultPose: identity.defaultPose,
    };
  }

  // Bare boutique slug fallback
  const slug = (boutiqueSlug ?? id).trim().toLowerCase();
  const identity = getBoutiqueAiModelIdentity(slug);
  if (!identity) return null;
  return {
    id: `boutique:${identity.boutiqueSlug}`,
    label: identity.displayName,
    hint: hasRefs(identity.referenceImageUrls)
      ? "Butik modeli"
      : "Referans fotoğrafı bekleniyor",
    ready: hasRefs(identity.referenceImageUrls),
    kind: "boutique",
    referenceImageUrls: identity.referenceImageUrls,
    faceReferenceUrls: identity.faceReferenceUrls ?? [],
    defaultPose: identity.defaultPose,
  };
}

/** Options for the owner panel model picker. */
export function listAiModelOptions(
  boutiqueSlug: string | null | undefined,
): TrAiModelOption[] {
  const options: TrAiModelOption[] = [];
  const slug = boutiqueSlug?.trim().toLowerCase() ?? "";
  const boutiqueModel = slug ? getBoutiqueAiModelIdentity(slug) : null;

  if (boutiqueModel) {
    options.push({
      id: `boutique:${boutiqueModel.boutiqueSlug}`,
      label: boutiqueModel.displayName,
      hint: hasRefs(boutiqueModel.referenceImageUrls)
        ? "Butik modeli"
        : "Referans fotoğrafı yakında",
      ready: hasRefs(boutiqueModel.referenceImageUrls),
      kind: "boutique",
      referenceImageUrls: boutiqueModel.referenceImageUrls,
      faceReferenceUrls: boutiqueModel.faceReferenceUrls ?? [],
      defaultPose: boutiqueModel.defaultPose,
    });
  }

  for (const def of STUDIO_MODELS) {
    options.push(studioOption(def));
  }

  return options;
}

export function aiModelOptionHasReferences(modelId: string): boolean {
  const option = getAiModelOptionById(modelId);
  return Boolean(option?.ready);
}
