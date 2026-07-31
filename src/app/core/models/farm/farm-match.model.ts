export interface FarmMatchItem {
  matchId: string;
  factoryName: string;
  factoryLocation: string | null;
  factoryIsVerified: boolean;
  cropName: string;
  cropTypeId: string;
  quantityTons: number;
  pricePerTon: number | null;
  deliveryDate: string | null;
  qualitySpecs: string | null;
  matchScore: number | null;
  riskScore: number | null;
  status: string;
  createdAt: string;
}

export interface RespondToMatchRequest {
  action: 'accept' | 'reject';
}
