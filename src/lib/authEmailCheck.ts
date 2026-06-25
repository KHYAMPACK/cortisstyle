function isAlreadyRegisteredError(message: string, code?: string): boolean {
  const normalized = message.toLowerCase();
  return (
    code === "user_already_exists" ||
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already exists")
  );
}

export async function checkEmailExists(email: string): Promise<{
  exists: boolean;
  signUpDispatched?: boolean;
}> {
  const response = await fetch("/api/auth/check-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    exists?: boolean;
    error?: string;
    fallback?: boolean;
  };

  if (response.ok) {
    return { exists: Boolean(body.exists) };
  }

  if (response.status === 503 && body.fallback) {
    return probeEmailExistsViaSignUp(email);
  }

  throw new Error(body.error ?? "Unable to verify email address.");
}

async function probeEmailExistsViaSignUp(
  email: string,
): Promise<{ exists: boolean; signUpDispatched?: boolean }> {
  const { getSupabaseClient } = await import("@/lib/supabaseClient");
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email,
    password: crypto.randomUUID(),
  });

  if (!error) {
    return { exists: false, signUpDispatched: true };
  }

  if (isAlreadyRegisteredError(error.message, error.code)) {
    return { exists: true };
  }

  throw new Error(error.message);
}
