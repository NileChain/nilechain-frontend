import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Blocks access to core pages when `currentUser.isVerified === false`.
 * Profile/document pages and the pending page remain accessible.
 *
 * If the in-memory user is not yet verified (or isVerified is unknown after a
 * full reload), re-check /me so a just-approved KYB decision is picked up and
 * Paymob wallet returns are not sent to the update-documents screen.
 */
export const kybVerifiedGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (route.data?.['allowUnverified'] === true) {
    return true;
  }

  const user = authService.currentUser();
  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (user.isVerified === true) {
    return true;
  }

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return authService.refreshCurrentUser().pipe(
    map((fresh) => (fresh.isVerified ? true : pendingTree(router))),
    catchError(() => of<boolean | UrlTree>(pendingTree(router)))
  );
};

function pendingTree(router: Router): UrlTree {
  return router.createUrlTree(['/verification-pending']);
}
