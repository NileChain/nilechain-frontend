import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { FactoryService } from '../../../core/services/factory.service';
import { AuthService } from '../../../core/services/auth.service';
import { FactoryProfile } from '../../../core/models/factory.model';
import { UpdateFactoryProfileRequest } from '../../../core/models/factory.model';

@Component({
  selector: 'app-factory-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiLoaderComponent,
  ],
  templateUrl: './factory-profile.component.html',
})
export class FactoryProfileComponent implements OnInit {

  private readonly factoryService = inject(FactoryService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly currentUser = this.authService.currentUser;

  readonly profile = signal<FactoryProfile | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', Validators.required),
    location: this.fb.nonNullable.control(''),
    governorate: this.fb.nonNullable.control('', Validators.required),
    industryType: this.fb.nonNullable.control(''),
  });

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saveSuccess = signal(false);

  readonly phoneNumber = signal('');
  readonly updatingPhone = signal(false);

  readonly toastMessage = signal('');
  readonly showToast = signal(false);
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);

    this.factoryService
      .getProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.profile.set(response);
          this.phoneNumber.set(response.phone || '');
          this.form.patchValue({
            name: response.name,
            location: response.location,
            governorate: response.governorate,
            industryType: response.industryType ?? '',
          });
        },
        error: (err) => {
          console.error(err);
          this.error.set('Failed to load profile.');
        },
      });
  }

  private showToastMessage(msg: string): void {
    this.toastMessage.set(msg);
    this.showToast.set(true);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.showToast.set(false), 3000);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('factory.profile.validationError');
      this.showToastMessage('factory.profile.validationError');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.saveSuccess.set(false);

    const raw = this.form.getRawValue();
    const payload: UpdateFactoryProfileRequest = {
      ...raw,
    };

    this.factoryService
      .updateProfile(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.loadProfile();
          this.showToastMessage('factory.profile.saved');
        },
        error: (err) => {
          console.error(err);
          const serverErrors = err.error?.errors;
          if (serverErrors) {
            const messages = Object.values(serverErrors).flat().join('; ');
            this.error.set(messages || 'Failed to save profile.');
          } else {
            this.error.set(err.error?.title || 'Failed to save profile.');
          }
          this.showToastMessage('factory.profile.saveFailed');
        },
      });
  }

  updatePhone(): void {
    const phone = this.phoneNumber();
    if (!phone) return;

    this.updatingPhone.set(true);
    this.authService.updatePhone(phone).pipe(finalize(() => this.updatingPhone.set(false))).subscribe({
      next: () => {
        this.profile.update(p => {
          if (!p) return p;
          const fields = [p.name, p.location, p.governorate, p.industryType, phone].filter(Boolean).length;
          return { ...p, phone, completionPercent: Math.round((fields / 5) * 100) };
        });
        this.showToastMessage('factory.profile.phoneUpdated');
      },
      error: () => this.showToastMessage('factory.profile.phoneUpdateFailed'),
    });
  }
}
