/**
 * Fan-out concurrent PATCHes for panel bulk ops (no bulk API).
 */

export interface OwnerBulkResult<T> {
  ok: T[];
  failed: Array<{ id: string; error: string }>;
}

export async function runOwnerPatches<T>(
  ids: string[],
  patchFn: (id: string) => Promise<T>,
  options?: { concurrency?: number },
): Promise<OwnerBulkResult<T>> {
  const concurrency = Math.max(1, options?.concurrency ?? 4);
  const ok: T[] = [];
  const failed: Array<{ id: string; error: string }> = [];
  let index = 0;

  async function worker() {
    while (index < ids.length) {
      const current = index;
      index += 1;
      const id = ids[current];
      if (!id) continue;
      try {
        const result = await patchFn(id);
        ok.push(result);
      } catch (error) {
        failed.push({
          id,
          error: error instanceof Error ? error.message : "Güncellenemedi.",
        });
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, ids.length) },
    () => worker(),
  );
  await Promise.all(workers);

  return { ok, failed };
}
