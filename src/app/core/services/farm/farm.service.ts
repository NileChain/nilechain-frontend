import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CropType,
  FarmDocument,
  FarmProfile,
} from '../../models/farm/farm-profile.model';
import { UpdateFarmProfileRequest } from '../../models/farm/update-farm-profile-request.model';
import { FarmDashboard } from '../../models/farm/farm-dashboard.model';
import {
  FarmMatchItem,
  FarmMatchesPage,
  RespondToMatchRequest,
} from '../../models/farm/farm-match.model';
import { FarmContract } from '../../models/farm/farm-contract.model';
import {
  Conversation,
  Message,
  SendMessageRequest,
} from '../../models/farm/farm-message.model';
import { FarmNotification } from '../../models/farm/farm-notification.model';
import { Fulfillment } from '../../models/fulfillment/fulfillment.model';
import { PaymentMilestoneSchedule } from '../../models/payment/payment-milestone.model';
import { Dispute } from '../../models/dispute/dispute.model';

function normalizeMatchesPage(
  res: FarmMatchesPage | FarmMatchItem[]
): FarmMatchesPage {
  if (Array.isArray(res)) {
    const proposed = res.filter((m) => m.status?.toLowerCase() === 'proposed').length;
    const accepted = res.filter((m) => m.status?.toLowerCase() === 'accepted').length;
    const rejected = res.filter((m) => m.status?.toLowerCase() === 'rejected').length;
    return {
      items: res,
      totalCount: res.length,
      page: 1,
      pageSize: res.length || 20,
      totalPages: 1,
      summary: {
        total: res.length,
        proposed,
        accepted,
        rejected,
        newCount: 0,
      },
      newMatches: [],
    };
  }
  return {
    items: res.items ?? [],
    totalCount: res.totalCount ?? 0,
    page: res.page ?? 1,
    pageSize: res.pageSize ?? 20,
    totalPages: res.totalPages ?? 1,
    summary: res.summary ?? {
      total: 0,
      proposed: 0,
      accepted: 0,
      rejected: 0,
      newCount: 0,
    },
    newMatches: res.newMatches ?? [],
  };
}

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

  deleteDocument(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/documents/${documentId}`);
  }

  addCrop(cropTypeId: string): Observable<void> {
    return this.http.post<void>(`${this.api}/crops`, { cropTypeId });
  }

  deleteCrop(cropTypeId: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/crops/${cropTypeId}`);
  }

  getMatches(options?: {
    status?: string | null;
    cropTypeId?: string | null;
    sort?: string | null;
    search?: string | null;
    days?: number | null;
    page?: number;
    pageSize?: number;
  }): Observable<FarmMatchesPage> {
    let params = new HttpParams();
    const o = options ?? {};
    if (o.status) params = params.set('status', o.status);
    if (o.cropTypeId) params = params.set('cropTypeId', o.cropTypeId);
    if (o.sort) params = params.set('sort', o.sort);
    if (o.search) params = params.set('search', o.search);
    if (o.days != null) params = params.set('days', String(o.days));
    params = params.set('page', String(o.page ?? 1));
    params = params.set('pageSize', String(o.pageSize ?? 20));
    return this.http
      .get<FarmMatchesPage | FarmMatchItem[]>(`${this.api}/matches`, { params })
      .pipe(map(normalizeMatchesPage));
  }

  respondToMatch(
    matchId: string,
    action: RespondToMatchRequest['action']
  ): Observable<void> {
    return this.http.put<void>(`${this.api}/matches/${matchId}/respond`, {
      action,
    } satisfies RespondToMatchRequest);
  }

  getOrCreateContractForMatch(matchId: string): Observable<FarmContract> {
    return this.http.get<FarmContract>(`${this.api}/matches/${matchId}/contract`);
  }

  getContracts(): Observable<FarmContract[]> {
    return this.http.get<FarmContract[]>(`${this.api}/contracts`);
  }

  getContract(contractId: string): Observable<FarmContract> {
    return this.http.get<FarmContract>(`${this.api}/contracts/${contractId}`);
  }

  approveContract(contractId: string): Observable<FarmContract> {
    return this.http.put<FarmContract>(
      `${this.api}/contracts/${contractId}/approve`,
      {}
    );
  }

  rejectContract(contractId: string): Observable<FarmContract> {
    return this.http.put<FarmContract>(
      `${this.api}/contracts/${contractId}/reject`,
      {}
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

  shipFulfillment(contractId: string): Observable<Fulfillment> {
    return this.http.post<Fulfillment>(
      `${this.api}/contracts/${contractId}/fulfillment/ship`,
      {}
    );
  }

  getPaymentMilestones(contractId: string): Observable<PaymentMilestoneSchedule> {
    return this.http.get<PaymentMilestoneSchedule>(
      `${this.api}/contracts/${contractId}/payment-milestones`
    );
  }

  confirmPaymentMilestoneReceived(
    contractId: string,
    transactionId: string
  ): Observable<PaymentMilestoneSchedule> {
    return this.http.post<PaymentMilestoneSchedule>(
      `${this.api}/contracts/${contractId}/payment-milestones/${transactionId}/confirm-received`,
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

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.api}/conversations`);
  }

  getMessages(matchId: string): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.api}/conversations/${matchId}/messages`
    );
  }

  sendMessage(matchId: string, content: string): Observable<void> {
    return this.http.post<void>(
      `${this.api}/conversations/${matchId}/messages`,
      {
        content,
      } satisfies SendMessageRequest
    );
  }

  getNotifications(): Observable<FarmNotification[]> {
    return this.http.get<FarmNotification[]>(`${this.api}/notifications`);
  }

  markNotificationAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(
      `${this.api}/notifications/${notificationId}/read`,
      {}
    );
  }
}
