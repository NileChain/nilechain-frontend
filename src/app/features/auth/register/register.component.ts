import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly selectedRole = signal<'' | 'farm' | 'factory'>('');
  readonly passwordFieldType = signal<'password' | 'text'>('password');
  readonly confirmPasswordFieldType = signal<'password' | 'text'>('password');
  readonly passwordValue = signal('');
  readonly confirmPasswordValue = signal('');
  readonly confirmTouched = signal(false);
  readonly submitted = signal(false);
  readonly showToast = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly passwordVisibilityIcon = computed(() =>
    this.passwordFieldType() === 'password' ? 'visibility' : 'visibility_off'
  );

  readonly confirmPasswordVisibilityIcon = computed(() =>
    this.confirmPasswordFieldType() === 'password'
      ? 'visibility'
      : 'visibility_off'
  );

  readonly passwordsMismatch = computed(() => {
    const password = this.passwordValue();
    const confirmPassword = this.confirmPasswordValue();

    return Boolean(password && confirmPassword && password !== confirmPassword);
  });

  readonly showMatchError = computed(
    () => (this.confirmTouched() || this.submitted()) && this.passwordsMismatch()
  );

  constructor(title: Title) {
    title.setTitle('NileChain - Register');
  }

  selectRole(role: 'farm' | 'factory'): void {
    this.selectedRole.set(role);
  }

  togglePassword(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.passwordFieldType.update((value) =>
        value === 'password' ? 'text' : 'password'
      );
      return;
    }

    this.confirmPasswordFieldType.update((value) =>
      value === 'password' ? 'text' : 'password'
    );
  }

  onPasswordInput(value: string): void {
    this.passwordValue.set(value);
  }

  onConfirmInput(value: string): void {
    this.confirmPasswordValue.set(value);
    this.confirmTouched.set(true);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    this.errorMessage.set('');

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim();
    const role = this.selectedRole();

    if (!role) {
      alert('Please select a business type (Farm or Factory)');
      return;
    }

    if (this.passwordsMismatch()) {
      return;
    }

    const password = this.passwordValue();
    const confirmPassword = this.confirmPasswordValue();
    if (!email || !password || !confirmPassword) {
      this.errorMessage.set('Please complete all required fields.');
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .register({
        email,
        password,
        confirmPassword,
        role,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.showToast.set(true);

          if (this.authService.hasAnyRole(['Factory', 'Admin'])) {
            void this.router.navigate(['/factory-dashboard']);
            return;
          }

          if (this.authService.hasAnyRole(['Farm'])) {
            void this.router.navigate(['/farm-dashboard']);
            return;
          }

          void this.router.navigate(['/landing']);
        },
        error: () => {
          this.errorMessage.set(
            'Unable to create account right now. Please try again.'
          );
        },
      });
  }
}
