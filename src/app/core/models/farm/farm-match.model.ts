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
  contractId?: string | null;
}

export interface FarmMatchSummary {
  total: number;
  proposed: number;
  accepted: number;
  rejected: number;
  newCount: number;
}

export interface FarmMatchesPage {
  items: FarmMatchItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: FarmMatchSummary;
  newMatches: FarmMatchItem[];
}

export interface RespondToMatchRequest {
  action: 'reject';
}
