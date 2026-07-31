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

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/admin`;

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

    return this.http.get<PagedResult<AdminUser>>(`${this.api}/users`, { params });
  }

  createUser(payload: CreateUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.api}/users`, payload);
  }

  updateUser(id: string, payload: UpdateUserRequest): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.api}/users/${id}`, payload);
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
