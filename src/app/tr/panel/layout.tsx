import type { Metadata, Viewport } from "next";
import { TrPanelShell } from "@/components/tr/panel/TrPanelShell";
import { TrPanelSwBridge } from "@/components/tr/panel/TrPanelSwBridge";
import { PANEL_CANVAS } from "@/lib/tr/panel/panelTheme";

export const metadata: Metadata = {
  title: {
    default: "Butik paneli",
    template: "%s · Butik paneli",
  },
  applicationName: "Butik Paneli",
  manifest: "/tr-panel/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Butik Paneli",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/brand/cortisstyle-favicon.png",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1C1C1E",
};

export default function TrPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="tr-owner-panel min-h-dvh bg-[#F2F3F5] text-neutral-900 antialiased"
      style={{
        backgroundColor: PANEL_CANVAS,
      }}
    >
      <TrPanelSwBridge />
      <TrPanelShell>{children}</TrPanelShell>
    </div>
  );
}
