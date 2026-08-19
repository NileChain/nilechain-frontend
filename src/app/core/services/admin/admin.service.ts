import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AdminUser,
  AdminUsersQuery,
  CreateUserRequest,
  PagedResult,
  UpdateUserRequest,
} from '../../models/admin/admin-user.model';
import { StuckFulfillmentList } from '../../models/fulfillment/fulfillment.model';
import {
  AdminDisputeAction,
  Dispute,
  DisputeList,
} from '../../models/dispute/dispute.model';
import {
  AdminContractList,
  DashboardSummary,
} from '../../models/admin/admin-dashboard.model';

export interface RagUploadResult {
  documentId: string;
  title: string;
  category: string | null;
  indexedInChroma: boolean;
}

export interface RagDocumentDto {
  documentId: string;
  title: string;
  category: string | null;
  filePath: string;
  uploadedAt: string;
  status: string;
}

export interface VerifyUserResult {
  verified: boolean;
  kybIncomplete: boolean;
  missingKybKinds: string[];
  trustScore: number;
  overallSummary: string;
  recommendation?: string;
  comparison: {
    kybKind: string;
    provided: boolean;
    kindTrustScore: number;
    ragExcerpt?: string | null;
    reasons: string[];
    /** Signed contributions that add up to kindTrustScore. */
    factors?: KybScoreFactor[];
  }[];
}

export interface KybScoreFactor {
  code: string;
  delta: number;
}

export interface FarmHygieneDocument {
  documentId: string;
  fileName: string;
  fileUrl: string;
  kybKind: string;
  uploadedAt: string;
}

export interface FarmHygieneCert {
  certificationId: string;
  name: string;
  issuedAt: string;
  expiresAt: string | null;
  adminGranted: boolean;
  isExpired: boolean;
}

export interface FarmHygiene {
  farmId: string;
  farmName: string;
  isVerified: boolean;
  kybIncomplete: boolean;
  missingKybKinds: string[];
  documents: FarmHygieneDocument[];
  certifications: FarmHygieneCert[];
}

export interface FactoryHygiene {
  factoryId: string;
  factoryName: string;
  isVerified: boolean;
  kybIncomplete: boolean;
  missingKybKinds: string[];
  documents: FarmHygieneDocument[];
}

export interface AdminOpsBadges {
  pendingVerifications: number;
  openDisputes: number;
  pendingWithdrawals: number;
}

export interface KybDecisionRequest {
  reason?: string | null;
}

