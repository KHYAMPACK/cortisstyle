/**
 * Reading and showing the lira amounts an owner types. Turkish habits: a comma is the
 * decimal mark ("12,50") and a dot separates thousands ("1.250,50"); "1250.50" and
 * "₺75" are understood too. Amounts are whole kuruş. Pure.
 */

/** Lira text → kuruş, or null when it is not an amount. Zero is a valid amount. */
export function parseLiraInput(text: string): number | null {
  const value = text.replace(/\s|₺|tl/gi, "");
  if (!value || !/^[\d.,]+$/.test(value) || !/\d/.test(value)) return null;

  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");

  let decimalAt = -1;
  if (lastComma >= 0 && lastDot >= 0) {
    // Both present: whichever comes last is the decimal mark, the other groups thousands.
    decimalAt = Math.max(lastComma, lastDot);
  } else if (lastComma >= 0) {
    decimalAt = lastComma;
  } else if (lastDot >= 0) {
    // A lone dot is decimal ("12.5", "1250.50") unless it groups exactly three digits ("1.250").
    const afterDot = value.length - lastDot - 1;
    const single = value.indexOf(".") === lastDot;
    decimalAt = single && afterDot !== 3 ? lastDot : -1;
  }

  // The decimal mark can only appear once ("1,2,3" means nothing).
  if (decimalAt >= 0 && value.split(value[decimalAt]!).length > 2) return null;

  const whole = (decimalAt >= 0 ? value.slice(0, decimalAt) : value).replace(/[.,]/g, "");
  const fraction = decimalAt >= 0 ? value.slice(decimalAt + 1) : "";
  if (/[.,]/.test(fraction) || fraction.length > 2) return null;
  if (!/^\d*$/.test(whole) || !/^\d*$/.test(fraction)) return null;
  if (whole === "" && fraction === "") return null;

  const kurus = Number(whole || "0") * 100 + Number(fraction.padEnd(2, "0") || "0");
  return Number.isSafeInteger(kurus) ? kurus : null;
}

/** Kuruş → the text to prefill an input with: "125" or "125,50" (no currency sign, no grouping). */
export function formatLiraInput(kurus: number): string {
  const whole = Math.floor(kurus / 100);
  const rest = kurus % 100;
  return rest === 0 ? String(whole) : `${whole},${String(rest).padStart(2, "0")}`;
}
