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

  constructor(pageTitle: PageTitleService) {
    pageTitle.setKey('app.page.pendingVerification');
  }

  ngOnInit(): void {
    this.authService.refreshCurrentUser().subscribe();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => void this.router.navigate(['/login']),
    });
  }
}
