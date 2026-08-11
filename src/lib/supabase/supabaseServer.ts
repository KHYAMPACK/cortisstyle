import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase clients for RSC / route handlers.
 * Never reuse the browser cookie client for public catalog reads —
 * and never let a bad service-role key take down anon-safe views.
 */

const NO_STORE_FETCH: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });

let cachedAnon: SupabaseClient | null | undefined;
let cachedService: SupabaseClient | null | undefined;

function createServerClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: NO_STORE_FETCH },
  });
}

/** Anon key, no cookie storage — safe for public views on the server. */
export function getServerAnonSupabase(): SupabaseClient | null {
  if (cachedAnon !== undefined) return cachedAnon;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    cachedAnon = null;
    return null;
  }

  cachedAnon = createServerClient(url, anonKey);
  return cachedAnon;
}

/** Service role for admin / owner mutations (and privileged reads). */
export function getServerServiceSupabase(): SupabaseClient | null {
  if (cachedService !== undefined) return cachedService;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    cachedService = null;
    return null;
  }

  cachedService = createServerClient(url, serviceKey);
  return cachedService;
}

/**
 * Client for `tr_boutiques_public` / other anon-granted reads.
 * Prefer anon so a rotated/mismatched service-role secret cannot 404 storefronts.
 */
export function getPublicCatalogSupabase(
  client?: SupabaseClient,
): SupabaseClient {
  if (client) return client;
  const anon = getServerAnonSupabase();
  if (anon) return anon;
  const service = getServerServiceSupabase();
  if (service) return service;
  throw new Error(
    "Supabase is not configured for public catalog reads (need NEXT_PUBLIC_SUPABASE_URL + ANON or SERVICE_ROLE).",
  );
}

export function getSupabaseHostLabel(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}
