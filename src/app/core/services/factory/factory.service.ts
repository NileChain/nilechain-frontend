import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  FactoryDocument,
  FactoryProfile,
  UpdateFactoryProfileRequest,
} from '../../models/factory/factory-profile.model';
import { KybKind } from '../../models/farm/farm-profile.model';
import { FactoryMatchItem, FarmListing } from '../../models/factory/factory-match.model';
import {
  Fulfillment,
  QualityCheckRequest,
  ReceiveFulfillmentRequest,
  RejectAtGateRequest,
} from '../../models/fulfillment/fulfillment.model';
import { MockEscrowSession, PaymentMilestoneSchedule } from '../../models/payment/payment-milestone.model';
import { Dispute, DisputeList } from '../../models/dispute/dispute.model';
import {
  FactoryDashboardResponse,
  FactorySupplierScorecard,
  FactorySupplyRequestDetail,
  FactorySupplyRequestPage,
} from '../../models/factory/factory-dashboard.model';
import { ContractAttachmentDto } from '../../../shared/contracts/models/contract-document.model';
import { ContractIntegrity } from '../../models/integrity/contract-integrity.model';

@Injectable({
  providedIn: 'root',
})
export class FactoryService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/factory`;

  getProfile(): Observable<FactoryProfile> {
    return this.http.get<FactoryProfile>(`${this.api}/profile`);
  }

  getDashboard(): Observable<FactoryDashboardResponse> {
    return this.http.get<FactoryDashboardResponse>(`${this.api}/dashboard`);
  }

  listRequests(
    page: number,
    pageSize: number,
    status?: string | null
  ): Observable<FactorySupplyRequestPage> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<FactorySupplyRequestPage>(`${this.api}/requests`, {
      params,
    });
  }

  getRequest(requestId: string): Observable<FactorySupplyRequestDetail> {
    return this.http.get<FactorySupplyRequestDetail>(
      `${this.api}/requests/${requestId}`
    );
  }

  cancelRequest(requestId: string): Observable<void> {
    return this.http.post<void>(`${this.api}/requests/${requestId}/cancel`, {});
  }

  getSupplierScorecard(farmId: string): Observable<FactorySupplierScorecard> {
    return this.http.get<FactorySupplierScorecard>(
      `${this.api}/suppliers/${farmId}/scorecard`
    );
  }

  updateProfile(payload: UpdateFactoryProfileRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/profile`, payload);
  }

  getDocuments(): Observable<FactoryDocument[]> {
    return this.http.get<FactoryDocument[]>(`${this.api}/documents`);
  }

  addDocument(file: File, kybKind?: KybKind): Observable<FactoryDocument> {
    const formData = new FormData();
    formData.append('file', file);
    if (kybKind) {
      formData.append('kybKind', kybKind);
    }
    return this.http.post<FactoryDocument>(`${this.api}/documents`, formData);
  }

  deleteDocument(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/documents/${documentId}`);
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

  acceptCounterOffer(matchId: string): Observable<void> {
    return this.http.post<void>(
      `${this.api}/matches/${matchId}/accept-counter`,
      {}
    );
  }

  rejectCounterOffer(matchId: string): Observable<void> {
    return this.http.post<void>(
      `${this.api}/matches/${matchId}/reject-counter`,
      {}
    );
  }

  counterOffer(
    matchId: string,
    payload: {
      quantityTons?: number | null;
      pricePerTon?: number | null;
      deliveryDate?: string | null;
      note?: string | null;
      grade?: string | null;
    }
  ): Observable<void> {
    return this.http.post<void>(
      `${this.api}/matches/${matchId}/counter-offer`,
      payload
    );
  }

  expandGeo(requestId: string): Observable<FactorySupplyRequestDetail> {
    return this.http.post<FactorySupplyRequestDetail>(
      `${this.api}/requests/${requestId}/expand-geo`,
      {}
    );
  }

  showMoreMatches(requestId: string): Observable<FactorySupplyRequestDetail> {
    return this.http.post<FactorySupplyRequestDetail>(
      `${this.api}/requests/${requestId}/show-more`,
      {}
    );
  }

  updateGeoScope(
    requestId: string,
    payload: { geographicScope: string; selectedGovernorates?: string[] }
  ): Observable<FactorySupplyRequestDetail> {
    return this.http.put<FactorySupplyRequestDetail>(
      `${this.api}/requests/${requestId}/geo-scope`,
      payload
    );
  }

  getPublishedListings(options?: {
    cropTypeId?: string | null;
    governorate?: string | null;
  }): Observable<FarmListing[]> {
    let params = new HttpParams();
    if (options?.cropTypeId) params = params.set('cropTypeId', options.cropTypeId);
    if (options?.governorate) params = params.set('governorate', options.governorate);
    return this.http.get<FarmListing[]>(`${this.api}/listings`, { params });
  }

  getMatchedFarms(): Observable<FactoryMatchedFarm[]> {
    return this.http.get<FactoryMatchedFarm[]>(`${this.api}/matched-farms`);
  }

  getActiveMatchWithFarm(farmId: string): Observable<FactoryActiveMatch> {
    return this.http.get<FactoryActiveMatch>(
      `${this.api}/farms/${farmId}/active-match`
    );
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

  approveContract(
    contractId: string,
    body: { otpCode: string; consentText: string }
  ): Observable<FactoryContract> {
    return this.http.put<FactoryContract>(
      `${this.api}/contracts/${contractId}/approve`,
      body
    );
  }

  requestSigningOtp(contractId: string): Observable<{ expiresAt: string }> {
    return this.http.post<{ expiresAt: string }>(
      `${this.api}/contracts/${contractId}/signing-otp`,
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

  listContractAttachments(
    contractId: string
  ): Observable<ContractAttachmentDto[]> {
    return this.http.get<ContractAttachmentDto[]>(
      `${this.api}/contracts/${contractId}/attachments`
    );
  }

  uploadContractAttachment(
    contractId: string,
    file: File,
    kind: string
  ): Observable<ContractAttachmentDto> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('kind', kind);
    return this.http.post<ContractAttachmentDto>(
      `${this.api}/contracts/${contractId}/attachments`,
      form
    );
  }

  deleteContractAttachment(
    contractId: string,
    attachmentId: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.api}/contracts/${contractId}/attachments/${attachmentId}`
    );
  }

  getFulfillment(contractId: string): Observable<Fulfillment> {
    return this.http.get<Fulfillment>(
      `${this.api}/contracts/${contractId}/fulfillment`
    );
  }

  receiveFulfillment(
    contractId: string,
    body: ReceiveFulfillmentRequest
  ): Observable<Fulfillment> {
    return this.http.post<Fulfillment>(
      `${this.api}/contracts/${contractId}/fulfillment/receive`,
      body
    );
  }

  rejectAtGate(
    contractId: string,
    body: RejectAtGateRequest
  ): Observable<Fulfillment> {
    return this.http.post<Fulfillment>(
      `${this.api}/contracts/${contractId}/fulfillment/reject-at-gate`,
      body
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
    transactionId: string,
    receiptFile?: File
  ): Observable<PaymentMilestoneSchedule> {
    const form = new FormData();
    if (receiptFile) {
      form.append('receipt', receiptFile, receiptFile.name);
    }
    return this.http.post<PaymentMilestoneSchedule>(
      `${this.api}/contracts/${contractId}/payment-milestones/${transactionId}/mark-paid`,
      form
    );
  }

  createMockPaymentSession(
    contractId: string,
    transactionId: string,
    idempotencyKey?: string
  ): Observable<MockEscrowSession> {
    return this.http.post<MockEscrowSession>(
      `${this.api}/contracts/${contractId}/payments/mock/session`,
      {
        transactionId,
        idempotencyKey: idempotencyKey ?? null,
      }
    );
  }

  createPaymobPaymentSession(
    contractId: string,
    transactionId: string,
    idempotencyKey?: string
  ): Observable<MockEscrowSession> {
    return this.createMockPaymentSession(
      contractId,
      transactionId,
      idempotencyKey
    );
  }

  completePaymobSimulator(
    contractId: string,
    escrowId: string
  ): Observable<PaymentMilestoneSchedule> {
    return this.http.post<PaymentMilestoneSchedule>(
      `${this.api}/contracts/${contractId}/payments/paymob/${escrowId}/complete-simulator`,
      {}
    );
  }

  confirmMockPayment(
    contractId: string,
    escrowId: string
  ): Observable<PaymentMilestoneSchedule> {
    return this.http.post<PaymentMilestoneSchedule>(
      `${this.api}/contracts/${contractId}/payments/mock/${escrowId}/confirm-paid`,
      {}
    );
  }

  confirmEscrowRelease(
    contractId: string,
    escrowId: string
  ): Observable<PaymentMilestoneSchedule> {
    return this.http.post<PaymentMilestoneSchedule>(
      `${this.api}/contracts/${contractId}/escrow/${escrowId}/confirm-release`,
      {}
    );
  }

  listDisputes(contractId: string): Observable<Dispute[]> {
    return this.http.get<Dispute[]>(
      `${this.api}/contracts/${contractId}/disputes`
    );
  }

  listMyDisputes(page = 1, pageSize = 20): Observable<DisputeList> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<DisputeList>(`${this.api}/disputes`, { params });
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
  link?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}

export interface FactoryConversation {
  matchId: string;
  farmId?: string | null;
  farmName: string;
  cropName: string | null;
  status?: string | null;
  matchCreatedAt?: string | null;
  quantityTons?: number | null;
  pricePerTon?: number | null;
  deliveryDate?: string | null;
  contractId?: string | null;
  contractFullySigned?: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface FactoryActiveMatch {
  matchId: string;
  farmId: string;
  farmName: string;
  cropName?: string | null;
  createdAt: string;
  contractId?: string | null;
  contractFullySigned?: boolean;
  canMessage?: boolean;
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
  startsAt?: string | null;
  endsAt?: string | null;
  hasPendingDateAmendment?: boolean;
  pendingStartsAt?: string | null;
  pendingEndsAt?: string | null;
  dateAmendmentProposedByUserId?: string | null;
  deliveryLocation?: string | null;
  qualityRequirements?: string | null;
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
  integrity?: ContractIntegrity | null;
  farmUserId?: string | null;
  factoryUserId?: string | null;
  canUnwindSigned?: boolean;
  lastRevision?: import('../../../shared/contracts/contract-diff.util').ContractRevisionView | null;
}
