import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AgentRequest,
  AgentResponse,
  GenerateContractRequest,
  GenerateContractResponse,
} from '../../models/agent/agent.model';

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/agent`;

  run(requestId: string, payload: AgentRequest): Observable<AgentResponse> {
    return this.http.post<AgentResponse>(`${this.api}/run/${requestId}`, payload);
  }

  generateContract(payload: GenerateContractRequest): Observable<GenerateContractResponse> {
    return this.http.post<GenerateContractResponse>(`${this.api}/generate-contract`, payload);
  }
}
