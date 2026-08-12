export interface FarmDashboard {
  riskScore: number | null;
  activeMatchesCount: number;
  completedContractsCount: number;
  averageRating: number;
  ratingCount: number;
  riskBreakdown: RiskBreakdownItem[];
  recentMatches: RecentMatchItem[];
  improvementTips: ImprovementTip[];
  reliabilityTrend: ReliabilityTrendPoint[];
  collectionsSummary: FarmCollectionsSummary;
  expiringCertifications?: number;
  expiredCertifications?: number;
  onTimeFulfillmentRate?: number | null;
  qcIssueRate?: number | null;
  repeatBuyers?: RepeatBuyer[];
}

export interface RepeatBuyer {
  factoryId: string;
  factoryName: string;
  completedContracts: number;
}

export interface FarmCollectionsSummary {
  pendingAmount: number;
  awaitingConfirmAmount: number;
  receivedAmount: number;
  overdueAmount: number;
  currency: string;
}

export interface ReliabilityTrendPoint {
  value: number;
  label: string;
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
