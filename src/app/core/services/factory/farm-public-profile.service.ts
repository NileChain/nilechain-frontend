import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FarmPublicProfileDto } from '../../models/factory/farm-public-profile.model';

@Injectable({ providedIn: 'root' })
export class FarmPublicProfileService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/farms`;

  getPublicProfile(farmId: string): Observable<FarmPublicProfileDto> {
    return this.http.get<FarmPublicProfileDto>(
      `${this.api}/${farmId}/public-profile`
    );
  }
}
