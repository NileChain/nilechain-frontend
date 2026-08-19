import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Blocks access to core pages when `currentUser.isVerified === false`.
 * Profile/document pages and the pending page remain accessible.
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

  if (user.isVerified) {
    return true;
  }

  return router.createUrlTree(['/verification-pending']);
};

