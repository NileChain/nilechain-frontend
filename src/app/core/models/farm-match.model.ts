export type FarmMatchStatus = 'Proposed' | 'Accepted' | 'Rejected' | 'Expired';

export interface FarmMatch {
  matchId: string;
  requestId: string;
  farmId: string;
  matchScore: number | null;
  riskScore: number | null;
  status: FarmMatchStatus;
  createdAt: string;
}
