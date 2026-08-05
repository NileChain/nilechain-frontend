import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-forgot-password',
  imports: [
    RouterLink,
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
  ],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal('');

  constructor(title: Title) {
    title.setTitle('NileChain - Forgot Password');
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
          this.errorMessage.set(
            'Unable to send reset email. Please try again.'
          ),
      });
  }
}
