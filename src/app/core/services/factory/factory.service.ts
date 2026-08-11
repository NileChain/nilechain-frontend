import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  FactoryProfile,
  UpdateFactoryProfileRequest,
} from '../../models/factory/factory-profile.model';
import { FactoryMatchItem } from '../../models/factory/factory-match.model';
import {
  Fulfillment,
  QualityCheckRequest,
} from '../../models/fulfillment/fulfillment.model';
import { PaymentMilestoneSchedule } from '../../models/payment/payment-milestone.model';
import { Dispute } from '../../models/dispute/dispute.model';

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

  getRequestMatches(
    requestId: string,
    sort?: string | null
  ): Observable<FactoryMatchItem[]> {
    let params = new HttpParams();
    if (sort) {
      params = params.set('sort', sort);
    }
    return this.http.get<FactoryMatchItem[]>(
      `${this.api}/requests/${requestId}/matches`,
      { params }
    );
  }

  excludeMatch(matchId: string): Observable<void> {
    return this.http.post<void>(`${this.api}/matches/${matchId}/exclude`, {});
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

  getContract(contractId: string): Observable<FactoryContract> {
    return this.http.get<FactoryContract>(
      `${this.api}/contracts/${contractId}`
    );
  }

  downloadContractPdf(contractId: string): Observable<Blob> {
    return this.http.get(`${this.api}/contracts/${contractId}/pdf`, {
      responseType: 'blob',
    });
  }

  getFulfillment(contractId: string): Observable<Fulfillment> {
    return this.http.get<Fulfillment>(
      `${this.api}/contracts/${contractId}/fulfillment`
    );
  }

  receiveFulfillment(contractId: string): Observable<Fulfillment> {
    return this.http.post<Fulfillment>(
      `${this.api}/contracts/${contractId}/fulfillment/receive`,
      {}
    );
  }

  qualityCheckFulfillment(
    contractId: string,
    body: QualityCheckRequest = {}
  ): Observable<Fulfillment> {
    return this.http.post<Fulfillment>(
      `${this.api}/contracts/${contractId}/fulfillment/quality-check`,
      body
    );
  }

  fulfillContract(contractId: string): Observable<Fulfillment> {
    return this.http.post<Fulfillment>(
      `${this.api}/contracts/${contractId}/fulfillment/fulfill`,
      {}
    );
  }

  getPaymentMilestones(contractId: string): Observable<PaymentMilestoneSchedule> {
    return this.http.get<PaymentMilestoneSchedule>(
      `${this.api}/contracts/${contractId}/payment-milestones`
    );
  }

  markPaymentMilestonePaid(
    contractId: string,
    transactionId: string
  ): Observable<PaymentMilestoneSchedule> {
    return this.http.post<PaymentMilestoneSchedule>(
      `${this.api}/contracts/${contractId}/payment-milestones/${transactionId}/mark-paid`,
      {}
    );
  }

  listDisputes(contractId: string): Observable<Dispute[]> {
    return this.http.get<Dispute[]>(
      `${this.api}/contracts/${contractId}/disputes`
    );
  }

  openDispute(
    contractId: string,
    type: string,
    description: string,
    evidence: File[]
  ): Observable<Dispute> {
    const form = new FormData();
    form.append('type', type);
    form.append('description', description);
    for (const file of evidence) {
      form.append('evidence', file, file.name);
    }
    return this.http.post<Dispute>(
      `${this.api}/contracts/${contractId}/disputes`,
      form
    );
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
  /** Most recent match CreatedAt for this farm (API default: newest first). */
  createdAt?: string | null;
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
  farmLocation?: string | null;
  factoryName?: string | null;
  cropName: string | null;
  quantityTons: number;
  pricePerTon: number | null;
  deliveryDate?: string | null;
  deliveryLocation?: string | null;
  generatedText: string | null;
  pdfUrl: string | null;
  status: string;
  createdAt: string;
  signedAt: string | null;
  factorySigned?: boolean;
  farmSigned?: boolean;
  factorySignedAt?: string | null;
  farmSignedAt?: string | null;
  updatedAt?: string | null;
  matchScore?: number | null;
  riskScore?: number | null;
}
