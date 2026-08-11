export interface MonthlyContractPoint {
  label: string;
  count: number;
  heightPercent: number;
}

export interface CropDemand {
  cropName: string;
  demandTons: number;
  avgPricePerTon: number | null;
  avgRiskScore: number | null;
  riskBand: 'low' | 'medium' | 'high' | string;
}

export interface AdminActivityItem {
  kind: string;
  message: string;
  occurredAt: string;
  icon: string;
}

export interface DashboardSummary {
  pendingVerifications: number;
  openDisputes: number;
  stuckFulfillments: number;
  pendingSignatureContracts: number;
  signedContracts: number;
  farmCount: number;
  factoryCount: number;
  adminCount: number;
  totalUsers: number;
  monthlyContracts: MonthlyContractPoint[];
  topCrops: CropDemand[];
  recentActivity: AdminActivityItem[];
}

export interface AdminContractListItem {
  contractId: string;
  shortId: string;
  farmName: string;
  factoryName: string;
  cropName: string;
  quantityTons: number | null;
  valueEgp: number | null;
  farmRiskScore: number | null;
  riskBand: 'low' | 'medium' | 'high' | string;
  status: 'signed' | 'review' | 'rejected' | string;
  createdAt: string;
}

export interface AdminContractList {
  page: number;
  pageSize: number;
  totalCount: number;
  items: AdminContractListItem[];
}
