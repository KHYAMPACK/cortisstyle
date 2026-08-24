import {
  DEFAULT_NUMERIC_SIZES,
  detectSizeChart,
  type TrSizeChartId,
} from "@/lib/tr/catalog/productOptions";

export type TrPdpSizeChartId = Exclude<TrSizeChartId, "none">;

export type TrSizeChartRow = {
  id: string;
  label: string;
  values: string[];
};

export type TrSizeChartTable = {
  id: TrPdpSizeChartId;
  title: string;
  columns: string[];
  rows: TrSizeChartRow[];
  unit: "cm";
  howToMeasure: string;
  tolerance: string;
};

/** Letter chart — body measurements (cm). */
export const LETTER_SIZE_CHART: TrSizeChartTable = {
  id: "letter",
  title: "Beden Tablosu",
  columns: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
  unit: "cm",
  howToMeasure:
    "Göğüs, bel ve basen ölçülerini vücut üzerinden, mezura yatay ve sıkı olmadan alın.",
  tolerance: "Ölçülerde ± 2 cm fark tolerans dahilindedir.",
  rows: [
    { id: "eu", label: "EU", values: ["34", "36", "38", "40", "42", "44", "46"] },
    {
      id: "bust",
      label: "Göğüs",
      values: ["82", "86", "90", "96", "102", "108", "114"],
    },
    {
      id: "waist",
      label: "Bel",
      values: ["64", "68", "72", "78", "84", "90", "96"],
    },
    {
      id: "hip",
      label: "Basen",
      values: ["88", "92", "96", "102", "108", "114", "120"],
    },
  ],
};

/**
 * Even-size garment measurements (cm). Odds and sizes above 40 are
 * interpolated / extrapolated from these anchors.
 */
const NUMERIC_EVEN_ANCHORS = {
  sizes: [24, 26, 28, 30, 32, 34, 36, 38, 40],
  eu: [32, 34, 36, 38, 40, 42, 44, 46, 48],
  waist: [32, 34, 36, 38, 40.5, 43, 45.5, 48, 50.5],
  thigh: [26, 27.5, 29, 30.5, 32, 33.5, 35, 36.5, 38],
  hip: [44, 46, 48, 50, 52.5, 55, 57.5, 60, 62.5],
  inseam: [76, 76, 78, 78, 80, 80, 80, 80, 80],
} as const;

function interpolateNumericMeasure(
  size: number,
  sizes: readonly number[],
  values: readonly number[],
): number {
  const last = sizes.length - 1;
  if (size <= sizes[0]!) {
    const span = sizes[1]! - sizes[0]!;
    const step = values[1]! - values[0]!;
    return values[0]! + ((size - sizes[0]!) / span) * step;
  }
  if (size >= sizes[last]!) {
    const span = sizes[last]! - sizes[last - 1]!;
    const step = values[last]! - values[last - 1]!;
    return values[last]! + ((size - sizes[last]!) / span) * step;
  }
  for (let i = 0; i < last; i += 1) {
    const left = sizes[i]!;
    const right = sizes[i + 1]!;
    if (size >= left && size <= right) {
      const t = (size - left) / (right - left);
      return values[i]! + (values[i + 1]! - values[i]!) * t;
    }
  }
  return values[last]!;
}

function formatChartMeasure(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function numericChartRow(values: readonly number[]): string[] {
  return DEFAULT_NUMERIC_SIZES.map((column) =>
    formatChartMeasure(
      interpolateNumericMeasure(
        Number(column),
        NUMERIC_EVEN_ANCHORS.sizes,
        values,
      ),
    ),
  );
}

/** Numeric / jean-style chart — garment flat measurements (cm). */
export const NUMERIC_SIZE_CHART: TrSizeChartTable = {
  id: "numeric",
  title: "Beden Tablosu",
  columns: [...DEFAULT_NUMERIC_SIZES],
  unit: "cm",
  howToMeasure:
    "Bel ve basen, ürün düz yatırılıp kenardan kenara yarım ölçü (1/2) olarak alınır. Baldır ve iç boy, bacak dikişi üzerinden ölçülür.",
  tolerance: "Ölçülerde ± 2 cm fark tolerans dahilindedir.",
  rows: [
    { id: "eu", label: "EU", values: numericChartRow(NUMERIC_EVEN_ANCHORS.eu) },
    {
      id: "waist",
      label: "Bel (1/2)",
      values: numericChartRow(NUMERIC_EVEN_ANCHORS.waist),
    },
    {
      id: "thigh",
      label: "Baldır",
      values: numericChartRow(NUMERIC_EVEN_ANCHORS.thigh),
    },
    {
      id: "hip",
      label: "Basen (1/2)",
      values: numericChartRow(NUMERIC_EVEN_ANCHORS.hip),
    },
    {
      id: "inseam",
      label: "İç Boy Uzunluğu",
      values: numericChartRow(NUMERIC_EVEN_ANCHORS.inseam),
    },
  ],
};

export function getSizeChartTable(
  chart: TrPdpSizeChartId,
): TrSizeChartTable {
  return chart === "numeric" ? NUMERIC_SIZE_CHART : LETTER_SIZE_CHART;
}

/** Storefront size guide for this product’s size system. Null when no sizes. */
export function resolveProductSizeChart(
  sizes: string[],
): TrSizeChartTable | null {
  const id = detectSizeChart(sizes);
  if (id === "none") return null;
  return getSizeChartTable(id);
}
