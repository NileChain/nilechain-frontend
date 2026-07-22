import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  ForgotPasswordRequest,
  JwtPayload,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserProfile,
} from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly accessTokenSignal = signal<string | null>(
    this.tokenStorage.getAccessToken()
  );
  private readonly userSignal = signal<UserProfile | null>(
    this.buildUserFromToken(this.tokenStorage.getAccessToken())
  );

  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly currentUser = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() =>
    Boolean(this.accessTokenSignal() && this.userSignal())
  );
  readonly roles = computed(() => {
    const user = this.userSignal();

    if (!user) {
      return [];
    }

    if (user.roles?.length) {
      return user.roles;
    }

    if (user.role) {
      return [user.role];
    }

    return [];
  });

  login(payload: LoginRequest): Observable<UserProfile> {
    return this.http
      .post<AuthResponse>(this.getUrl(environment.auth.endpoints.login), payload)
      .pipe(
        tap((response) => this.establishSession(response)),
        map(() => this.userSignal() as UserProfile)
      );
  }

  register(payload: RegisterRequest): Observable<UserProfile> {
    return this.http
      .post<AuthResponse>(
        this.getUrl(environment.auth.endpoints.register),
        payload
      )
      .pipe(
        tap((response) => this.establishSession(response)),
        map(() => this.userSignal() as UserProfile)
      );
  }

  logout(): Observable<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    this.clearSession();

    if (!refreshToken) {
      return of(void 0);
    }

    return this.http
      .post<void>(this.getUrl(environment.auth.endpoints.logout), {
        refreshToken,
      })
      .pipe(map(() => void 0));
  }

  hasAnyRole(roles: string[]): boolean {
    if (roles.length === 0) {
      return true;
    }

    const normalizedUserRoles = this.roles().map((role) => role.toLowerCase());
    return roles.some((role) =>
      normalizedUserRoles.includes(role.toLowerCase())
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    return this.http
      .post<AuthResponse>(this.getUrl(environment.auth.endpoints.refresh), { refreshToken } as RefreshTokenRequest)
      .pipe(
        tap((response) => this.establishSession(response))
      );
  }

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.getUrl(environment.auth.endpoints.me));
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(this.getUrl(environment.auth.endpoints.forgotPassword), payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(this.getUrl(environment.auth.endpoints.resetPassword), payload);
  }

  confirmEmail(userId: string, token: string): Observable<void> {
    return this.http.get<void>(`${this.getUrl(environment.auth.endpoints.confirmEmail)}?userId=${userId}&token=${encodeURIComponent(token)}`);
  }

  updatePhone(phoneNumber: string): Observable<void> {
    return this.http.put<void>(this.getUrl(environment.auth.endpoints.phone), { phoneNumber });
  }

  private establishSession(response: AuthResponse): void {
    this.tokenStorage.setTokens(response.accessToken, response.refreshToken);
    this.accessTokenSignal.set(response.accessToken);

    const userFromToken = this.buildUserFromToken(response.accessToken);

    if (response.user) {
      this.userSignal.set({
        ...response.user,
        roles: response.user.role ? [response.user.role] : [],
      });
    } else {
      this.userSignal.set(userFromToken);
    }
  }

  clearSession(): void {
    this.tokenStorage.clear();
    this.accessTokenSignal.set(null);
    this.userSignal.set(null);
  }

  private getUrl(endpointPath: string): string {
    return `${environment.backendUrl}${endpointPath}`;
  }

  private buildUserFromToken(token: string | null): UserProfile | null {
    if (!token) {
      return null;
    }

    const payload = this.parseJwt(token);
    if (!payload) {
      return null;
    }

    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      this.tokenStorage.clear();
      return null;
    }

    const roles = this.extractRoles(payload);
    const email = payload.email ?? payload.unique_name ?? '';
    const id = payload.sub ?? payload.nameid;

    return {
      id,
      email,
      displayName: payload.unique_name,
      roles,
    };
  }

  private parseJwt(token: string): JwtPayload | null {
    try {
      const [, encodedPayload] = token.split('.');
      if (!encodedPayload) {
        return null;
      }

      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const normalized = atob(base64);
      return JSON.parse(normalized) as JwtPayload;
    } catch {
      return null;
    }
  }

  private extractRoles(payload: JwtPayload): string[] {
    if (Array.isArray(payload.roles)) {
      return payload.roles;
    }

    if (Array.isArray(payload.role)) {
      return payload.role;
    }

    if (typeof payload.role === 'string') {
      return [payload.role];
    }

    return [];
  }
}
