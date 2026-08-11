"use client";

/**
 * Root chrome for non-TR routes (auth, privacy/terms, maintenance).
 * TR marketplace and boutique layouts own their own header/footer.
 */
export function AppShell({
  children,
}: {
  children: React.ReactNode;
  boutiqueSlug?: string | null;
}) {
  return <>{children}</>;
}
