import fs from "node:fs";
import path from "node:path";
import {
  finalizeDynamicCatalog,
  mergeDynamicCatalogBundles,
  parseDynamicItemsPayload,
  parseDynamicLookPayload,
} from "@/lib/dynamicLooks/normalize";
import {
  EMPTY_DYNAMIC_CATALOG,
  type DynamicCatalogBundle,
  type LookCategoryDefinition,
} from "@/lib/dynamicLooks/types";

export const DYNAMIC_LOOKS_DIR = path.join(
  process.cwd(),
  "src/data/dynamic-looks",
);

const HOMEPAGE_ORDER_FILE = "homepage-order.json";
const CATEGORIES_FILE = "categories.json";

const RESERVED_FILES = new Set([HOMEPAGE_ORDER_FILE, CATEGORIES_FILE]);

function isItemsFile(fileName: string): boolean {
  return fileName.endsWith("-items.json");
}

function isLookProfileFile(fileName: string): boolean {
  return (
    fileName.endsWith(".json") &&
    !isItemsFile(fileName) &&
    !RESERVED_FILES.has(fileName)
  );
}

function readJsonFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as unknown;
}

function loadHomepageOrder(directory: string): string[] | undefined {
  const filePath = path.join(directory, HOMEPAGE_ORDER_FILE);
  if (!fs.existsSync(filePath)) return undefined;

  const raw = readJsonFile(filePath);
  if (!raw || typeof raw !== "object" || !("order" in raw)) return undefined;

  const order = (raw as { order?: unknown }).order;
  if (!Array.isArray(order)) return undefined;

  return order.filter((id): id is string => typeof id === "string" && id.length > 0);
}

function loadCategories(directory: string): LookCategoryDefinition[] | undefined {
  const filePath = path.join(directory, CATEGORIES_FILE);
  if (!fs.existsSync(filePath)) return undefined;

  const raw = readJsonFile(filePath);
  if (!Array.isArray(raw)) return undefined;

  return raw.filter(
    (entry): entry is LookCategoryDefinition =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as Record<string, unknown>).id === "string" &&
      typeof (entry as Record<string, unknown>).label === "string" &&
      ["aesthetic", "color", "creator"].includes(
        (entry as Record<string, unknown>).type as string,
      ),
  );
}

export function crawlDynamicLooksDirectory(
  directory = DYNAMIC_LOOKS_DIR,
): DynamicCatalogBundle {
  if (!fs.existsSync(directory)) {
    return EMPTY_DYNAMIC_CATALOG;
  }

  const homepageOrder = loadHomepageOrder(directory);
  const categories = loadCategories(directory);
  const entries = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();

  const itemBundles: DynamicCatalogBundle[] = [];
  const lookBundles: DynamicCatalogBundle[] = [];

  for (const fileName of entries) {
    const filePath = path.join(directory, fileName);
    const label = `src/data/dynamic-looks/${fileName}`;

    try {
      if (isItemsFile(fileName)) {
        const items = parseDynamicItemsPayload(readJsonFile(filePath), label);
        if (items.length > 0) {
          itemBundles.push({
            ...EMPTY_DYNAMIC_CATALOG,
            items,
          });
        }
        continue;
      }

      if (isLookProfileFile(fileName)) {
        const { look, canvasLayouts, homepageOrder: placement } =
          parseDynamicLookPayload(readJsonFile(filePath), label);

        if (!look) continue;

        lookBundles.push({
          ...EMPTY_DYNAMIC_CATALOG,
          looks: [look],
          lookOrderAdditions: homepageOrder
            ? []
            : [{ id: look.id, placement }],
          canvasLayoutsByLookId: {
            [look.id]: canvasLayouts,
          },
        });
      }
    } catch (error) {
      console.warn(`[dynamic-looks] Failed to parse ${label}:`, error);
    }
  }

  const merged = finalizeDynamicCatalog(
    mergeDynamicCatalogBundles(...itemBundles, ...lookBundles),
  );

  const result = homepageOrder ? { ...merged, homepageOrder } : merged;
  return categories ? { ...result, categories } : result;
}

export function loadDynamicLooksFromDisk(): DynamicCatalogBundle {
  return crawlDynamicLooksDirectory();
}
