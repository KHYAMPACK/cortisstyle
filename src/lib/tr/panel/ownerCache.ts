const TTL_MS = 20_000;

const memory = new Map<string, { at: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

export function peekOwnerCache<T>(key: string): T | undefined {
  const hit = memory.get(key);
  if (!hit) return undefined;
  return hit.data as T;
}

export function invalidateOwnerCache(prefix: string): void {
  for (const key of [...memory.keys()]) {
    if (key === prefix || key.startsWith(`${prefix}:`) || key.startsWith(prefix)) {
      memory.delete(key);
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

  const promise = load()
    .then((data) => {
      memory.set(key, { at: Date.now(), data });
      inflight.delete(key);
      return data;
    })
    .catch((error: unknown) => {
      inflight.delete(key);
      throw error;
    });
  inflight.set(key, promise);
  return promise;
}

export const ownerCacheKeys = {
  boutiques: "boutiques",
  products: (boutiqueId: string) => `products:${boutiqueId}`,
  orders: (boutiqueId: string) => `orders:${boutiqueId}`,
  summary: (boutiqueId: string, range: string) =>
    `summary:${boutiqueId}:${range}`,
  credits: (boutiqueId: string) => `credits:${boutiqueId}`,
  customers: (boutiqueId: string) => `customers:${boutiqueId}`,
  discounts: (boutiqueId: string) => `discounts:${boutiqueId}`,
  invoices: (boutiqueId: string) => `invoices:${boutiqueId}`,
  settings: (boutiqueId: string) => `settings:${boutiqueId}`,
};
