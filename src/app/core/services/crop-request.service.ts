import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateCropRequestPayload,
  CropRequest,
  ReviewCropRequestPayload,
} from '../models/crop-request.model';

@Injectable({
  providedIn: 'root',
})
export class CropRequestService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/crop-requests`;
  private readonly adminApi = `${environment.backendUrl}/admin/crop-requests`;

  createCropRequest(
    payload: CreateCropRequestPayload
  ): Observable<CropRequest> {
    return this.http.post<CropRequest>(this.api, payload);
  }

  getMyCropRequests(): Observable<CropRequest[]> {
    return this.http.get<CropRequest[]>(`${this.api}/mine`);
  }

  listCropRequests(status?: string | null): Observable<CropRequest[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<CropRequest[]>(this.adminApi, { params });
  }

  approveCropRequest(
    id: string,
    payload: ReviewCropRequestPayload = {}
  ): Observable<CropRequest> {
    return this.http.put<CropRequest>(
      `${this.adminApi}/${id}/approve`,
      payload
    );
  }

  rejectCropRequest(
    id: string,
    payload: ReviewCropRequestPayload = {}
  ): Observable<CropRequest> {
    return this.http.put<CropRequest>(
      `${this.adminApi}/${id}/reject`,
      payload
    );
  }
}