export interface AdminWithdrawal {
  withdrawalId: string;
  walletId: string;
  userId: string;
  ownerType: string;
  ownerId: string;
  amountEgp: number;
  status: string;
  method: string;
  destinationSummary?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface AdminWithdrawalList {
  totalCount: number;
  items: AdminWithdrawal[];
}

export interface AdminChannelMessage {
  channelMessageId: string;
  channel: string;
  toPhone: string;
  userId?: string | null;
  templateKey: string;
  body: string;
  status: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  failReason?: string | null;
  createdAt: string;
}

export interface AdminChannelMessageList {
  items: AdminChannelMessage[];
  disclaimer: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/admin`;

  getStuckFulfillments(
    page = 1,
    pageSize = 20
  ): Observable<StuckFulfillmentList> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<StuckFulfillmentList>(
      `${this.api}/fulfillments/stuck`,
      { params }
    );
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.api}/dashboard/summary`);
  }

  runMonitoringNow(): Observable<{
    success: boolean;
    summary: string;
    alertsSent: number;
    activeContractsReviewed: number;
    errorMessage?: string | null;
  }> {
    return this.http.post<{
      success: boolean;
      summary: string;
      alertsSent: number;
      activeContractsReviewed: number;
      errorMessage?: string | null;
    }>(`${this.api}/monitoring/run-now`, {});
  }

  getContracts(options: {
    status?: string | null;
    search?: string | null;
    page?: number;
    pageSize?: number;
  } = {}): Observable<AdminContractList> {
    let params = new HttpParams()
      .set('page', String(options.page ?? 1))
      .set('pageSize', String(options.pageSize ?? 20));
    if (options.status) {
      params = params.set('status', options.status);
    }
    if (options.search) {
      params = params.set('search', options.search);
    }
    return this.http.get<AdminContractList>(`${this.api}/contracts`, { params });
  }

  listDisputes(options: {
    status?: string | null;
    type?: string | null;
    page?: number;
    pageSize?: number;
  } = {}): Observable<DisputeList> {
    let params = new HttpParams()
      .set('page', String(options.page ?? 1))
      .set('pageSize', String(options.pageSize ?? 20));
    if (options.status) {
      params = params.set('status', options.status);
    }
    if (options.type) {
      params = params.set('type', options.type);
    }
    return this.http.get<DisputeList>(`${this.api}/disputes`, { params });
  }

  getDispute(disputeId: string): Observable<Dispute> {
    return this.http.get<Dispute>(`${this.api}/disputes/${disputeId}`);
  }

  moveDisputeUnderReview(
    disputeId: string,
    adminNote?: string
  ): Observable<Dispute> {
    return this.http.post<Dispute>(
      `${this.api}/disputes/${disputeId}/under-review`,
      { adminNote } satisfies AdminDisputeAction
    );
  }

  resolveDispute(
    disputeId: string,
    adminNote: string,
    outcomeFavor: string
  ): Observable<Dispute> {
    return this.http.post<Dispute>(
      `${this.api}/disputes/${disputeId}/resolve`,
      { adminNote, outcomeFavor } satisfies AdminDisputeAction
    );
  }

  rejectDispute(disputeId: string, adminNote: string): Observable<Dispute> {
    return this.http.post<Dispute>(
      `${this.api}/disputes/${disputeId}/reject`,
      { adminNote } satisfies AdminDisputeAction
    );
  }

  refundHeldEscrow(
    contractId: string,
    reason?: string
  ): Observable<void> {
    return this.http.post<void>(
      `${this.api}/contracts/${contractId}/escrow/refund-held`,
      { reason: reason ?? 'Admin refund of held escrow' }
    );
  }

  getUsers(query: AdminUsersQuery = {}): Observable<PagedResult<AdminUser>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('pageSize', String(query.pageSize ?? 10));

    if (query.role) {
      params = params.set('role', query.role);
    }
    if (query.isVerified != null) {
      params = params.set('isVerified', String(query.isVerified));
    }
    if (query.search) {
      params = params.set('search', query.search);
    }

    return this.http.get<PagedResult<AdminUser>>(`${this.api}/users`, {
      params,
    });
  }

  createUser(payload: CreateUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.api}/users`, payload);
  }

  updateUser(id: string, payload: UpdateUserRequest): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.api}/users/${id}`, payload);
  }

  uploadRagDocument(
    file: File,
    category?: string,
    title?: string
  ): Observable<RagUploadResult> {
    const form = new FormData();
    form.append('file', file);
    if (category) {
      form.append('category', category);
    }
    if (title) {
      form.append('title', title);
    }
    return this.http.post<RagUploadResult>(`${this.api}/rag/upload`, form);
  }

  getRagDocuments(): Observable<RagDocumentDto[]> {
    return this.http.get<RagDocumentDto[]>(`${this.api}/rag/documents`);
  }

  verifyUser(id: string): Observable<VerifyUserResult> {
    return this.analyzeKyb(id);
  }

  analyzeKyb(id: string): Observable<VerifyUserResult> {
    return this.http.post<VerifyUserResult>(
      `${this.api}/users/${id}/kyb/analyze`,
      {}
    );
  }

  getLastKybReport(id: string): Observable<VerifyUserResult> {
    return this.http.get<VerifyUserResult>(`${this.api}/users/${id}/kyb/report`);
  }

  approveUser(id: string, reason?: string | null): Observable<void> {
    return this.putNoContent(`${this.api}/users/${id}/approve`, {
      reason: reason ?? null,
    } satisfies KybDecisionRequest);
  }

  requestKybInfo(id: string, reason: string): Observable<void> {
    return this.putNoContent(`${this.api}/users/${id}/request-info`, {
      reason,
    } satisfies KybDecisionRequest);
  }

  rejectUser(id: string, reason: string): Observable<void> {
    return this.putNoContent(`${this.api}/users/${id}/reject`, {
      reason,
    } satisfies KybDecisionRequest);
  }

  /** Empty 200/204 bodies must not go through JSON parsing. */
  private putNoContent(url: string, body: unknown): Observable<void> {
    return this.http
      .put(url, body, { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  getFarmHygiene(farmId: string): Observable<FarmHygiene> {
    return this.http.get<FarmHygiene>(`${this.api}/farms/${farmId}/hygiene`);
  }

  getFactoryHygiene(factoryId: string): Observable<FactoryHygiene> {
    return this.http.get<FactoryHygiene>(
      `${this.api}/factories/${factoryId}/hygiene`
    );
  }

  getOpsBadges(): Observable<AdminOpsBadges> {
    return this.http.get<AdminOpsBadges>(`${this.api}/ops-badges`);
  }

  grantFarmCertification(
    farmId: string,
    payload: { certificationId: string; issuedAt?: string | null; expiresAt?: string | null }
  ): Observable<void> {
    return this.http.post<void>(`${this.api}/farms/${farmId}/certifications`, payload);
  }

  revokeFarmCertification(farmId: string, certificationId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.api}/farms/${farmId}/certifications/${certificationId}`
    );
  }

  listWithdrawals(status?: string | null): Observable<AdminWithdrawalList> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<AdminWithdrawalList>(`${this.api}/withdrawals`, { params });
  }

  completeWithdrawal(id: string): Observable<AdminWithdrawal> {
    return this.http.post<AdminWithdrawal>(`${this.api}/withdrawals/${id}/complete`, {});
  }

  rejectWithdrawal(id: string, reason?: string): Observable<AdminWithdrawal> {
    return this.http.post<AdminWithdrawal>(`${this.api}/withdrawals/${id}/reject`, {
      reason: reason ?? null,
    });
  }

  listChannelMessages(status?: string | null): Observable<AdminChannelMessageList> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<AdminChannelMessageList>(`${this.api}/channel-messages`, {
      params,
    });
  }

  setUserSubscription(
    id: string,
    planCode: string,
    periodEndUtc?: string | null
  ): Observable<unknown> {
    return this.http.put(`${this.api}/users/${id}/subscription`, {
      planCode,
      periodEndUtc: periodEndUtc ?? null,
    });
  }

  blockUser(id: string): Observable<void> {
    return this.http.put<void>(`${this.api}/users/${id}/block`, {});
  }

  unblockUser(id: string): Observable<void> {
    return this.http.put<void>(`${this.api}/users/${id}/unblock`, {});
  }

  deactivateUser(id: string): Observable<void> {
    return this.http.put<void>(`${this.api}/users/${id}/deactivate`, {});
  }

  reactivateUser(id: string): Observable<void> {
    return this.http.put<void>(`${this.api}/users/${id}/reactivate`, {});
  }

  deleteUser(id: string): Observable<void> {
    return this.http.put<void>(`${this.api}/users/${id}/delete`, {});
  }
}
