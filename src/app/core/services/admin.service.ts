import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminUser, PagedResult, CreateUserRequest, UpdateUserRequest } from '../models/admin-user.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/admin`;

  getUsers(role?: string, search?: string, page = 1, pageSize = 10): Observable<PagedResult<AdminUser>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (role) params = params.set('role', role);
    if (search) params = params.set('search', search);
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
}
