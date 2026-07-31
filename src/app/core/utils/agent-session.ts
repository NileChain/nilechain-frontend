import { AgentRequest, AgentResponse } from '../models/agent/agent.model';

const AGENT_SESSION_KEY = 'nilechain.agent.lastRun';

export interface AgentSessionPayload {
  requestId: string;
  agentRequest: AgentRequest;
  response: AgentResponse;
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
