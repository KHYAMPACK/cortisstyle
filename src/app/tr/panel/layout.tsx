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
