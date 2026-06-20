"use client";

import { SiteHeader } from "@/components/SiteHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="pt-20">{children}</div>
    </>
  );
}
