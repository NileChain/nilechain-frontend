/**
 * Egypt governorate centroids + nearest-match helpers.
 * Canonical English names match register / farm profile / seeder.
 */

export interface EgyptGovernorate {
  /** English name stored in DB (e.g. "Sharqia") */
  name: string;
  /** Arabic display label */
  nameAr: string;
  latitude: number;
  longitude: number;
}

/** Country overview center used by map pickers. */
export const EGYPT_MAP_CENTER: [number, number] = [26.8, 30.8];
export const EGYPT_MAP_ZOOM = 6;

/**
 * Full 27-governorate set with approximate centroids.
 * Aliases (assiut/asyut, fayoum/faiyum) are resolved via {@link findGovernorateByName}.
 */
export const EGYPT_GOVERNORATES: readonly EgyptGovernorate[] = [
  { name: 'Alexandria', nameAr: 'الإسكندرية', latitude: 31.2001, longitude: 29.9187 },
  { name: 'Aswan', nameAr: 'أسوان', latitude: 24.0889, longitude: 32.8998 },
  { name: 'Asyut', nameAr: 'أسيوط', latitude: 27.1809, longitude: 31.1837 },
  { name: 'Beheira', nameAr: 'البحيرة', latitude: 30.8481, longitude: 30.3436 },
  { name: 'Beni Suef', nameAr: 'بني سويف', latitude: 28.349, longitude: 30.87 },
  { name: 'Cairo', nameAr: 'القاهرة', latitude: 30.0444, longitude: 31.2357 },
  { name: 'Dakahlia', nameAr: 'الدقهلية', latitude: 31.0409, longitude: 31.3785 },
  { name: 'Damietta', nameAr: 'دمياط', latitude: 31.4175, longitude: 31.8144 },
  { name: 'Faiyum', nameAr: 'الفيوم', latitude: 29.3084, longitude: 30.8428 },
  { name: 'Gharbia', nameAr: 'الغربية', latitude: 30.8754, longitude: 31.0335 },
  { name: 'Giza', nameAr: 'الجيزة', latitude: 30.0131, longitude: 31.2089 },
  { name: 'Ismailia', nameAr: 'الإسماعيلية', latitude: 30.5965, longitude: 32.2715 },
  { name: 'Kafr El Sheikh', nameAr: 'كفر الشيخ', latitude: 31.1107, longitude: 30.9388 },
  { name: 'Luxor', nameAr: 'الأقصر', latitude: 25.6872, longitude: 32.6396 },
  { name: 'Matrouh', nameAr: 'مطروح', latitude: 31.3543, longitude: 27.2373 },
  { name: 'Minya', nameAr: 'المنيا', latitude: 28.1099, longitude: 30.7503 },
  { name: 'Monufia', nameAr: 'المنوفية', latitude: 30.5972, longitude: 30.9876 },
  { name: 'New Valley', nameAr: 'الوادي الجديد', latitude: 25.4517, longitude: 30.5463 },
  { name: 'North Sinai', nameAr: 'شمال سيناء', latitude: 30.2824, longitude: 33.6176 },
  { name: 'Port Said', nameAr: 'بورسعيد', latitude: 31.2653, longitude: 32.3019 },
  { name: 'Qalyubia', nameAr: 'القليوبية', latitude: 30.329, longitude: 31.22 },
  { name: 'Qena', nameAr: 'قنا', latitude: 26.1551, longitude: 32.716 },
  { name: 'Red Sea', nameAr: 'البحر الأحمر', latitude: 26.2541, longitude: 33.8116 },
  { name: 'Sharqia', nameAr: 'الشرقية', latitude: 30.7327, longitude: 31.7195 },
  { name: 'Sohag', nameAr: 'سوهاج', latitude: 26.559, longitude: 31.6956 },
  { name: 'South Sinai', nameAr: 'جنوب سيناء', latitude: 28.234, longitude: 33.622 },
  { name: 'Suez', nameAr: 'السويس', latitude: 29.9668, longitude: 32.5498 },
] as const;

export interface PickedLocation {
  latitude: number;
  longitude: number;
  governorate: string;
  governorateAr: string;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

/** Nearest governorate centroid for a map click / drag. */
export function nearestGovernorate(
  latitude: number,
  longitude: number
): EgyptGovernorate {
  let best = EGYPT_GOVERNORATES[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const g of EGYPT_GOVERNORATES) {
    const d = haversineKm(latitude, longitude, g.latitude, g.longitude);
    if (d < bestDist) {
      bestDist = d;
      best = g;
    }
  }
  return best;
}

export function governorateLabel(
  name: string | null | undefined,
  locale: 'ar' | 'en'
): string {
  if (!name?.trim()) {
    return name ?? '';
  }
  const found = findGovernorateByName(name);
  if (!found) {
    return name;
  }
  return locale === 'ar' ? found.nameAr : found.name;
}

export function findGovernorateByName(
  name: string | null | undefined
): EgyptGovernorate | null {
  if (!name?.trim()) {
    return null;
  }
  const key = name.toLowerCase().trim();
  const exact = EGYPT_GOVERNORATES.find((g) => g.name.toLowerCase() === key);
  if (exact) {
    return exact;
  }
  // Substring / alias match (legacy map keys + Arabic).
  const aliases: Record<string, string> = {
    alex: 'Alexandria',
    assiut: 'Asyut',
    asyut: 'Asyut',
    fayoum: 'Faiyum',
    faiyum: 'Faiyum',
    beni: 'Beni Suef',
    port: 'Port Said',
    kafr: 'Kafr El Sheikh',
    sinai: 'North Sinai',
  };
  for (const [alias, canonical] of Object.entries(aliases)) {
    if (key.includes(alias)) {
      return EGYPT_GOVERNORATES.find((g) => g.name === canonical) ?? null;
    }
  }
  return (
    EGYPT_GOVERNORATES.find(
      (g) =>
        key.includes(g.name.toLowerCase()) ||
        g.nameAr.includes(name.trim()) ||
        key.includes(g.nameAr)
    ) ?? null
  );
}

/** Resolve map coords: prefer precise lat/lng, else governorate centroid. */
export function resolveMapCoords(opts: {
  latitude?: number | null;
  longitude?: number | null;
  governorate?: string | null;
}): [number, number] | null {
  if (
    opts.latitude != null &&
    opts.longitude != null &&
    Number.isFinite(opts.latitude) &&
    Number.isFinite(opts.longitude)
  ) {
    return [opts.latitude, opts.longitude];
  }
  const g = findGovernorateByName(opts.governorate);
  return g ? [g.latitude, g.longitude] : null;
}
