"use client";

import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/AppShell";
import { IntroLoader } from "@/components/IntroLoader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <IntroLoader />
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
