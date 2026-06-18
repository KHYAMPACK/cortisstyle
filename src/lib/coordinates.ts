export function parsePercent(value: string): number {
  return Number.parseFloat(value.replace("%", ""));
}

export function toPercentString(value: number): string {
  const clamped = Math.min(100, Math.max(0, value));
  return `${clamped.toFixed(1)}%`;
}

export function pointFromClient(
  rect: DOMRect,
  clientX: number,
  clientY: number,
): { top: string; left: string } {
  const left = ((clientX - rect.left) / rect.width) * 100;
  const top = ((clientY - rect.top) / rect.height) * 100;

  return {
    top: toPercentString(top),
    left: toPercentString(left),
  };
}
