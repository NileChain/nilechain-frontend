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
  contractId?: string | null;
  contractFullySigned?: boolean;
  canMessage?: boolean;
  requestQuantityTons?: number | null;
  requestPricePerTon?: number | null;
  requestDeliveryDate?: string | null;
  counterQuantityTons?: number | null;
  counterPricePerTon?: number | null;
  counterDeliveryDate?: string | null;
  counterNote?: string | null;
  counterAccepted?: boolean;
  effectiveQuantityTons?: number;
  effectivePricePerTon?: number | null;
  effectiveDeliveryDate?: string | null;
}

export interface FarmListing {
  farmId: string;
  farmName: string;
  governorate: string | null;
  isVerified: boolean;
  riskScore: number | null;
  averageRating: number;
  cropTypeId: string;
  cropName: string;
  availableQuantityTons: number | null;
  availableFrom: string | null;
  availableTo: string | null;
  minPricePerTon: number | null;
  coverImageUrl: string | null;
}
