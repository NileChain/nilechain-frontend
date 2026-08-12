import { PagedResult } from '../admin/admin-user.model';

export interface StructuredQualityInput {
  moistureMaxPercent?: number | null;
  impuritiesMaxPercent?: number | null;
  grade?: string | null;
  labRequired?: boolean | null;
  notes?: string | null;
}

export interface StructuredQualitySpecs {
  raw?: string | null;
  moistureMaxPercent?: number | null;
  impuritiesMaxPercent?: number | null;
  grade?: string | null;
  labRequired?: boolean | null;
  notes?: string | null;
  geographicScope?: string | null;
  preferredGovernorates?: string[];
  preferredFarmId?: string | null;
}

export interface FactoryPayablesSummary {
  pendingAmount: number;
  awaitingFarmConfirmAmount: number;
  paidConfirmedAmount: number;
  overdueAmount: number;
  currency: string;
}

export interface FactoryAttentionItem {
  id: string;
  kind: string;
  tone: 'attention' | 'info' | string;
  count: number;
  title: string;
  status: string;
  cta: string;
  link: string;
  entityId?: string | null;
}

export interface FactorySupplyRequestListItem {
  requestId: string;
  cropTypeId: string;
  crop: string;
  quantityTons: number;
  pricePerTon: number | null;
  deliveryDate: string | null;
  status: string;
  createdAt: string;
  idempotencyKey?: string | null;
  matchCount: number;
  activeMatchCount: number;
  geographicScope?: string | null;
  quality?: StructuredQualitySpecs | null;
}

export interface FactorySupplyRequestDetail extends FactorySupplyRequestListItem {
  qualitySpecsRaw?: string | null;
  quality: StructuredQualitySpecs;
  canCancel: boolean;
  canRerunAgent: boolean;
  canUpdateDeliveryTerms?: boolean;
  deliveryPoint?: string;
  freightPayer?: string;
  transitRisk?: string;
}

export interface FactoryDashboardResponse {
  openRequestsCount: number;
  activeMatchesCount: number;
  activeContractsCount: number;
  completedContractsCount: number;
  totalProcurementValue: number;
  averageSupplierRiskScore: number;
  payablesSummary: FactoryPayablesSummary;
  attention: FactoryAttentionItem[];
  recentRequests: FactorySupplyRequestListItem[];
}

export interface FactorySupplierDeal {
  contractId: string;
  matchId?: string | null;
  crop: string;
  quantityTons: number;
  contractStatus: string;
  fulfillmentStatus?: string | null;
  signedAt?: string | null;
  qcDiscountPercent?: number | null;
}

export interface FactorySupplierScorecard {
  farmId: string;
  farmUserId?: string | null;
  farmName: string;
  governorate?: string | null;
  isVerified: boolean;
  riskScore?: number | null;
  averageRating: number;
  ratingCount: number;
  dealsWithThisFactory: number;
  completedContracts: number;
  openDisputes: number;
  totalDisputes: number;
  onTimeFulfillmentRate?: number | null;
  qcIssueRate?: number | null;
  averageQcDiscountPercent?: number | null;
  recentDeals: FactorySupplierDeal[];
}

export type FactorySupplyRequestPage = PagedResult<FactorySupplyRequestListItem>;
