import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CropType, FarmDocument, FarmProfile } from '../../models/farm/farm-profile.model';
import { UpdateFarmProfileRequest } from '../../models/farm/update-farm-profile-request.model';
import { FarmDashboardData } from '../../models/farm/farm-dashboard.model';
import { FarmContractItem } from '../../models/farm/farm-contract-item.model';
import { ConversationItem } from '../../models/farm/conversation-item.model';
import { MessageItem } from '../../models/farm/message-item.model';
import { NotificationItem } from '../../models/farm/notification-item.model';


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

  getContracts(): Observable<FarmContractItem[]> {
    return this.http.get<FarmContractItem[]>(`${this.api}/contracts`);
  }

  getConversations(): Observable<ConversationItem[]> {
    return this.http.get<ConversationItem[]>(`${this.api}/conversations`);
  }

  getMessages(matchId: string): Observable<MessageItem[]> {
    return this.http.get<MessageItem[]>(`${this.api}/conversations/${matchId}/messages`);
  }

  sendMessage(matchId: string, content: string): Observable<void> {
    return this.http.post<void>(`${this.api}/conversations/${matchId}/messages`, { content });
  }

  getNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${this.api}/notifications`);
  }

  markNotificationAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`${this.api}/notifications/${notificationId}/read`, {});
  }

}
