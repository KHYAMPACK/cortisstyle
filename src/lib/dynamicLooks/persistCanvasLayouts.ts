import { promises as fs } from "fs";
import path from "path";
import type { CanvasItemLayout } from "@/types/canvas-layout";
import { DYNAMIC_LOOKS_DIR } from "@/lib/dynamicLooks/loadFromDisk";

const LOOK_PROFILE_SKIP = new Set(["homepage-order.json"]);

function isLookProfileFile(fileName: string): boolean {
  return (
    fileName.endsWith(".json") &&
    !fileName.endsWith("-items.json") &&
    !LOOK_PROFILE_SKIP.has(fileName)
  );
}

export async function findDynamicLookFile(lookId: string): Promise<string | null> {
  let entries: string[];

  try {
    entries = await fs.readdir(DYNAMIC_LOOKS_DIR);
  } catch {
    return null;
  }

  for (const fileName of entries) {
    if (!isLookProfileFile(fileName)) continue;

    const filePath = path.join(DYNAMIC_LOOKS_DIR, fileName);
    const raw = JSON.parse(await fs.readFile(filePath, "utf8")) as {
      id?: string;
    };

    if (raw.id === lookId) {
      return filePath;
    }
  }

  return null;
}

export async function persistCanvasLayoutsForLook(
  lookId: string,
  layouts: Record<string, CanvasItemLayout>,
): Promise<string | null> {
  const filePath = await findDynamicLookFile(lookId);
  if (!filePath) return null;

  const raw = JSON.parse(await fs.readFile(filePath, "utf8")) as Record<
    string,
    unknown
  >;
  raw.canvasLayouts = layouts;

  await fs.writeFile(filePath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");

  return path
    .relative(process.cwd(), filePath)
    .split(path.sep)
    .join("/");
}
