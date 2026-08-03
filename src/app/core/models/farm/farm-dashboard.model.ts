export interface FarmDashboard {
  riskScore: number | null;
  activeMatchesCount: number;
  completedContractsCount: number;
  averageRating: number;
  ratingCount: number;
  riskBreakdown: RiskBreakdownItem[];
  recentMatches: RecentMatchItem[];
  improvementTips: ImprovementTip[];
}

export interface RiskBreakdownItem {
  label: string;
  percentage: number;
}

export interface RecentMatchItem {
  matchId: string;
  factoryName: string;
  cropName: string;
  quantityTons: number;
  matchScore: number | null;
  status: string;
}

export interface ImprovementTip {
  category: string;
  currentScore: number;
  severity: 'high' | 'medium' | 'low';
  message: string;
  icon: string;
}
