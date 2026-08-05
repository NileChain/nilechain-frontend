import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-reset-password',
  imports: [
    RouterLink,
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
  ],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly token = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly passwordFieldType = signal<'password' | 'text'>('password');
  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal('');
  readonly tokenValid = signal(true);

  constructor(title: Title) {
    title.setTitle('NileChain - Reset Password');
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const email = params['email'] || '';
      const token = params['token'] || '';
      if (!email || !token) {
        this.tokenValid.set(false);
        this.errorMessage.set('Invalid or missing reset link.');
        return;
      }
      this.email.set(decodeURIComponent(email));
      this.token.set(decodeURIComponent(token));
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    const email = this.email();
    const token = this.token();
    const newPassword = this.newPassword();
    const confirmPassword = this.confirmPassword();

    if (!email || !token || !newPassword || !confirmPassword) {
      this.errorMessage.set('Please complete all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService
      .resetPassword({ email, token, newPassword, confirmPassword })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => this.submitted.set(true),
        error: () =>
          this.errorMessage.set(
            'Failed to reset password. The link may have expired.'
          ),
      });
  }
}
