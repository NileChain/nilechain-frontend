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

  getMatchedFarms(): Observable<FactoryMatchedFarm[]> {
    return this.http.get<FactoryMatchedFarm[]>(`${this.api}/matched-farms`);
  }

  getNotifications(): Observable<FactoryNotification[]> {
    return this.http.get<FactoryNotification[]>(`${this.api}/notifications`);
  }

  markNotificationRead(notificationId: string): Observable<void> {
    return this.http.put<void>(
      `${this.api}/notifications/${notificationId}/read`,
      {}
    );
  }

  getConversations(): Observable<FactoryConversation[]> {
    return this.http.get<FactoryConversation[]>(`${this.api}/conversations`);
  }

  getMessages(matchId: string): Observable<FactoryMessage[]> {
    return this.http.get<FactoryMessage[]>(
      `${this.api}/conversations/${matchId}/messages`
    );
  }

  sendMessage(matchId: string, content: string): Observable<void> {
    return this.http.post<void>(
      `${this.api}/conversations/${matchId}/messages`,
      { content }
    );
  }

  persistContract(
    matchId: string,
    contractText: string
  ): Observable<PersistContractResult> {
    return this.http.post<PersistContractResult>(`${this.api}/contracts`, {
      matchId,
      contractText,
    });
  }

  approveContract(contractId: string): Observable<FactoryContract> {
    return this.http.put<FactoryContract>(
      `${this.api}/contracts/${contractId}/approve`,
      {}
    );
  }

  rejectContract(contractId: string): Observable<FactoryContract> {
    return this.http.put<FactoryContract>(
      `${this.api}/contracts/${contractId}/reject`,
      {}
    );
  }

  getContracts(): Observable<FactoryContract[]> {
    return this.http.get<FactoryContract[]>(`${this.api}/contracts`);
  }

  downloadContractPdf(contractId: string): Observable<Blob> {
    return this.http.get(`${this.api}/contracts/${contractId}/pdf`, {
      responseType: 'blob',
    });
  }
}

export interface FactoryNotification {
  notificationId: string;
  title: string;
  message: string;
  type: string | null;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface FactoryConversation {
  matchId: string;
  farmName: string;
  cropName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface FactoryMatchedFarm {
  farmId: string;
  farmName: string;
  requestId?: string | null;
  matchId?: string | null;
  matchScore?: number | null;
  riskScore?: number | null;
  farmGovernorate?: string | null;
}

export interface FactoryMessage {
  messageId: string;
  matchId: string;
  senderId: string;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface PersistContractResult {
  contractId: string;
  status: string;
}

export interface FactoryContract {
  contractId: string;
  matchId: string;
  farmName: string;
  cropName: string | null;
  quantityTons: number;
  pricePerTon: number | null;
  generatedText: string | null;
  pdfUrl: string | null;
  status: string;
  createdAt: string;
  signedAt: string | null;
}
