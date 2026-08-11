export interface FactoryMatchItem {
  matchId: string;
  farmId: string;
  farmName: string;
  farmLocation: string | null;
  farmGovernorate: string | null;
  farmLatitude?: number | null;
  farmLongitude?: number | null;
  farmIsVerified: boolean;
  farmAverageRating: number;
  matchScore: number | null;
  riskScore: number | null;
  /** Factory↔farm haversine km when both have coordinates. */
  distanceKm?: number | null;
  /** True when distance could not be computed (governorate fallback). */
  usedGovernorateFallback?: boolean;
  status: string;
  createdAt: string;
}
