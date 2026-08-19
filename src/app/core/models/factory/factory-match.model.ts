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
  isGeographicExpansion?: boolean;
  /** Deterministic score breakdown from the backend — codes are i18n keys. */
  whyMatched?: MatchFactor[];
  negotiationRounds?: MatchNegotiationRound[];
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

export type MatchFactorState = 'Earned' | 'Missed' | 'Info' | 'Caution';

export interface MatchFactor {
  code: string;
  state: MatchFactorState;
  points?: number | null;
  maxPoints?: number | null;
  detail?: string | null;
}

export interface MatchNegotiationRound {
  roundId: string;
  offeredBy: string;
  quantityTons?: number | null;
  pricePerTon?: number | null;
  deliveryDate?: string | null;
  grade?: string | null;
  note?: string | null;
  createdAt: string;
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
