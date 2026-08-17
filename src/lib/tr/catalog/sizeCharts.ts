import {
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

/** Numeric / jean-style chart — garment flat measurements (cm). */
export const NUMERIC_SIZE_CHART: TrSizeChartTable = {
  id: "numeric",
  title: "Beden Tablosu",
  columns: ["24", "26", "28", "30", "32", "34", "36", "38", "40"],
  unit: "cm",
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
  return getSizeChartTable(id);
}
