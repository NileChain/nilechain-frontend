export interface AgentRequest {
  requestId?: string;
  cropType: string;
  quantityTons: number;
  qualitySpecs: string;
  pricePerTon: number;
  deliveryDate: string;
  factoryGovernorate: string;
}

export interface MatchResult {
  farmId: string;
  farmName: string;
  governorate: string;
  matchScore: number;
  riskScore: number;
  riskLevel: string;
  isVerified: boolean;
  cropTypes: string[];
}

export interface AgentResponse {
  success: boolean;
  topMatches: MatchResult[];
  comparisonReport: string;
  contractDraft: string;
  errorMessage: string;
}

export interface GenerateContractRequest {
  agentRequest: AgentRequest;
  selectedFarm: MatchResult;
  factoryName: string;
}

export interface GenerateContractResponse {
  contractText: string;
}
