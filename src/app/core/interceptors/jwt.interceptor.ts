import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  Observable,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { TranslateService } from '../services/translate.service';

/** Single-flight refresh so parallel 401s share one refresh call. */
let refreshInFlight$: Observable<AuthResponse> | null = null;

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const i18n = inject(TranslateService);

  let headers = req.headers;
  const token = authService.accessToken();
  const hasAuthHeader = headers.has('Authorization');

  if (token && !hasAuthHeader) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  if (environment.apiKey) {
    const apiKeyHeaderValue = `${environment.apiKeyPrefix} ${environment.apiKey}`;
    headers = headers.set(environment.apiKeyHeader, apiKeyHeaderValue);
  }

  const clonedReq = req.clone({ headers });

  return next(clonedReq).pipe(
    catchError((error) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 403) {
        toast.error(i18n.instant('errors.forbidden'));
        return throwError(() => error);
      }

      if (
        error.status === 401 &&
        !req.url.includes('refresh-token') &&
        !req.url.includes('login') &&
        !req.url.includes('register')
      ) {
        if (!refreshInFlight$) {
          refreshInFlight$ = authService.refreshToken().pipe(
            finalize(() => {
              refreshInFlight$ = null;
            }),
            shareReplay({ bufferSize: 1, refCount: true })
          );
        }

        return refreshInFlight$.pipe(
          switchMap((response) => {
            const newHeaders = clonedReq.headers.set(
              'Authorization',
              `Bearer ${response.accessToken}`
            );
            return next(clonedReq.clone({ headers: newHeaders }));
          }),
          catchError(() => {
            authService.clearSession();
            router.navigate(['/login']);
            return throwError(() => error);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
