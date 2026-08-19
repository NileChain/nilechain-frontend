import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiBrandMarkComponent } from '../../../shared/ui/brand-mark/brand-mark.component';
import { UiAuthWordmarkComponent } from '../../../shared/ui/auth-wordmark/auth-wordmark.component';

@Component({
  selector: 'app-verification-pending',
  imports: [
    RouterLink,
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiBrandMarkComponent,
    UiAuthWordmarkComponent,
  ],
  templateUrl: './verification-pending.component.html',
  styleUrl: './verification-pending.component.scss',
})
export class VerificationPendingComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly documentsIncomplete = computed(
    () => this.route.snapshot.queryParamMap.get('documents') === 'incomplete'
  );

  readonly profileLink = computed(() => {
    if (this.authService.hasAnyRole(['Factory'])) {
      return '/factory/profile';
    }

    if (this.authService.hasAnyRole(['Farm'])) {
      return '/farm/profile';
    }

    return '/landing';
  });

  readonly kybStatus = computed(
    () => this.authService.currentUser()?.kybReviewStatus ?? 'Pending'
  );
  readonly adminNote = computed(
    () => this.authService.currentUser()?.kybAdminNote ?? ''
  );
  readonly isRequestInfo = computed(
    () => this.kybStatus().toLowerCase() === 'requestinfo'
  );
  readonly isRejected = computed(
    () => this.kybStatus().toLowerCase() === 'rejected'
  );
  /** Admin asked for more files, or upload/register docs are still missing. */
  readonly needsDocumentUpdate = computed(
    () =>
      this.isRequestInfo() || this.isRejected() || this.documentsIncomplete()
  );

  constructor(pageTitle: PageTitleService) {
    pageTitle.setKey('app.page.pendingVerification');
  }

  ngOnInit(): void {
    const paymobQuery = this.paymobReturnQuery();
    this.authService.refreshCurrentUser().subscribe({
      next: (user) => {
        if (!user.isVerified) {
          return;
        }
        if (paymobQuery) {
          void this.router.navigate([this.walletPath()], {
            queryParams: paymobQuery,
            replaceUrl: true,
          });
          return;
        }
        void this.router.navigateByUrl(this.homePath());
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => void this.router.navigate(['/login']),
    });
  }

  private homePath(): string {
    if (this.authService.hasAnyRole(['Factory'])) {
      return '/factory/home';
    }
    if (this.authService.hasAnyRole(['Farm'])) {
      return '/farm/home';
    }
    return '/landing';
  }

  private walletPath(): string {
    if (this.authService.hasAnyRole(['Factory'])) {
      return '/factory/wallet';
    }
    if (this.authService.hasAnyRole(['Farm'])) {
      return '/farm/wallet';
    }
    return this.homePath();
  }

  private paymobReturnQuery(): Record<string, string> | null {
    const params = this.route.snapshot.queryParamMap;
    const isPaymobReturn =
      params.has('hmac') ||
      params.has('topUpId') ||
      params.has('success') ||
      params.has('id');
    if (!isPaymobReturn) {
      return null;
    }
    const query: Record<string, string> = {};
    params.keys.forEach((key) => {
      const value = params.get(key);
      if (value != null) {
        query[key] = value;
      }
    });
    return query;
  }
}
