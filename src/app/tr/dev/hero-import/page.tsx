import { notFound } from "next/navigation";
import { TrHeroImportPanel } from "@/components/tr/dev/TrHeroImportPanel";
import { isLocalDevProcess } from "@/lib/tr/localDev";

export const metadata = {
  title: "Hero slot import (local)",
  robots: { index: false, follow: false },
};

export default function TrDevHeroImportPage() {
  if (!isLocalDevProcess()) {
    notFound();
  }

  return <TrHeroImportPanel />;
}
