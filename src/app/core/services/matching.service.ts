import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FarmMatchItem } from '../models/farm/farm-match-item.model';

@Injectable({
  providedIn: 'root'
})
export class MatchingService {

  private readonly http = inject(HttpClient);

  private readonly api = `${environment.backendUrl}/farm`;

  getFarmMatches(status?: string, cropTypeId?: string): Observable<FarmMatchItem[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    if (cropTypeId) {
      params = params.set('cropTypeId', cropTypeId);
    }
    return this.http.get<FarmMatchItem[]>(`${this.api}/matches`, { params });
  }

  respondToMatch(matchId: string, action: 'accept' | 'reject'): Observable<void> {
    return this.http.put<void>(`${this.api}/matches/${matchId}/respond`, { action });
  }
}
