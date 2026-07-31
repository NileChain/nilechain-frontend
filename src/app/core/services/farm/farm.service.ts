import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CropType, FarmDocument, FarmProfile } from '../../models/farm/farm-profile.model';
import { UpdateFarmProfileRequest } from '../../models/farm/update-farm-profile-request.model';
import { FarmDashboard } from '../../models/farm/farm-dashboard.model';
import { FarmMatchItem, RespondToMatchRequest } from '../../models/farm/farm-match.model';
import { FarmContract } from '../../models/farm/farm-contract.model';
import {
  Conversation,
  Message,
  SendMessageRequest,
} from '../../models/farm/farm-message.model';
import { FarmNotification } from '../../models/farm/farm-notification.model';

@Injectable({
  providedIn: 'root',
})
export class FarmService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/farm`;

  getProfile(): Observable<FarmProfile> {
    return this.http.get<FarmProfile>(`${this.api}/profile`);
  }

  getDashboard(): Observable<FarmDashboard> {
    return this.http.get<FarmDashboard>(`${this.api}/dashboard`);
  }

  updateProfile(payload: UpdateFarmProfileRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/profile`, payload);
  }

  getDocuments(): Observable<FarmDocument[]> {
    return this.http.get<FarmDocument[]>(`${this.api}/documents`);
  }

  getCropTypes(): Observable<CropType[]> {
    return this.http.get<CropType[]>(`${environment.backendUrl}/crop-types`);
  }

  addDocument(file: File): Observable<FarmDocument> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FarmDocument>(`${this.api}/documents`, formData);
  }

  getDocuments(): Observable<FarmDocument[]> {
    return this.http.get<FarmDocument[]>(`${this.api}/documents`);
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

  getMatches(status?: string | null, cropTypeId?: string | null): Observable<FarmMatchItem[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    if (cropTypeId) {
      params = params.set('cropTypeId', cropTypeId);
    }
    return this.http.get<FarmMatchItem[]>(`${this.api}/matches`, { params });
  }

  respondToMatch(matchId: string, action: RespondToMatchRequest['action']): Observable<void> {
    return this.http.put<void>(`${this.api}/matches/${matchId}/respond`, {
      action,
    } satisfies RespondToMatchRequest);
  }

  getContracts(): Observable<FarmContract[]> {
    return this.http.get<FarmContract[]>(`${this.api}/contracts`);
  }

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.api}/conversations`);
  }

  getMessages(matchId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.api}/conversations/${matchId}/messages`);
  }

  sendMessage(matchId: string, content: string): Observable<void> {
    return this.http.post<void>(`${this.api}/conversations/${matchId}/messages`, {
      content,
    } satisfies SendMessageRequest);
  }

  getNotifications(): Observable<FarmNotification[]> {
    return this.http.get<FarmNotification[]>(`${this.api}/notifications`);
  }

  markNotificationAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`${this.api}/notifications/${notificationId}/read`, {});
  }
}
