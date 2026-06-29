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

function isItemsFile(fileName: string): boolean {
  return fileName.endsWith("-items.json");
}

function isLookProfileFile(fileName: string): boolean {
  return fileName.endsWith(".json") && !isItemsFile(fileName);
}

function readJsonFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as unknown;
}

export function crawlDynamicLooksDirectory(
  directory = DYNAMIC_LOOKS_DIR,
): DynamicCatalogBundle {
  if (!fs.existsSync(directory)) {
    return EMPTY_DYNAMIC_CATALOG;
  }

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
        const { look, canvasLayouts, homepageOrder } = parseDynamicLookPayload(
          readJsonFile(filePath),
          label,
        );

        if (!look) continue;

        lookBundles.push({
          ...EMPTY_DYNAMIC_CATALOG,
          looks: [look],
          lookOrderAdditions: [{ id: look.id, placement: homepageOrder }],
          canvasLayoutsByLookId: {
            [look.id]: canvasLayouts,
          },
        });
      }
    } catch (error) {
      console.warn(`[dynamic-looks] Failed to parse ${label}:`, error);
    }
  }

  return finalizeDynamicCatalog(
    mergeDynamicCatalogBundles(...itemBundles, ...lookBundles),
  );
}

export function loadDynamicLooksFromDisk(): DynamicCatalogBundle {
  return crawlDynamicLooksDirectory();
}
