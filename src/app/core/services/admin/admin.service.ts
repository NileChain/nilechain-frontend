import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  verifyUser(id: string): Observable<void> {
    return this.http.put<void>(`${this.api}/users/${id}/verify`, {});
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
}
