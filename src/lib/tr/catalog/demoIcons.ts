export const TR_DEMO_ICON_PREFIX = "demo-icon:";

export type TrDemoGarmentKind =
  | "look"
  | "top"
  | "bottom"
  | "dress"
  | "outerwear"
  | "shoe"
  | "bag";

export function demoIconSrc(kind: TrDemoGarmentKind): string {
  return `${TR_DEMO_ICON_PREFIX}${kind}`;
}

export function isTrDemoIconSrc(src: string | null | undefined): boolean {
  return Boolean(src?.startsWith(TR_DEMO_ICON_PREFIX));
}

export function parseTrDemoGarmentKind(
  src: string | null | undefined,
): TrDemoGarmentKind | null {
  if (!src?.startsWith(TR_DEMO_ICON_PREFIX)) return null;
  const kind = src.slice(TR_DEMO_ICON_PREFIX.length) as TrDemoGarmentKind;
  switch (kind) {
    case "look":
    case "top":
    case "bottom":
    case "dress":
    case "outerwear":
    case "shoe":
    case "bag":
      return kind;
    default:
      return "look";
  }
}
