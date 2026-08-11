import { AgentRequest, AgentResponse } from '../models/agent/agent.model';

const AGENT_SESSION_KEY = 'nilechain.agent.lastRun';
const PENDING_SUPPLY_KEY = 'nilechain.agent.pendingSupplyRequest';

export interface AgentSessionPayload {
  requestId: string;
  agentRequest: AgentRequest;
  response: AgentResponse;
}

export interface PendingSupplyRequest {
  requestId: string;
  crop: string;
  quantity: number;
  price: number;
  deliveryDate: string;
  quality: string;
  selectedGovernorates: string[];
}

export function saveAgentSession(payload: AgentSessionPayload): void {
  sessionStorage.setItem(AGENT_SESSION_KEY, JSON.stringify(payload));
}

export function readAgentSession(): AgentSessionPayload | null {
  const raw = sessionStorage.getItem(AGENT_SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AgentSessionPayload;
  } catch {
    return null;
  }
}

export function savePendingSupplyRequest(payload: PendingSupplyRequest): void {
  sessionStorage.setItem(PENDING_SUPPLY_KEY, JSON.stringify(payload));
}

export function readPendingSupplyRequest(): PendingSupplyRequest | null {
  const raw = sessionStorage.getItem(PENDING_SUPPLY_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as PendingSupplyRequest;
  } catch {
    return null;
  }
}

export function clearPendingSupplyRequest(): void {
  sessionStorage.removeItem(PENDING_SUPPLY_KEY);
}

export function pendingToAgentRequest(
  pending: PendingSupplyRequest
): AgentRequest {
  const gov = pending.selectedGovernorates[0] || 'giza';
  return {
    requestId: pending.requestId,
    cropType: pending.crop,
    quantityTons: pending.quantity,
    qualitySpecs: pending.quality,
    pricePerTon: pending.price,
    // Egypt calendar date as yyyy-MM-dd (avoid Date→ISO timezone off-by-one).
    deliveryDate: pending.deliveryDate,
    factoryGovernorate: capitalizeGov(gov),
  };
}

function capitalizeGov(value: string): string {
  if (!value) {
    return 'Giza';
  }
  const map: Record<string, string> = {
    cairo: 'Cairo',
    giza: 'Giza',
    alex: 'Alexandria',
    beheira: 'Beheira',
    minya: 'Minya',
  };
  return map[value.toLowerCase()] ?? value;
}
