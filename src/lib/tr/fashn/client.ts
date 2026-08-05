/**
 * FASHN API client — universal /v1/run + /v1/status polling.
 * @see https://docs.fashn.ai/api-overview/api-fundamentals
 */

const FASHN_API_BASE = "https://api.fashn.ai/v1";

export type FashnGenerationMode = "fast" | "balanced" | "quality";
export type FashnResolution = "1k" | "2k" | "4k";

export type FashnRunStatus =
  | "starting"
  | "in_queue"
  | "processing"
  | "completed"
  | "failed";

export interface FashnRunResult {
  predictionId: string;
  status: FashnRunStatus;
  outputUrls: string[];
  creditsUsed: number | null;
  error: string | null;
}

function getFashnApiKey(): string | null {
  const key = process.env.FASHN_API_KEY?.trim();
  return key || null;
}

export function isFashnConfigured(): boolean {
  return Boolean(getFashnApiKey());
}

export function getFashnDefaultResolution(): FashnResolution {
  const raw = process.env.FASHN_DEFAULT_RESOLUTION?.trim().toLowerCase();
  if (raw === "2k" || raw === "4k" || raw === "1k") return raw;
  return "1k";
}

export function getFashnDefaultMode(): FashnGenerationMode {
  const raw = process.env.FASHN_DEFAULT_MODE?.trim().toLowerCase();
  if (raw === "fast" || raw === "quality" || raw === "balanced") return raw;
  return "balanced";
}

function authHeaders(): HeadersInit {
  const key = getFashnApiKey();
  if (!key) {
    throw new Error("FASHN_API_KEY is not configured.");
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function parseCreditsUsed(response: Response): number | null {
  const header = response.headers.get("x-fashn-credits-used");
  if (!header) return null;
  const n = Number(header);
  return Number.isFinite(n) ? n : null;
}

export async function fashnRun(params: {
  modelName: string;
  inputs: Record<string, unknown>;
}): Promise<{ predictionId: string }> {
  const response = await fetch(`${FASHN_API_BASE}/run`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      model_name: params.modelName,
      inputs: params.inputs,
    }),
  });

  const body = (await response.json().catch(() => null)) as {
    id?: string;
    error?: string | { name?: string; message?: string };
    message?: string;
  } | null;

  if (!response.ok) {
    const detail =
      typeof body?.error === "object" && body.error
        ? JSON.stringify(body.error)
        : typeof body?.error === "string"
          ? body.error
          : body?.message;
    const message =
      detail || `FASHN run failed (${response.status})`;
    console.error("[fashn] run failed:", response.status, body);
    throw new Error(message);
  }

  const predictionId = body?.id?.trim();
  if (!predictionId) {
    throw new Error("FASHN run did not return a prediction id.");
  }

  return { predictionId };
}

export async function fashnStatus(
  predictionId: string,
): Promise<FashnRunResult> {
  const response = await fetch(
    `${FASHN_API_BASE}/status/${encodeURIComponent(predictionId)}`,
    {
      method: "GET",
      headers: authHeaders(),
    },
  );

  const creditsUsed = parseCreditsUsed(response);
  const body = (await response.json().catch(() => null)) as {
    id?: string;
    status?: FashnRunStatus;
    output?: string[];
    error?: string | { name?: string; message?: string } | null;
  } | null;

  if (!response.ok) {
    const message =
      (typeof body?.error === "string" ? body.error : body?.error?.message) ||
      `FASHN status failed (${response.status})`;
    throw new Error(message);
  }

  const status = body?.status ?? "failed";
  const errorMessage =
    typeof body?.error === "string"
      ? body.error
      : body?.error?.message?.trim() || null;

  return {
    predictionId: body?.id ?? predictionId,
    status,
    outputUrls: Array.isArray(body?.output)
      ? body.output.filter((url): url is string => Boolean(url?.trim()))
      : [],
    creditsUsed,
    error: status === "failed" ? errorMessage || "FASHN generation failed." : null,
  };
}

export async function fashnRunAndWait(params: {
  modelName: string;
  inputs: Record<string, unknown>;
  /** Max wall time for polling (ms). */
  timeoutMs?: number;
  pollIntervalMs?: number;
}): Promise<FashnRunResult> {
  const timeoutMs = params.timeoutMs ?? 180_000;
  const pollIntervalMs = params.pollIntervalMs ?? 2_000;
  const { predictionId } = await fashnRun({
    modelName: params.modelName,
    inputs: params.inputs,
  });

  const started = Date.now();
  let last: FashnRunResult = {
    predictionId,
    status: "starting",
    outputUrls: [],
    creditsUsed: null,
    error: null,
  };

  while (Date.now() - started < timeoutMs) {
    last = await fashnStatus(predictionId);
    if (last.status === "completed" || last.status === "failed") {
      return last;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return {
    ...last,
    status: "failed",
    error: last.error ?? "FASHN generation timed out.",
  };
}
