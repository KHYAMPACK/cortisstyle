const STORAGE_PREFIX = "tr-scroll:";
const CAN_BACK_KEY = "tr-can-back";

function scrollKey(pathname: string): string {
  const path = pathname.replace(/\/$/, "") || "/";
  return `${STORAGE_PREFIX}${path}`;
}

export function writeTrScroll(pathname: string, y: number): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(scrollKey(pathname), String(Math.max(0, Math.round(y))));
  } catch {
    // private mode / quota
  }
}

export function readTrScroll(pathname: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(scrollKey(pathname));
    if (raw == null) return null;
    const y = Number(raw);
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

/** Mark that the user navigated within /tr this session (enables safe back). */
export function markTrCanGoBack(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CAN_BACK_KEY, "1");
  } catch {
    // ignore
  }
}

export function trCanGoBack(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(CAN_BACK_KEY) === "1";
  } catch {
    return false;
  }
}
