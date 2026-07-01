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
} from "@/lib/dynamicLooks/types";

export const DYNAMIC_LOOKS_DIR = path.join(
  process.cwd(),
  "src/data/dynamic-looks",
);

const HOMEPAGE_ORDER_FILE = "homepage-order.json";

function isItemsFile(fileName: string): boolean {
  return fileName.endsWith("-items.json");
}

function isLookProfileFile(fileName: string): boolean {
  return (
    fileName.endsWith(".json") &&
    !isItemsFile(fileName) &&
    fileName !== HOMEPAGE_ORDER_FILE
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

export function crawlDynamicLooksDirectory(
  directory = DYNAMIC_LOOKS_DIR,
): DynamicCatalogBundle {
  if (!fs.existsSync(directory)) {
    return EMPTY_DYNAMIC_CATALOG;
  }

  const homepageOrder = loadHomepageOrder(directory);
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

  return homepageOrder ? { ...merged, homepageOrder } : merged;
}

export function loadDynamicLooksFromDisk(): DynamicCatalogBundle {
  return crawlDynamicLooksDirectory();
}
