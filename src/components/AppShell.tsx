"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { isWardrobeComingSoonPath } from "@/lib/wardrobeGate";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isComingSoon = isWardrobeComingSoonPath(pathname);

  return (
    <>
      <SiteHeader />
      <div className={isHome || isComingSoon ? "" : "pt-20"}>{children}</div>
    </>
  );
}
