export interface FactoryPublicProfile {
  factoryId: string;
  name: string;
  governorate: string | null;
  location: string | null;
  industryType: string | null;
  isVerified: boolean;
  averageRating: number;
  ratingCount: number;
  activeMatchId: string | null;
  activeContractId?: string | null;
  contractFullySigned?: boolean;
  canMessage?: boolean;
}
