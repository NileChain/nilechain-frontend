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
  status: string;
  createdAt: string;
}
