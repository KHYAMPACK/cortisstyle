import {
  DEFAULT_NUMERIC_SIZES,
  NUMERIC_EXPANDED_SIZES,
  detectSizeChart,
  evenNumericSizes,
  type TrSizeChartId,
} from "@/lib/tr/catalog/productOptions";

export type TrPdpSizeChartId = Exclude<TrSizeChartId, "none">;

export type TrSizeChartRow = {
  id: string;
  label: string;
  values: string[];
};

export type TrSizeChartMeasureKind = "body" | "garment";

export type TrSizeChartMeasurePointId = "bust" | "waist" | "hip";

export type TrSizeChartMeasurePoint = {
  id: TrSizeChartMeasurePointId;
  title: string;
  hint: string;
  /** Matches the dashed line on the size-guide figure. */
  swatch: string;
};

export type TrSizeChartTable = {
  id: TrPdpSizeChartId;
  title: string;
  columns: string[];
  rows: TrSizeChartRow[];
  unit: "cm";
  measureKind: TrSizeChartMeasureKind;
  measurePoints?: TrSizeChartMeasurePoint[];
  howToMeasure: string;
  tolerance: string;
};

/**
 * Letter body cm. S is the house anchor (göğüs 91 / bel 71 / basen 88).
 * Grade vs S: XS −4, M +4, then +6 per size (L…3XL).
 */
const LETTER_S_BODY_CM = { bust: 91, waist: 71, hip: 88 } as const;
const LETTER_GRADE_FROM_S = [-4, 0, 4, 10, 16, 22, 28] as const;

function letterBodyValues(sValue: number): string[] {
  return LETTER_GRADE_FROM_S.map((delta) => String(sValue + delta));
}

export const LETTER_BODY_MEASURE_POINTS: TrSizeChartMeasurePoint[] = [
  {
    id: "bust",
    title: "Göğüs ölçüsü",
    hint: "Göğüs hizasında, göğsün en geniş olduğu yerden alınır.",
    swatch: "#E11D48",
  },
  {
    id: "waist",
    title: "Bel ölçüsü",
    hint: "Belin en dar olduğu noktadan alınır.",
    swatch: "#EC4899",
  },
  {
    id: "hip",
    title: "Kalça ölçüsü",
    hint: "Basen çevresinin en geniş olduğu noktadan alınır.",
    swatch: "#7C3AED",
  },
];

/** Letter chart — body measurements (cm). */
export const LETTER_SIZE_CHART: TrSizeChartTable = {
  id: "letter",
  title: "Beden Tablosu",
  columns: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
  unit: "cm",
  measureKind: "body",
  measurePoints: LETTER_BODY_MEASURE_POINTS,
  howToMeasure:
    "Göğüs, bel ve basen ölçülerini vücut üzerinden, mezura yatay ve sıkı olmadan alın.",
  tolerance: "Ölçülerde ± 2 cm fark tolerans dahilindedir.",
  rows: [
    { id: "eu", label: "EU", values: ["34", "36", "38", "40", "42", "44", "46"] },
    {
      id: "bust",
      label: "Göğüs",
      values: letterBodyValues(LETTER_S_BODY_CM.bust),
    },
    {
      id: "waist",
      label: "Bel",
      values: letterBodyValues(LETTER_S_BODY_CM.waist),
    },
    {
      id: "hip",
      label: "Basen",
      values: letterBodyValues(LETTER_S_BODY_CM.hip),
    },
  ],
};

/**
 * Even-size garment measurements (cm) for 24–40. Larger even sizes (42–52)
 * are extrapolated from the last step when a product uses them.
 */
const NUMERIC_EVEN_ANCHORS = {
  sizes: [24, 26, 28, 30, 32, 34, 36, 38, 40],
  eu: [32, 34, 36, 38, 40, 42, 44, 46, 48],
  waist: [32, 34, 36, 38, 40.5, 43, 45.5, 48, 50.5],
  thigh: [26, 27.5, 29, 30.5, 32, 33.5, 35, 36.5, 38],
  hip: [44, 46, 48, 50, 52.5, 55, 57.5, 60, 62.5],
  inseam: [76, 76, 78, 78, 80, 80, 80, 80, 80],
} as const;

const NUMERIC_ANCHOR_BY_ROW: Record<string, readonly number[]> = {
  eu: NUMERIC_EVEN_ANCHORS.eu,
  waist: NUMERIC_EVEN_ANCHORS.waist,
  thigh: NUMERIC_EVEN_ANCHORS.thigh,
  hip: NUMERIC_EVEN_ANCHORS.hip,
  inseam: NUMERIC_EVEN_ANCHORS.inseam,
};

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

function numericMeasureForColumn(
  column: string,
  rowId: string,
  fallbackIndex: number,
  fallbackValues: string[],
): string {
  const fromDefault = DEFAULT_NUMERIC_SIZES.indexOf(column);
  if (fromDefault >= 0) {
    return fallbackValues[fromDefault] ?? fallbackValues[fallbackIndex] ?? "";
  }
  const series = NUMERIC_ANCHOR_BY_ROW[rowId];
  if (!series) return "";
  return formatChartMeasure(
    interpolateNumericMeasure(
      Number(column),
      NUMERIC_EVEN_ANCHORS.sizes,
      series,
    ),
  );
}

/** Numeric / jean-style chart — garment flat measurements (cm). */
export const NUMERIC_SIZE_CHART: TrSizeChartTable = {
  id: "numeric",
  title: "Beden Tablosu",
  columns: [...DEFAULT_NUMERIC_SIZES],
  unit: "cm",
  measureKind: "garment",
  howToMeasure:
    "Bel ve basen, ürün düz yatırılıp kenardan kenara yarım ölçü (1/2) olarak alınır. Baldır ve iç boy, bacak dikişi üzerinden ölçülür.",
  tolerance: "Ölçülerde ± 2 cm fark tolerans dahilindedir.",
  rows: [
    {
      id: "eu",
      label: "EU",
      values: ["32", "34", "36", "38", "40", "42", "44", "46", "48"],
    },
    {
      id: "waist",
      label: "Bel (1/2)",
      values: ["32", "34", "36", "38", "40.5", "43", "45.5", "48", "50.5"],
    },
    {
      id: "thigh",
      label: "Baldır",
      values: ["26", "27.5", "29", "30.5", "32", "33.5", "35", "36.5", "38"],
    },
    {
      id: "hip",
      label: "Basen (1/2)",
      values: ["44", "46", "48", "50", "52.5", "55", "57.5", "60", "62.5"],
    },
    {
      id: "inseam",
      label: "İç Boy Uzunluğu",
      values: ["76", "76", "78", "78", "80", "80", "80", "80", "80"],
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
  if (id !== "numeric") return LETTER_SIZE_CHART;

  const expandedUsed = NUMERIC_EXPANDED_SIZES.filter((size) =>
    sizes.some((entry) => entry.trim() === size),
  );
  if (expandedUsed.length === 0) return NUMERIC_SIZE_CHART;

  const max = Math.max(...expandedUsed.map((size) => Number(size)));
  const columns = evenNumericSizes(NUMERIC_EVEN_ANCHORS.sizes[0]!, max);
  return {
    ...NUMERIC_SIZE_CHART,
    columns,
    rows: NUMERIC_SIZE_CHART.rows.map((row) => ({
      ...row,
      values: columns.map((column, index) =>
        numericMeasureForColumn(column, row.id, index, row.values),
      ),
    })),
  };
}
