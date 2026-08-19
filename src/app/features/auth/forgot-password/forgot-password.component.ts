import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PageTitleService } from '../../../core/services/page-title.service';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateService } from '../../../core/services/translate.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiAuthWordmarkComponent } from '../../../shared/ui/auth-wordmark/auth-wordmark.component';

@Component({
  selector: 'app-forgot-password',
  imports: [
    RouterLink,
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiAuthWordmarkComponent,
  ],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslateService);

  readonly email = signal('');
  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal('');

  constructor(pageTitle: PageTitleService) {
    pageTitle.setKey('app.page.forgotPassword');
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    const email = this.email();
    if (!email) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService
      .forgotPassword({ email })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => this.submitted.set(true),
        error: () =>
          this.errorMessage.set(this.i18n.instant('forgotPassword.sendFailed')),
      });
  }
}
