import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiBrandMarkComponent } from '../../../shared/ui/brand-mark/brand-mark.component';

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiBrandMarkComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly passwordFieldType = signal<'password' | 'text'>('password');
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly passwordVisibilityIcon = computed(() =>
    this.passwordFieldType() === 'password' ? 'visibility' : 'visibility_off'
  );

  constructor(title: Title) {
    title.setTitle('NileChain - Login');
  }

  togglePassword(): void {
    this.passwordFieldType.update((value) =>
      value === 'password' ? 'text' : 'password'
    );
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const rememberMe = Boolean(formData.get('rememberMe'));

    if (!email || !password) {
      this.errorMessage.set('login.errors.required');
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.authService
      .login({ email, password, rememberMe })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          const returnUrl =
            this.activatedRoute.snapshot.queryParamMap.get('returnUrl');
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
            return;
          }

          if (this.authService.hasAnyRole(['Admin'])) {
            void this.router.navigate(['/admin-dashboard']);
            return;
          }

          if (this.authService.hasAnyRole(['Factory'])) {
            void this.router.navigate(['/factory/home']);
            return;
          }

          if (this.authService.hasAnyRole(['Farm'])) {
            void this.router.navigate(['/farm/home']);
            return;
          }

          void this.router.navigate(['/landing']);
        },
        error: () => {
          this.errorMessage.set('login.errors.invalid');
        },
      });
  }
}
