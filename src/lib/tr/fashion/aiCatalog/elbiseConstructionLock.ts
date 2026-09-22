import {
  decolleteNoneLabel,
  dressFeatureOptionId,
  resolveDressFeatureValue,
} from "@/lib/tr/catalog/dressFeatures";
import {
  altGiyimUsesPaca,
  type ConstructionCatalogFamily,
} from "@/lib/tr/catalog/garmentUploadTypes";

export interface ElbiseConstructionChips {
  neckline?: string | null;
  sleeves?: string | null;
  fit?: string | null;
  length?: string | null;
  decollete?: string | null;
  rise?: string | null;
  hem?: string | null;
}

const LENGTH_EN: Record<string, string> = {
  mikro: "micro mini — hem well above mid-thigh. Do not lengthen.",
  mini: "mini length. Do not lengthen to midi or maxi.",
  "diz-ustu": "above-the-knee length. Do not shorten to micro or lengthen to midi.",
  "diz-boyu": "knee-length. Do not shorten to mini or lengthen to midi/maxi.",
  midi: "midi length, about mid-calf. Do not shorten or lengthen to maxi.",
  maxi: "maxi / floor length. Do not shorten.",
  asimetrik: "asymmetric hem as photographed. Do not even the hem.",
  crop: "crop length, ending above the waist. Do not lengthen.",
  normal: "regular length as photographed. Do not crop or lengthen.",
  uzun: "long length as photographed. Do not shorten.",
  tunik: "tunic length, ending at the upper thigh. Do not shorten to crop.",
  kisa: "short bottom length — ankle or above. Do not lengthen to a full-length pant.",
};

const DECOLLETE_EN: Record<string, string> = {
  yok: "no decollete cutout.",
  hafif: "slight decollete only, as photographed.",
  gogus: "chest decollete as photographed. Do not deepen.",
  sirt: "back decollete as photographed. Front is not a plunging cut.",
  omuz: "shoulder decollete as photographed. Do not add sleeves to cover it.",
  "derin-v": "deep V decollete as photographed. Do not add extra cutouts.",
};

const SLEEVES_EN: Record<string, string> = {
  kolsuz:
    "Sleeves: sleeveless. No sleeves, no invented arm flaps or hanging shoulder fabric. Do not add sleeves.",
  kisa:
    "Sleeves: short sleeves as photographed. Keep cuffs, buttons, and slits. Do not remove the sleeves or lengthen them.",
  "uc-ceyrek":
    "Sleeves: three-quarter length as photographed. Do not shorten to short or lengthen to long.",
  uzun:
    "Sleeves: long sleeves as photographed. Do not crop or shorten.",
};

function necklineLock(id: string | null, label: string): string {
  if (id === "straplez") {
    return `Neckline is strapless (${label}). No straps, no off-shoulder drape.`;
  }
  if (id === "ince-aski") {
    return `Neckline is thin spaghetti straps (${label}). Thin straps only. No extra arm flaps, no off-shoulder drape.`;
  }
  if (id === "halter") {
    return `Neckline is halter (${label}). Halter straps only. No extra arm flaps, no off-shoulder drape.`;
  }
  if (id === "tek-omuz") {
    return `Neckline is one-shoulder (${label}). One-shoulder only. No strap on the bare shoulder. No invented off-shoulder drape.`;
  }
  return `Neckline is ${label}. Do not add straps unless they are clearly this neckline. Do not invent off-shoulder drape.`;
}

function sleevesLock(id: string | null, label: string): string {
  return SLEEVES_EN[id ?? ""] ?? `Sleeves: ${label} as photographed. Do not invent or remove sleeves.`;
}

const FIT_EN: Record<string, string> = {
  slim: "Fit: slim / close to the body. Do not bag out or oversize.",
  regular: "Fit: regular. Do not slim to bodycon or enlarge to oversize.",
  rahat: "Fit: relaxed. Keep the ease. Do not slim to fitted or enlarge to oversize.",
  oversize: "Fit: oversize. Keep the volume. Do not take in or slim.",
  wide: "Fit: wide through the hip and thigh. Do not slim to skinny.",
};

const RISE_EN: Record<string, string> = {
  yuksek:
    "Rise: high-rise. Waistband sits at or above the navel. Do not drop to mid or low rise.",
  normal: "Rise: mid / regular rise. Do not raise to high-rise or drop to low-rise.",
  dusuk:
    "Rise: low-rise. Waistband sits below the navel; midriff stays visible. Do not raise to high-rise.",
};

const HEM_EN: Record<string, string> = {
  dar: "Leg opening (paça): narrow / tapered. Do not flare or widen the hem.",
  duz: "Leg opening (paça): straight. Do not taper or flare.",
  bol: "Leg opening (paça): wide. Keep the opening width. Do not taper.",
  ispanyol: "Leg opening (paça): flare / ispanyol. Keep the flare. Do not straighten.",
  lastikli: "Leg opening (paça): elastic / gathered cuff. Keep the elastic finish.",
  katlamali: "Leg opening (paça): cuffed / folded hem. Keep the cuff. Do not drop it.",
};

