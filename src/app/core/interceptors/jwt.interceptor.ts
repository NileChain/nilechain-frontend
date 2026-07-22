import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

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
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.includes('refresh-token') &&
        !req.url.includes('login') &&
        !req.url.includes('register')
      ) {
        return authService.refreshToken().pipe(
          switchMap((response) => {
            const newHeaders = clonedReq.headers.set('Authorization', `Bearer ${response.accessToken}`);
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
