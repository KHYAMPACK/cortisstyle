/**
 * Re-mounts on every panel navigation (unlike the layout), which is exactly what
 * replays the page-enter fade. It is a short opacity fade — no exit animation and
 * no waiting for one — so the new page is on screen immediately. Opacity only:
 * a transform here would break `position: sticky` descendants (list filters).
 */
export default function TrPanelTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="tr-panel-enter">{children}</div>;
}
