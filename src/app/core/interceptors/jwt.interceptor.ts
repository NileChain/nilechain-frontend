import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

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

  return next(req.clone({ headers }));
};
