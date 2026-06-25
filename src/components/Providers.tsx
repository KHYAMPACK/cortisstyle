"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/AppShell";
import { IntroLoader } from "@/components/IntroLoader";
import { isMaintenancePath } from "@/lib/launchGates";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showIntroLoader = !isMaintenancePath(pathname);

  return (
    <AuthProvider>
      {showIntroLoader ? <IntroLoader /> : null}
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
