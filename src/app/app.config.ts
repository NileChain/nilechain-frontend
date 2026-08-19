import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { catchError, firstValueFrom, of } from 'rxjs';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { AuthService } from './core/services/auth.service';
import { LocaleService } from './core/services/locale.service';
import { ThemeService } from './core/services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAppInitializer(() => {
      inject(ThemeService);
      const locale = inject(LocaleService);
      const auth = inject(AuthService);
      return locale.setLocale(locale.locale()).then(() => {
        if (!auth.isAuthenticated()) {
          return;
        }
        return firstValueFrom(
          auth.refreshCurrentUser().pipe(catchError(() => of(null)))
        );
      });
    }),
  ],
};
