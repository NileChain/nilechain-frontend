export interface AgentRequest {
  requestId?: string;
  cropType: string;
  quantityTons: number;
  qualitySpecs: string;
  pricePerTon: number;
  deliveryDate: string;
  factoryGovernorate: string;
  confirmHighRiskWarning?: boolean;
}

export interface MatchResult {
  farmId: string;
  matchId?: string | null;
  farmName: string;
  governorate: string;
  matchScore: number;
  riskScore: number;
  riskLevel: string;
  isVerified: boolean;
  cropTypes: string[];
}

export interface ToolCallTrailEntry {
  timestampUtc?: string;
  functionName: string;
  argumentsSummary?: string;
  resultSummary?: string;
  blocked?: boolean;
  blockReason?: string | null;
}

export interface RiskWarningResult {
  farmId: string;
  riskScore: number;
  message: string;
  requiresFactoryConfirmation: boolean;
}

export interface AgentResponse {
  success: boolean;
  topMatches: MatchResult[];
  /** Eligible farms before Take-N truncation. */
  totalEligible?: number;
  /** Farms excluded by the shortlist cap. */
  truncatedCount?: number;
  comparisonReport: string;
  contractDraft: string;
  errorMessage: string;
  partialResult?: boolean;
  partialReason?: string | null;
  /** e.g. AgenticSbgReact | DeterministicFallback | Agentic | Error */
  orchestratorMode?: string;
  riskWarning?: RiskWarningResult | null;
  contractIncomplete?: boolean;
  contractValidationError?: string | null;
  toolCallTrail?: ToolCallTrailEntry[];
}

export interface GenerateContractRequest {
  agentRequest: AgentRequest;
  selectedFarm: MatchResult;
  factoryName: string;
  matchId?: string;
}

export interface GenerateContractResponse {
  contractText: string;
  contractId?: string | null;
  matchId?: string | null;
}