function fitLock(id: string | null, label: string): string {
  return FIT_EN[id ?? ""] ?? `Fit: ${label} as photographed. Do not change the ease.`;
}

function knownFeature(
  key: "neckline" | "sleeves" | "fit" | "length" | "decollete" | "rise" | "hem",
  raw: string | null | undefined,
): string {
  if (!dressFeatureOptionId(key, raw)) return "";
  return resolveDressFeatureValue(key, raw);
}

/**
 * Drop family-invalid chips so leftover `neckHem` / collar text cannot
 * become Paça on a dress or trigger the bottoms try-on lock.
 */
export function constructionChipsForFamily(
  chips: ElbiseConstructionChips | null | undefined,
  family?: ConstructionCatalogFamily | null,
  detailImageUrl?: string | null,
): ElbiseConstructionChips {
  const rise = knownFeature("rise", chips?.rise);
  const hem = knownFeature("hem", chips?.hem);
  const bottom = family === "alt-giyim";
  const dress = family === "elbise";
  const top = family === "ust-giyim";
  const unspecified = family == null;
  const treatBottom = bottom || (unspecified && Boolean(rise || hem));
  const treatDressOrTop = dress || top || (unspecified && !treatBottom);

  let decollete = treatDressOrTop
    ? resolveDressFeatureValue("decollete", chips?.decollete) || null
    : null;
  if (
    treatDressOrTop &&
    detailImageUrl !== undefined &&
    !detailImageUrl?.trim()
  ) {
    decollete = decolleteNoneLabel();
  }

  return {
    neckline: treatDressOrTop
      ? resolveDressFeatureValue("neckline", chips?.neckline) || null
      : null,
    sleeves: treatDressOrTop
      ? resolveDressFeatureValue("sleeves", chips?.sleeves) || null
      : null,
    decollete,
    fit: dress ? null : knownFeature("fit", chips?.fit) || null,
    length: resolveDressFeatureValue("length", chips?.length) || null,
    rise: treatBottom ? rise || null : null,
    hem: treatBottom ? hem || null : null,
  };
}

export function hasElbiseLockedConstruction(
  chips: ElbiseConstructionChips | null | undefined,
  family?: ConstructionCatalogFamily | null,
  category?: string | null,
): boolean {
  if (family === "alt-giyim") {
    const base = Boolean(
      resolveDressFeatureValue("length", chips?.length) &&
        resolveDressFeatureValue("rise", chips?.rise) &&
        resolveDressFeatureValue("fit", chips?.fit),
    );
    if (!base) return false;
    if (!altGiyimUsesPaca(category)) return true;
    return Boolean(resolveDressFeatureValue("hem", chips?.hem));
  }
  const base = Boolean(
    resolveDressFeatureValue("neckline", chips?.neckline) &&
      resolveDressFeatureValue("length", chips?.length) &&
      resolveDressFeatureValue("sleeves", chips?.sleeves),
  );
  if (!base) return false;
  if (family === "ust-giyim") {
    return Boolean(resolveDressFeatureValue("fit", chips?.fit));
  }
  return true;
}

/** English FASHN lock from owner-confirmed boy / yaka / kol / detay. */
export function buildElbiseConstructionLock(
  chips: ElbiseConstructionChips | null | undefined,
  family?: ConstructionCatalogFamily | null,
  detailImageUrl?: string | null,
): string {
  const scoped = constructionChipsForFamily(chips, family, detailImageUrl);
  const neckline = scoped.neckline?.trim() || "";
  const sleeves = scoped.sleeves?.trim() || "";
  const fit = scoped.fit?.trim() || "";
  const length = scoped.length?.trim() || "";
  const decollete = scoped.decollete?.trim() || "";
  const rise = scoped.rise?.trim() || "";
  const hem = scoped.hem?.trim() || "";
  const parts: string[] = [];

  if (neckline) {
    parts.push(
      necklineLock(dressFeatureOptionId("neckline", neckline), neckline),
    );
  }
  if (sleeves) {
    parts.push(sleevesLock(dressFeatureOptionId("sleeves", sleeves), sleeves));
  }
  if (fit) {
    parts.push(fitLock(dressFeatureOptionId("fit", fit), fit));
  }
  if (length) {
    const id = dressFeatureOptionId("length", length);
    parts.push(
      `Exact length: ${LENGTH_EN[id ?? ""] ?? `${length}. Do not change the hem length.`}`,
    );
  }
  if (rise) {
    const id = dressFeatureOptionId("rise", rise);
    parts.push(RISE_EN[id ?? ""] ?? `Rise: ${rise} as photographed.`);
  }
  if (hem) {
    const id = dressFeatureOptionId("hem", hem);
    parts.push(HEM_EN[id ?? ""] ?? `Leg opening: ${hem} as photographed.`);
  }
  if (decollete) {
    const id = dressFeatureOptionId("decollete", decollete);
    parts.push(
      `Detail/decollete: ${DECOLLETE_EN[id ?? ""] ?? decollete}`,
    );
  }

  if (parts.length === 0) return "";
  return `Construction lock: ${parts.join(" ")}`;
}

