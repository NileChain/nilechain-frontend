import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { LocationPickerComponent } from '../../../shared/components/location-picker/location-picker.component';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import {
  FactoryProfile,
  UpdateFactoryProfileRequest,
} from '../../../core/models/factory/factory-profile.model';
import { CropType } from '../../../core/models/farm/farm-profile.model';
import { PickedLocation } from '../../../shared/geo/egypt-governorates';
import {
  EGYPTIAN_PHONE_ERROR_KEY,
  isValidEgyptianPhone,
  normalizeEgyptianPhone,
} from '../../../core/validation/egyptian-phone';

@Component({
  selector: 'app-factory-profile',
  standalone: true,
  imports: [
    TranslatePipe,
    UiLoaderComponent,
    UiErrorStateComponent,
    AppTopBarComponent,
    ReactiveFormsModule,
    DecimalPipe,
    LocationPickerComponent,
    RouterLink,
  ],
  templateUrl: './factory-profile.component.html',
  styleUrl: './factory-profile.component.scss',
})
export class FactoryProfileComponent implements OnInit {
  private readonly factoryService = inject(FactoryService);
  private readonly farmService = inject(FarmService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly updatingPhone = signal(false);
  readonly cropsLoading = signal(true);
  readonly cropsError = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly saveSuccess = signal(false);
  readonly phoneError = signal<string | null>(null);
  readonly profile = signal<FactoryProfile | null>(null);
  readonly cropTypes = signal<CropType[]>([]);
  readonly phoneNumber = signal('');
  readonly mapInitial = signal<{
    latitude?: number | null;
    longitude?: number | null;
    governorate?: string | null;
  } | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', Validators.required),
    location: this.fb.nonNullable.control(''),
    governorate: this.fb.nonNullable.control('', Validators.required),
    latitude: this.fb.control<number | null>(null),
    longitude: this.fb.control<number | null>(null),
    industryType: this.fb.nonNullable.control(''),
  });

  ngOnInit(): void {
    this.loadProfile();
    this.loadCropTypes();
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
            location: response.location ?? '',
            governorate: response.governorate ?? '',
            latitude: response.latitude ?? null,
            longitude: response.longitude ?? null,
            industryType: response.industryType ?? '',
          });
          this.mapInitial.set({
            latitude: response.latitude,
            longitude: response.longitude,
            governorate: response.governorate,
          });
        },
        error: () =>
          this.error.set(this.i18n.instant('factory.profile.loadFailed')),
      });
  }

  loadCropTypes(): void {
    this.cropsLoading.set(true);
    this.cropsError.set(null);
    this.farmService
      .getCropTypes()
      .pipe(finalize(() => this.cropsLoading.set(false)))
      .subscribe({
        next: (crops) => this.cropTypes.set(crops),
        error: () =>
          this.cropsError.set(
            this.i18n.instant('factory.profile.cropsLoadFailed')
          ),
      });
  }

  /** Industry options from master crops; preserve legacy free-text values. */
  industryOptions(): string[] {
    const names = this.cropTypes().map((c) => c.name);
    const current = this.form.controls.industryType.value?.trim();
    if (current && !names.some((n) => n.toLowerCase() === current.toLowerCase())) {
      return [current, ...names];
    }
    return names;
  }

  onLocationPicked(loc: PickedLocation): void {
    const coords = `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
    this.form.patchValue({
      latitude: loc.latitude,
      longitude: loc.longitude,
      governorate: loc.governorate,
      location: `${loc.governorateAr} (${loc.governorate}) · ${coords}`,
    });
    this.form.controls.governorate.markAsDirty();
    this.form.controls.location.markAsDirty();
  }

  starSlots(rating: number): Array<'full' | 'half' | 'empty'> {
    const clamped = Math.max(0, Math.min(5, Number(rating) || 0));
    const slots: Array<'full' | 'half' | 'empty'> = [];
    for (let i = 1; i <= 5; i++) {
      if (clamped >= i) slots.push('full');
      else if (clamped >= i - 0.5) slots.push('half');
      else slots.push('empty');
    }
    return slots;
  }

  updatePhone(): void {
    const raw = this.phoneNumber();
    this.phoneError.set(null);
    if (!raw?.trim()) {
      this.phoneError.set(this.i18n.instant(EGYPTIAN_PHONE_ERROR_KEY));
      return;
    }
    if (!isValidEgyptianPhone(raw)) {
      this.phoneError.set(this.i18n.instant(EGYPTIAN_PHONE_ERROR_KEY));
      return;
    }

    const normalized = normalizeEgyptianPhone(raw);
    this.phoneNumber.set(normalized);
    this.updatingPhone.set(true);
    this.authService
      .updatePhone(normalized)
      .pipe(finalize(() => this.updatingPhone.set(false)))
      .subscribe({
        next: () => {
          this.toast.success(this.i18n.instant('factory.profile.phoneUpdated'));
          this.loadProfile();
        },
        error: (err) => {
          this.phoneError.set(
            err?.error?.message ||
              this.i18n.instant(EGYPTIAN_PHONE_ERROR_KEY)
          );
        },
      });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: UpdateFactoryProfileRequest = {
      name: raw.name,
      location: raw.location || raw.governorate || null,
      governorate: raw.governorate || null,
      latitude: raw.latitude,
      longitude: raw.longitude,
      industryType: raw.industryType || null,
    };

    this.saving.set(true);
    this.saveSuccess.set(false);
    this.error.set(null);
    this.factoryService
      .updateProfile(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.saveSuccess.set(true);
          this.toast.success(this.i18n.instant('factory.profile.saved'));
          this.loadProfile();
        },
        error: () => {
          this.error.set(this.i18n.instant('factory.profile.saveFailed'));
        },
      });
  }
}
