import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BillingMeter {
  metric: string;
  used: number;
  cap: number | null;
  remaining: number | null;
}

export interface BillingMe {
  role: string;
  planCode: string;
  status: string;
  source: string;
  periodStart: string;
  periodEnd: string;
  proPriceEgp: number;
  isPro: boolean;
  copilot: boolean;
  showMore: boolean;
  expandGeo: boolean;
  factoryRfqs: BillingMeter;
  agentRuns: BillingMeter;
  farmAccepts: BillingMeter;
  honestyNote: string;
}

export interface AdminSubscriptionGrantRequest {
  planCode: string;
  periodEndUtc?: string | null;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/billing`;
  private readonly adminApi = `${environment.backendUrl}/admin`;

  getMine(): Observable<BillingMe> {
    return this.http.get<BillingMe>(`${this.api}/me`);
  }

  subscribe(): Observable<BillingMe> {
    return this.http.post<BillingMe>(`${this.api}/subscribe`, {});
  }

  adminGrant(userId: string, payload: AdminSubscriptionGrantRequest): Observable<BillingMe> {
    return this.http.put<BillingMe>(
      `${this.adminApi}/users/${userId}/subscription`,
      payload
    );
  }
}
