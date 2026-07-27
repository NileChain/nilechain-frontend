import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CropType, FarmDocument, FarmProfile } from '../../models/farm/farm-profile.model';
import { UpdateFarmProfileRequest } from '../../models/farm/update-farm-profile-request.model';
import { FarmDashboardData } from '../../models/farm/farm-dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class FarmService {

  private readonly http = inject(HttpClient);

  private readonly api = `${environment.backendUrl}/farm`;

  getProfile(): Observable<FarmProfile> {
    return this.http.get<FarmProfile>(`${this.api}/profile`);
  }

  updateProfile(payload: UpdateFarmProfileRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/profile`, payload);
  }

  getDashboard(): Observable<FarmDashboardData> {
    return this.http.get<FarmDashboardData>(`${this.api}/dashboard`);
  }

  getCropTypes(): Observable<CropType[]> {
    return this.http.get<CropType[]>(`${environment.backendUrl}/crop-types`);
  }

  addDocument(file: File): Observable<FarmDocument> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FarmDocument>(`${this.api}/documents`, formData);
  }

  deleteDocument(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/documents/${documentId}`);
  }

  addCrop(cropTypeId: string): Observable<void> {
    return this.http.post<void>(`${this.api}/crops`, { cropTypeId });
  }

  deleteCrop(cropTypeId: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/crops/${cropTypeId}`);
  }

}
