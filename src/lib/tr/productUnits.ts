import type { TrUnitPrice, TrUnitType } from "@/types/tr-marketplace";

/**
 * Units for "Birim fiyat". A product says how much it contains (500 g); the unit price
 * is the price of one reference unit (per kg), the way Turkish retail shows it.
 */
interface UnitDefinition {
  id: TrUnitType;
  /** Label in the unit dropdown. */
  label: string;
  /** Short symbol, as in "₺120 / kg". */
  symbol: string;
  /** The unit the price is quoted per. */
  reference: TrUnitType;
  /** How many of this unit make one reference unit. */
  perReference: number;
}

export const UNIT_TYPES: readonly UnitDefinition[] = [
  { id: "g", label: "Gram (g)", symbol: "g", reference: "kg", perReference: 1000 },
  { id: "kg", label: "Kilogram (kg)", symbol: "kg", reference: "kg", perReference: 1 },
  { id: "ml", label: "Mililitre (ml)", symbol: "ml", reference: "l", perReference: 1000 },
  { id: "l", label: "Litre (l)", symbol: "l", reference: "l", perReference: 1 },
  { id: "cm", label: "Santimetre (cm)", symbol: "cm", reference: "m", perReference: 100 },
  { id: "m", label: "Metre (m)", symbol: "m", reference: "m", perReference: 1 },
  { id: "m2", label: "Metrekare (m²)", symbol: "m²", reference: "m2", perReference: 1 },
  { id: "adet", label: "Adet", symbol: "adet", reference: "adet", perReference: 1 },
];

export const UNIT_AMOUNT_MAX = 1_000_000;

export function isUnitType(value: unknown): value is TrUnitType {
  return UNIT_TYPES.some((unit) => unit.id === value);
}

function unitDefinition(type: TrUnitType): UnitDefinition {
  return UNIT_TYPES.find((unit) => unit.id === type)!;
}

export function unitSymbol(type: TrUnitType): string {
  return unitDefinition(type).symbol;
}

/**
 * Price of one reference unit (per kg, l, m…) in kuruş, or `null` when the unit
 * price is off or incomplete. Example: 25 000 kuruş for 500 g → 50 000 per kg.
 */
export function unitPricePerReference(
  priceKurus: number,
  unitPrice: TrUnitPrice | null | undefined,
): { perKurus: number; symbol: string } | null {
  if (!unitPrice?.enabled) return null;
  const { amount, type } = unitPrice;
  if (!type || amount === null || !(amount > 0)) return null;

  const unit = unitDefinition(type);
  const referenceAmount = amount / unit.perReference;
  return {
    perKurus: Math.round(priceKurus / referenceAmount),
    symbol: unitSymbol(unit.reference),
  };
}
