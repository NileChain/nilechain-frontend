import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { LocationPickerComponent } from '../../../shared/components/location-picker/location-picker.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { FarmService } from '../../../core/services/farm/farm.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { TranslateService } from '../../../core/services/translate.service';
import {
  CropType,
  FarmProfile,
} from '../../../core/models/farm/farm-profile.model';
import { UpdateFarmProfileRequest } from '../../../core/models/farm/update-farm-profile-request.model';
import { PickedLocation } from '../../../shared/geo/egypt-governorates';
import {
  isValidEgyptianPhone,
  normalizeEgyptianPhone,
} from '../../../core/validation/egyptian-phone';

@Component({
  selector: 'app-farm-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    AppTopBarComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    LocationPickerComponent,
  ],
  templateUrl: './farm-profile.component.html',
})
export class FarmProfileComponent implements OnInit {
  private readonly farmService = inject(FarmService);
  private readonly authService = inject(AuthService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly i18n = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  private readonly SOIL_TYPE_MAP: Record<string, number> = {
    Clay: 0,
    Sandy: 1,
    Loamy: 2,
    Silty: 3,
    Peaty: 4,
    Chalky: 5,
    Saline: 6,
  };

  readonly profile = signal<FarmProfile | null>(null);
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
    sizeInFeddans: this.fb.nonNullable.control(0, Validators.required),
    soilType: this.fb.nonNullable.control(''),
  });

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly mutationError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saveSuccess = signal(false);

  readonly cropTypes = signal<CropType[]>([]);
  readonly selectedCropTypeId = signal('');
  readonly addingCrop = signal(false);
  readonly deletingCropId = signal<string | null>(null);
  readonly uploadingDocument = signal(false);
  readonly deletingDocumentId = signal<string | null>(null);
  readonly phoneNumber = signal('');
  readonly updatingPhone = signal(false);

  ngOnInit(): void {
    this.loadProfile();
    this.loadCropTypes();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);

    this.farmService
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
            sizeInFeddans: response.sizeInFeddans ?? 0,
            soilType: response.soilType ?? '',
          });
          this.mapInitial.set({
            latitude: response.latitude,
            longitude: response.longitude,
            governorate: response.governorate,
          });
        },
        error: (err) => {
          console.error(err);
          this.error.set(this.i18n.instant('farm.profile.loadFailed'));
        },
      });
  }

  onLocationPicked(loc: PickedLocation): void {
    this.form.patchValue({
      latitude: loc.latitude,
      longitude: loc.longitude,
      governorate: loc.governorate,
      location:
        this.form.controls.location.value?.trim() ||
        `${loc.governorateAr} (${loc.governorate})`,
    });
    this.form.controls.governorate.markAsDirty();
  }

  loadCropTypes(): void {
    this.farmService.getCropTypes().subscribe({
      next: (types) => this.cropTypes.set(types),
      error: () =>
        this.mutationError.set(this.i18n.instant('farm.profile.cropsLoadFailed')),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.form.controls.governorate.value) {
      this.error.set(this.i18n.instant('farm.profile.pickLocation'));
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.saveSuccess.set(false);

    const raw = this.form.getRawValue();
    const payload: UpdateFarmProfileRequest = {
      name: raw.name,
      location: raw.location || raw.governorate,
      governorate: raw.governorate,
      latitude: raw.latitude,
      longitude: raw.longitude,
      sizeInFeddans: raw.sizeInFeddans,
      soilType: raw.soilType
        ? (this.SOIL_TYPE_MAP[raw.soilType] ?? null)
        : null,
    };

    this.farmService
      .updateProfile(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.loadProfile();
          this.saveSuccess.set(true);
          setTimeout(() => this.saveSuccess.set(false), 3000);
        },
        error: (err) => {
          console.error(err);
          const serverErrors = err.error?.errors;
          if (serverErrors) {
            const messages = Object.values(serverErrors).flat().join('; ');
            this.error.set(
              messages || this.i18n.instant('farm.profile.saveFailed')
            );
          } else {
            this.error.set(
              err.error?.title || this.i18n.instant('farm.profile.saveFailed')
            );
          }
        },
      });
  }

  addCrop(): void {
    const cropTypeId = this.selectedCropTypeId();
    if (!cropTypeId) return;

    this.addingCrop.set(true);
    this.mutationError.set(null);
    this.farmService
      .addCrop(cropTypeId)
      .pipe(finalize(() => this.addingCrop.set(false)))
      .subscribe({
        next: () => {
          this.selectedCropTypeId.set('');
          this.loadProfile();
        },
        error: () =>
          this.mutationError.set(this.i18n.instant('farm.profile.addCropFailed')),
      });
  }

  async deleteCrop(cropTypeId: string): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'common.confirmTitle',
      bodyKey: 'common.confirmBody',
      confirmKey: 'common.remove',
      danger: true,
    });
    if (!confirmed) return;
    this.deletingCropId.set(cropTypeId);
    this.mutationError.set(null);
    this.farmService
      .deleteCrop(cropTypeId)
      .pipe(finalize(() => this.deletingCropId.set(null)))
      .subscribe({
        next: () => this.loadProfile(),
        error: () =>
          this.mutationError.set(
            this.i18n.instant('farm.profile.deleteCropFailed')
          ),
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingDocument.set(true);
    this.mutationError.set(null);
    this.farmService
      .addDocument(file)
      .pipe(
        finalize(() => {
          this.uploadingDocument.set(false);
          input.value = '';
        })
      )
      .subscribe({
        next: () => this.loadProfile(),
        error: () =>
          this.mutationError.set(
            this.i18n.instant('farm.profile.uploadDocumentFailed')
          ),
      });
  }

  async deleteDocument(documentId: string): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'common.confirmTitle',
      bodyKey: 'common.confirmBody',
      confirmKey: 'common.delete',
      danger: true,
    });
    if (!confirmed) return;
    this.deletingDocumentId.set(documentId);
    this.mutationError.set(null);
    this.farmService
      .deleteDocument(documentId)
      .pipe(finalize(() => this.deletingDocumentId.set(null)))
      .subscribe({
        next: () => this.loadProfile(),
        error: () =>
          this.mutationError.set(
            this.i18n.instant('farm.profile.deleteDocumentFailed')
          ),
      });
  }

  updatePhone(): void {
    const phone = this.phoneNumber();
    if (!phone?.trim()) {
      this.mutationError.set(this.i18n.instant('validation.egyptianPhone'));
      return;
    }
    if (!isValidEgyptianPhone(phone)) {
      this.mutationError.set(this.i18n.instant('validation.egyptianPhone'));
      return;
    }

    const normalized = normalizeEgyptianPhone(phone);
    this.phoneNumber.set(normalized);
    this.updatingPhone.set(true);
    this.mutationError.set(null);
    this.authService
      .updatePhone(normalized)
      .pipe(finalize(() => this.updatingPhone.set(false)))
      .subscribe({
        next: () => this.loadProfile(),
        error: (err) =>
          this.mutationError.set(
            err?.error?.message ||
              this.i18n.instant('validation.egyptianPhone')
          ),
      });
  }

  isCropAdded(cropTypeId: string): boolean {
    return (
      this.profile()?.cropTypes.some((c) => c.cropTypeId === cropTypeId) ??
      false
    );
  }
}
