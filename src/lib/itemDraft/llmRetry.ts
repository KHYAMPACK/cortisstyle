export function isRetryableLlmError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const cause =
    error instanceof Error && error.cause instanceof Error
      ? error.cause.message
      : "";
  const combined = `${message} ${cause}`.toLowerCase();
  return (
    combined.includes("fetch failed") ||
    combined.includes("econnreset") ||
    combined.includes("etimedout") ||
    combined.includes("socket hang up") ||
    combined.includes("network") ||
    combined.includes("aborted")
  );
}

export function formatLlmError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause =
    error.cause instanceof Error
      ? ` (${error.cause.message})`
      : error.cause
        ? ` (${String(error.cause)})`
        : "";
  return `${error.message}${cause}`;
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withLlmRetries<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts && isRetryableLlmError(error)) {
        const waitMs = attempt * 1500;
        console.warn(
          `[item-draft] ${label} attempt ${attempt}/${attempts} failed (${formatLlmError(error)}). Retrying in ${waitMs}ms...`,
        );
        await sleep(waitMs);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
