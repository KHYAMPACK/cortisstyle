const TTL_MS = 20_000;

const memory = new Map<string, { at: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
const generation = new Map<string, number>();

function matchesPrefix(key: string, prefix: string): boolean {
  return (
    key === prefix || key.startsWith(`${prefix}:`) || key.startsWith(prefix)
  );
}

function bumpGeneration(key: string): void {
  generation.set(key, (generation.get(key) ?? 0) + 1);
}

export function peekOwnerCache<T>(key: string): T | undefined {
  const hit = memory.get(key);
  if (!hit) return undefined;
  return hit.data as T;
}

export function invalidateOwnerCache(prefix: string): void {
  for (const key of [...memory.keys()]) {
    if (matchesPrefix(key, prefix)) memory.delete(key);
  }
  for (const key of [...inflight.keys()]) {
    if (matchesPrefix(key, prefix)) {
      inflight.delete(key);
      bumpGeneration(key);
    }
  }
}

export function cacheOwnerValue<T>(key: string, data: T): T {
  memory.set(key, { at: Date.now(), data });
  return data;
}

export function cachedOwnerFetch<T>(
  key: string,
  load: () => Promise<T>,
  ttlMs = TTL_MS,
): Promise<T> {
  const hit = memory.get(key);
  if (hit && Date.now() - hit.at < ttlMs) {
    return Promise.resolve(hit.data as T);
  }
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const gen = generation.get(key) ?? 0;
  const promise = load()
    .then((data) => {
      if (inflight.get(key) === promise) inflight.delete(key);
      if ((generation.get(key) ?? 0) === gen) {
        memory.set(key, { at: Date.now(), data });
      }
      return data;
    })
    .catch((error: unknown) => {
      if (inflight.get(key) === promise) inflight.delete(key);
      throw error;
    });
  inflight.set(key, promise);
  return promise;
}

export const ownerCacheKeys = {
  boutiques: "boutiques",
  products: (boutiqueId: string) => `products:${boutiqueId}`,
  productOriginals: (boutiqueId: string) => `product-originals:${boutiqueId}`,
  categories: (boutiqueId: string) => `categories:${boutiqueId}`,
  productFacets: (boutiqueId: string) => `product-facets:${boutiqueId}`,
  variantTypes: (boutiqueId: string) => `variant-types:${boutiqueId}`,
  orders: (boutiqueId: string) => `orders:${boutiqueId}`,
  summary: (boutiqueId: string, range: string) =>
    `summary:${boutiqueId}:${range}`,
  dashboard: (boutiqueId: string, range: string, from = "", to = "") =>
    `dashboard:${boutiqueId}:${range}:${from}:${to}`,
  credits: (boutiqueId: string) => `credits:${boutiqueId}`,
  customers: (boutiqueId: string) => `customers:${boutiqueId}`,
  discounts: (boutiqueId: string) => `discounts:${boutiqueId}`,
  invoices: (boutiqueId: string) => `invoices:${boutiqueId}`,
  settings: (boutiqueId: string) => `settings:${boutiqueId}`,
};
