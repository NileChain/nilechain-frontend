import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  FactoryProfile,
  UpdateFactoryProfileRequest,
} from '../../models/factory/factory-profile.model';
import { FactoryMatchItem } from '../../models/factory/factory-match.model';

@Injectable({
  providedIn: 'root',
})
export class FactoryService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/factory`;

  getProfile(): Observable<FactoryProfile> {
    return this.http.get<FactoryProfile>(`${this.api}/profile`);
  }

  updateProfile(payload: UpdateFactoryProfileRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/profile`, payload);
  }

  getRequestMatches(requestId: string): Observable<FactoryMatchItem[]> {
    return this.http.get<FactoryMatchItem[]>(
      `${this.api}/requests/${requestId}/matches`
    );
  }
}
