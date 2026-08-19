import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PageTitleService } from '../../../core/services/page-title.service';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/user.model';
import { FarmService } from '../../../core/services/farm/farm.service';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { KybKind } from '../../../core/models/farm/farm-profile.model';
import {
  isValidEgyptianPhone,
  normalizeEgyptianPhone,
} from '../../../core/validation/egyptian-phone';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { GovLabelPipe } from '../../../core/pipes/gov-label.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiBrandMarkComponent } from '../../../shared/ui/brand-mark/brand-mark.component';
import { UiAuthWordmarkComponent } from '../../../shared/ui/auth-wordmark/auth-wordmark.component';
import { EGYPT_GOVERNORATES } from '../../../shared/geo/egypt-governorates';

/** Matches ASP.NET Identity default password rules (+ RequiredLength = 8). */
const PASSWORD_RULES = {
  minLength: (v: string) => v.length >= 8,
  upper: (v: string) => /[A-Z]/.test(v),
  lower: (v: string) => /[a-z]/.test(v),
  digit: (v: string) => /[0-9]/.test(v),
  special: (v: string) => /[^a-zA-Z0-9]/.test(v),
};

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    RouterLink,
    TranslatePipe,
    GovLabelPipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiBrandMarkComponent,
    UiAuthWordmarkComponent,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly farmService = inject(FarmService);
  private readonly factoryService = inject(FactoryService);
  private readonly router = inject(Router);

  readonly selectedRole = signal<'' | 'farm' | 'factory'>('');
  readonly passwordFieldType = signal<'password' | 'text'>('password');
  readonly confirmPasswordFieldType = signal<'password' | 'text'>('password');
  readonly passwordValue = signal('');
  readonly confirmPasswordValue = signal('');
  readonly confirmTouched = signal(false);
  readonly passwordTouched = signal(false);
  readonly submitted = signal(false);
  readonly showToast = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly emailValue = signal('');
  readonly phoneValue = signal('');

  readonly farmName = signal('');
  readonly farmGovernorate = signal('');
  /** null until the user enters a valid positive size — never submit 0 by default. */
  readonly farmSize = signal<number | null>(null);

  readonly factoryName = signal('');
  readonly factoryGovernorate = signal('');
  readonly requiredKybKinds: KybKind[] = [
    'CommercialRegister',
    'TaxCard',
    'NationalId',
  ];
  readonly kybFiles = signal<Partial<Record<KybKind, File | null>>>({});

  readonly governorates = EGYPT_GOVERNORATES;

  onFarmSizeInput(value: string): void {
    const trimmed = value.trim();
    if (trimmed === '') {
      this.farmSize.set(null);
      return;
    }
    const n = Number(trimmed);
    this.farmSize.set(Number.isFinite(n) ? n : null);
  }

  readonly passwordVisibilityIcon = computed(() =>
    this.passwordFieldType() === 'password' ? 'visibility' : 'visibility_off'
  );

  readonly confirmPasswordVisibilityIcon = computed(() =>
    this.confirmPasswordFieldType() === 'password'
      ? 'visibility'
      : 'visibility_off'
  );

  readonly passwordChecks = computed(() => {
    const v = this.passwordValue();
    return {
      minLength: PASSWORD_RULES.minLength(v),
      upper: PASSWORD_RULES.upper(v),
      lower: PASSWORD_RULES.lower(v),
      digit: PASSWORD_RULES.digit(v),
      special: PASSWORD_RULES.special(v),
    };
  });

  readonly passwordValid = computed(() => {
    const c = this.passwordChecks();
    return c.minLength && c.upper && c.lower && c.digit && c.special;
  });

  readonly passwordsMismatch = computed(() => {
    const password = this.passwordValue();
    const confirmPassword = this.confirmPasswordValue();
    return Boolean(password && confirmPassword && password !== confirmPassword);
  });

  readonly showMatchError = computed(
    () =>
      (this.confirmTouched() || this.submitted()) && this.passwordsMismatch()
  );

  readonly showPasswordErrors = computed(
    () =>
      (this.passwordTouched() || this.submitted()) &&
      Boolean(this.passwordValue()) &&
      !this.passwordValid()
  );

  readonly farmSizeInvalid = computed(() => {
    if (this.selectedRole() !== 'farm') {
      return false;
    }
    const size = this.farmSize();
    return size == null || !(size > 0);
  });

  readonly farmDetailsInvalid = computed(() => {
    if (this.selectedRole() !== 'farm') {
      return false;
    }
    return (
      !this.farmName().trim() ||
      !this.farmGovernorate().trim() ||
      this.farmSizeInvalid()
    );
  });

  readonly factoryDetailsInvalid = computed(() => {
    if (this.selectedRole() !== 'factory') {
      return false;
    }
    return !this.factoryName().trim() || !this.factoryGovernorate().trim();
  });

  readonly canSubmit = computed(() => {
    const role = this.selectedRole();
    if (!role || this.isSubmitting()) {
      return false;
    }
    if (!this.emailValue().trim()) {
      return false;
    }
    if (!isValidEgyptianPhone(this.phoneValue())) {
      return false;
    }
    if (!this.passwordValid() || this.passwordsMismatch()) {
      return false;
    }
    if (!this.passwordValue() || !this.confirmPasswordValue()) {
      return false;
    }
    if (role === 'farm' && this.farmDetailsInvalid()) {
      return false;
    }
    if (role === 'factory' && this.factoryDetailsInvalid()) {
      return false;
    }
    if (!this.hasRequiredKybDocuments()) {
      return false;
    }
    return true;
  });

  readonly hasRequiredKybDocuments = computed(() =>
    this.requiredKybKinds.every((kind) => Boolean(this.kybFiles()[kind]))
  );

  phoneValid(): boolean {
    return isValidEgyptianPhone(this.phoneValue());
  }

  constructor(pageTitle: PageTitleService) {
    pageTitle.setKey('app.page.register');
  }

  selectRole(role: 'farm' | 'factory'): void {
    this.selectedRole.set(role);
  }

  onKybFileSelected(kind: KybKind, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.kybFiles.update((current) => ({
      ...current,
      [kind]: file,
    }));
  }

  selectedKybFileName(kind: KybKind): string {
    return this.kybFiles()[kind]?.name ?? '';
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
    this.passwordTouched.set(true);
  }

  onConfirmInput(value: string): void {
    this.confirmPasswordValue.set(value);
    this.confirmTouched.set(true);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    this.passwordTouched.set(true);
    this.confirmTouched.set(true);
    this.errorMessage.set('');

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? this.emailValue()).trim();
    const role = this.selectedRole();

    if (!role) {
      this.errorMessage.set('register.errors.selectRole');
      return;
    }

    if (!email || !this.passwordValue() || !this.confirmPasswordValue()) {
      this.errorMessage.set('register.errors.required');
      return;
    }

    if (!isValidEgyptianPhone(this.phoneValue())) {
      this.errorMessage.set('validation.egyptianPhone');
      return;
    }

    if (!this.passwordValid()) {
      this.errorMessage.set('register.errors.weakPassword');
      return;
    }

    if (this.passwordsMismatch()) {
      return;
    }

    if (role === 'farm') {
      if (!this.farmName().trim()) {
        this.errorMessage.set('register.errors.farmNameRequired');
        return;
      }
      if (!this.farmGovernorate().trim()) {
        this.errorMessage.set('register.errors.governorateRequired');
        return;
      }
      if (this.farmSizeInvalid()) {
        this.errorMessage.set('register.errors.sizeRequired');
        return;
      }
    }

    if (role === 'factory') {
      if (!this.factoryName().trim()) {
        this.errorMessage.set('register.errors.factoryNameRequired');
        return;
      }
      if (!this.factoryGovernorate().trim()) {
        this.errorMessage.set('register.errors.governorateRequired');
        return;
      }
    }

    if (!this.hasRequiredKybDocuments()) {
      this.errorMessage.set('register.kyb.required');
      return;
    }

    if (!this.canSubmit()) {
      this.errorMessage.set('register.errors.required');
      return;
    }

    const password = this.passwordValue();
    const confirmPassword = this.confirmPasswordValue();

    this.isSubmitting.set(true);

    const registerPayload: RegisterRequest = {
      email,
      password,
      confirmPassword,
      businessType: role,
      phone: normalizeEgyptianPhone(this.phoneValue()),
    };

    if (role === 'farm') {
      registerPayload.name = this.farmName().trim();
      registerPayload.governorate = this.farmGovernorate().trim();
      registerPayload.sizeInFeddans = this.farmSize() as number;
    }

    if (role === 'factory') {
      registerPayload.name = this.factoryName().trim();
      registerPayload.governorate = this.factoryGovernorate().trim();
    }

    this.authService
      .register(registerPayload)
      .pipe(
        switchMap(() =>
          this.uploadRegistrationDocuments(role).pipe(
            map(() => ({ uploadComplete: true })),
            catchError(() => of({ uploadComplete: false }))
          )
        ),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: ({ uploadComplete }) => {
          this.showToast.set(true);

          if (this.authService.hasAnyRole(['Admin'])) {
            void this.router.navigate(['/admin-dashboard']);
            return;
          }

          if (!uploadComplete) {
            this.errorMessage.set('register.kyb.uploadAfterRegisterFailed');
            void this.router.navigate(['/verification-pending'], {
              queryParams: { documents: 'incomplete' },
            });
            return;
          }

          const isVerified = this.authService.currentUser()?.isVerified;
          if (isVerified) {
            if (this.authService.hasAnyRole(['Factory'])) {
              void this.router.navigate(['/factory/home']);
              return;
            }

            if (this.authService.hasAnyRole(['Farm'])) {
              void this.router.navigate(['/farm/home']);
              return;
            }

            void this.router.navigate(['/landing']);
            return;
          }

          void this.router.navigate(['/verification-pending']);
        },
        error: (err: unknown) => {
          const httpErr = err as {
            status?: number;
            error?: { message?: string; detail?: string };
          };
          const rawMsg =
            httpErr?.error?.message ||
            httpErr?.error?.detail ||
            (typeof err === 'object' && err !== null && 'message' in err
              ? String((err as { message?: unknown }).message)
              : '');

          const message = rawMsg
            ? rawMsg.replace(/^(Auth\.\w+:\s*)/i, '')
            : 'register.errors.failed';

          this.errorMessage.set(message);
        },
      });
  }

  private uploadRegistrationDocuments(role: 'farm' | 'factory') {
    const uploads = this.requiredKybKinds
      .map((kind) => {
        const file = this.kybFiles()[kind];
        if (!file) {
          return null;
        }

        return role === 'farm'
          ? this.farmService.addDocument(file, kind)
          : this.factoryService.addDocument(file, kind);
      })
      .filter((upload): upload is NonNullable<typeof upload> => upload !== null);

    if (uploads.length === 0) {
      return of([]);
    }

    return forkJoin(uploads);
  }
}
