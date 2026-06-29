const DEFAULT_STUDIO_ORIGINS = [
  "https://studio.cortisstyle.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function allowedStudioOrigins(): Set<string> {
  const configured = process.env.NEXT_PUBLIC_STUDIO_URL?.trim();
  const origins = new Set(DEFAULT_STUDIO_ORIGINS);

  if (configured) {
    origins.add(configured.replace(/\/$/, ""));
  }

  return origins;
}

export function isAllowedStudioOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return allowedStudioOrigins().has(origin);
}

export function studioCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    Vary: "Origin",
  };

  if (origin && isAllowedStudioOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

export function handleStudioPreflight(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;

  return new Response(null, {
    status: 204,
    headers: studioCorsHeaders(request),
  });
}

export function withStudioCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  const cors = studioCorsHeaders(request);

  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function studioRoute(
  request: Request,
  handler: () => Promise<Response>,
): Promise<Response> {
  const preflight = handleStudioPreflight(request);
  if (preflight) return preflight;

  const response = await handler();
  return withStudioCors(request, response);
}