/**
 * Try-on lock: length first (hem must stay visible), then yaka, kol, detay.
 */
export function buildElbiseTryOnConstructionLock(
  chips: ElbiseConstructionChips | null | undefined,
  family?: ConstructionCatalogFamily | null,
  detailImageUrl?: string | null,
): string {
  const scoped = constructionChipsForFamily(chips, family, detailImageUrl);
  const neckline = scoped.neckline?.trim() || "";
  const sleeves = scoped.sleeves?.trim() || "";
  const fit = scoped.fit?.trim() || "";
  const length = scoped.length?.trim() || "";
  const decollete = scoped.decollete?.trim() || "";
  const rise = scoped.rise?.trim() || "";
  const hem = scoped.hem?.trim() || "";
  const bottoms = family === "alt-giyim" || (family == null && Boolean(rise || hem));
  const parts: string[] = [];

  if (length) {
    const id = dressFeatureOptionId("length", length);
    const cropMidriff =
      id === "crop"
        ? " Crop top: hem ends above the waist. The model's midriff / belly must stay visible between the hem and the waistband. Do not tuck, pull down, or lengthen to cover the stomach. Do not add a high-rise layer over the belly."
        : "";
    parts.push(
      `LENGTH IS THE MOST IMPORTANT FACT. Full body from head to toe; the hem must be fully visible. Exact length: ${LENGTH_EN[id ?? ""] ?? `${length}. Do not change the hem length.`}${cropMidriff}`,
    );
  } else {
    parts.push(
      "LENGTH IS THE MOST IMPORTANT FACT. Full body from head to toe; keep the exact hem length from the product image.",
    );
  }
  if (bottoms) {
    parts.push(
      "Replace ONLY the bottom garment from the product image. Keep the model's top from the reference plate. Do not turn pants into a dress or a skirt into pants. Do not invent a matching top or a tracksuit set.",
    );
  } else if (family === "elbise") {
    parts.push(
      "This is a one-piece dress. Replace the plate's outfit with this dress. Do not keep a separate top. Do not treat the dress as pants or a skirt-only bottom.",
    );
  }
  if (neckline) {
    parts.push(
      `Yaka/neckline is also critical. ${necklineLock(dressFeatureOptionId("neckline", neckline), neckline)}`,
    );
  }
  if (sleeves) {
    parts.push(
      `Kol/sleeves are also critical. ${sleevesLock(dressFeatureOptionId("sleeves", sleeves), sleeves)}`,
    );
  }
  if (rise) {
    const id = dressFeatureOptionId("rise", rise);
    const lowRise =
      id === "dusuk"
        ? " The midriff between the waistband and the top hem must stay visible. Do not pull the waistband up."
        : "";
    parts.push(
      `Waist/rise (bel) is also critical. ${RISE_EN[id ?? ""] ?? `Rise: ${rise}.`}${lowRise} Keep any belt, buckle, and belt loops from the product at this waistband. Do not strip them to a plain waistband. Do not add a belt the product does not have.`,
    );
  }
  if (fit) {
    parts.push(
      `Kalıp/fit is also critical. ${fitLock(dressFeatureOptionId("fit", fit), fit)}`,
    );
  }
  if (hem) {
    const id = dressFeatureOptionId("hem", hem);
    parts.push(
      `Paça/leg opening is also critical. ${HEM_EN[id ?? ""] ?? `Leg opening: ${hem}.`}`,
    );
  }
  const decolleteId = decollete
    ? dressFeatureOptionId("decollete", decollete)
    : null;
  if (decollete && decolleteId && decolleteId !== "yok") {
    parts.push(
      `Detail/decollete is important: ${DECOLLETE_EN[decolleteId] ?? decollete}`,
    );
  }

  return `Construction lock: ${parts.join(" ")}`;
}

export function constructionChipsEqual(
  a: ElbiseConstructionChips,
  b: ElbiseConstructionChips,
): boolean {
  return (
    resolveDressFeatureValue("neckline", a.neckline) ===
      resolveDressFeatureValue("neckline", b.neckline) &&
    resolveDressFeatureValue("sleeves", a.sleeves) ===
      resolveDressFeatureValue("sleeves", b.sleeves) &&
    resolveDressFeatureValue("length", a.length) ===
      resolveDressFeatureValue("length", b.length) &&
    resolveDressFeatureValue("fit", a.fit) ===
      resolveDressFeatureValue("fit", b.fit) &&
    resolveDressFeatureValue("rise", a.rise) ===
      resolveDressFeatureValue("rise", b.rise) &&
    resolveDressFeatureValue("hem", a.hem) ===
      resolveDressFeatureValue("hem", b.hem) &&
    resolveDressFeatureValue("decollete", a.decollete) ===
      resolveDressFeatureValue("decollete", b.decollete)
  );
}
