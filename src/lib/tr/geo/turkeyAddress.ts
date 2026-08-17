import rawCities from "@/data/tr/turkey-cities-districts.json";

type RawCity = {
  province: string;
  districts: Array<{ id: number; name: string }>;
};

const CITY_ROWS: RawCity[] = Object.values(rawCities as Record<string, RawCity>);

function fold(value: string): string {
  return value.trim().toLocaleUpperCase("tr-TR");
}

const CITIES = CITY_ROWS.map((row) => row.province).sort((a, b) =>
  a.localeCompare(b, "tr"),
);

const DISTRICTS_BY_CITY = new Map<string, string[]>();
const CITY_BY_FOLD = new Map<string, string>();

for (const row of CITY_ROWS) {
  CITY_BY_FOLD.set(fold(row.province), row.province);
  const districts = row.districts
    .map((entry) => entry.name.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "tr"));
  DISTRICTS_BY_CITY.set(row.province, districts);
}

export function listTurkeyCities(): string[] {
  return CITIES;
}

export function listTurkeyDistricts(city: string): string[] {
  const canonical = CITY_BY_FOLD.get(fold(city));
  if (!canonical) return [];
  return DISTRICTS_BY_CITY.get(canonical) ?? [];
}

export function canonicalTurkeyCity(city: string): string | null {
  return CITY_BY_FOLD.get(fold(city)) ?? null;
}

export function canonicalTurkeyDistrict(
  city: string,
  district: string,
): string | null {
  const canonicalCity = canonicalTurkeyCity(city);
  if (!canonicalCity) return null;
  const needle = fold(district);
  return (
    (DISTRICTS_BY_CITY.get(canonicalCity) ?? []).find(
      (name) => fold(name) === needle,
    ) ?? null
  );
}

const STREET_MIN = 8;

export function validateTurkeyStreetLine(line1: string): string | null {
  const trimmed = line1.trim();
  if (trimmed.length < STREET_MIN) {
    return "Mahalle, sokak ve bina no yazın.";
  }
  if (/https?:\/\//i.test(trimmed) || /\S+@\S+/.test(trimmed)) {
    return "Geçerli bir teslimat adresi yazın.";
  }
  return null;
}

export function validateTurkeyPostalCode(postalCode: string): string | null {
  if (!/^\d{5}$/.test(postalCode.trim())) {
    return "Posta kodu 5 haneli olmalıdır.";
  }
  return null;
}

export type TurkeyAddressFields = {
  line1: string;
  line2?: string;
  city: string;
  district: string;
  postalCode: string;
  country?: string;
};

/** Canonical TR address or a Turkish error. Client picker is not enough — call this on checkout POST. */
export function validateTurkeyShippingAddress(
  input: TurkeyAddressFields,
):
  | { ok: true; address: TurkeyAddressFields }
  | { ok: false; error: string } {
  const country = (input.country ?? "TR").trim().toUpperCase() || "TR";
  if (country !== "TR") {
    return { ok: false, error: "Şu an yalnızca Türkiye teslimatı var." };
  }

  const city = canonicalTurkeyCity(input.city);
  if (!city) {
    return { ok: false, error: "İl listeden seçilmelidir." };
  }
  const district = canonicalTurkeyDistrict(city, input.district);
  if (!district) {
    return { ok: false, error: "İlçe listeden seçilmelidir." };
  }
  const streetError = validateTurkeyStreetLine(input.line1);
  if (streetError) return { ok: false, error: streetError };
  const postalError = validateTurkeyPostalCode(input.postalCode);
  if (postalError) return { ok: false, error: postalError };

  const line2 = input.line2?.trim() || undefined;
  return {
    ok: true,
    address: {
      line1: input.line1.trim(),
      line2,
      city,
      district,
      postalCode: input.postalCode.trim(),
      country: "TR",
    },
  };
}
