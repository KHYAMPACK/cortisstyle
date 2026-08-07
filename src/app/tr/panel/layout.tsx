import type { Metadata, Viewport } from "next";

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
  themeColor: "#C2185B",
};

export default function TrPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="tr-owner-panel min-h-dvh text-neutral-900 antialiased"
      style={{
        backgroundColor: "var(--panel-accent-softer, #FFF5F8)",
      }}
    >
      {children}
    </div>
  );
}
