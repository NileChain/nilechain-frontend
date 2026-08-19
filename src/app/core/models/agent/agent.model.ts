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
  distanceKm?: number | null;
  usedGovernorateFallback?: boolean;
  isGeographicExpansion?: boolean;
}

export interface PeekHint {
  farmId: string;
  farmName: string;
  governorate: string;
  matchScore: number;
  riskScore: number;
  isVerified: boolean;
  distanceKm?: number | null;
  reason: string;
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
  /** Prior matches superseded by this agent run. */
  supersededCount?: number;
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
  peekHint?: PeekHint | null;
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

/**
 * One recorded orchestration, including what the LLM cost.
 * Token and cost fields are null when the provider reported no usage or the
 * model has no configured rate — the run says "unknown" instead of guessing.
 */
export interface AgentRunRecord {
  runId: string;
  requestId: string;
  factoryId: string;
  startedAt: string;
  completedAt?: string | null;
  success: boolean;
  errorCode?: string | null;
  truncatedCount?: number | null;
  orchestratorMode?: string | null;
  durationMs?: number | null;
  llmProviders?: string | null;
  llmModels?: string | null;
  llmCalls?: number | null;
  llmLatencyMs?: number | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  estimatedCostUsd?: number | null;
}

export interface AgentRunPage {
  items: AgentRunRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
}
