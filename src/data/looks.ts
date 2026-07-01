import {
  buildLooksById,
  getDynamicCatalog,
  resolveLooksStream,
} from "@/lib/dynamicLooks/registry";
import type { Look } from "@/types/look";

let looksCache: Look[] | null = null;

function resolveLooks(): Look[] {
  const dynamic = getDynamicCatalog();
  const looksById = buildLooksById([], dynamic.looks);

  if (dynamic.homepageOrder?.length) {
    return resolveLooksStream(dynamic.homepageOrder, looksById);
  }

  const order = dynamic.lookOrderAdditions.flatMap((entry) => {
    if (entry.placement === "prepend") return [entry.id];
    return [];
  });

  for (const look of dynamic.looks) {
    if (!order.includes(look.id)) {
      order.push(look.id);
    }
  }

  return resolveLooksStream(order, looksById);
}

/** Rebuild look stream after server-side disk crawl (see buildCatalogFromDisk). */
export function refreshLooksRegistry(): void {
  looksCache = null;
}

/** Homepage + modal look stream from src/data/dynamic-looks/. */
export function getLooks(): Look[] {
  if (!looksCache) {
    looksCache = resolveLooks();
  }

  return looksCache;
}
