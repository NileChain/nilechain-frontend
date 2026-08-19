import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AgentRequest,
  AgentResponse,
  AgentRunPage,
  GenerateContractRequest,
  GenerateContractResponse,
} from '../../models/agent/agent.model';
import {
  readAgentSession,
  saveAgentSession,
} from '../../utils/agent-session';

export interface CachedAgentRun {
  requestId: string;
  request: AgentRequest;
  response: AgentResponse;
}

/**
 * Singleton agent API + in-memory run cache (survives route navigation).
 * Cache is keyed by supply requestId so Agent Progress can restore results
 * without re-POSTing /agent/run on every visit.
 */
@Injectable({
  providedIn: 'root',
})
export class AgentService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/agent`;
  private readonly runCache = new Map<string, CachedAgentRun>();

  constructor() {
    // Warm cache from sessionStorage so a tab refresh still skips re-run.
    const session = readAgentSession();
    if (session?.requestId && session.response) {
      this.runCache.set(session.requestId, {
        requestId: session.requestId,
        request: session.agentRequest,
        response: session.response,
      });
    }
  }

  getCachedRun(requestId: string): CachedAgentRun | null {
    return this.runCache.get(requestId) ?? null;
  }

  setCachedRun(
    requestId: string,
    request: AgentRequest,
    response: AgentResponse
  ): void {
    const entry: CachedAgentRun = { requestId, request, response };
    this.runCache.set(requestId, entry);
    saveAgentSession({
      requestId,
      agentRequest: request,
      response,
    });
  }

  clearCachedRun(requestId: string): void {
    this.runCache.delete(requestId);
  }

  run(requestId: string, payload: AgentRequest): Observable<AgentResponse> {
    return this.http.post<AgentResponse>(
      `${this.api}/run/${requestId}`,
      payload
    );
  }

  generateContract(
    payload: GenerateContractRequest
  ): Observable<GenerateContractResponse> {
    return this.http.post<GenerateContractResponse>(
      `${this.api}/generate-contract`,
      payload
    );
  }

  /** Admins see every run; a factory only ever gets its own. */
  listRuns(page = 1, pageSize = 20): Observable<AgentRunPage> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    return this.http.get<AgentRunPage>(`${this.api}/runs`, { params });
  }
}
