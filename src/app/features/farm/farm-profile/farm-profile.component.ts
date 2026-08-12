import { Component, OnInit, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
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
  CertificationCatalogItem,
  CropType,
  FarmCropListing,
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
    SlicePipe,
    TranslatePipe,
    AppTopBarComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    LocationPickerComponent,
  ],
  templateUrl: './farm-profile.component.html',
  styleUrl: './farm-profile.component.scss',
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
    description: this.fb.nonNullable.control(''),
    bankName: this.fb.nonNullable.control(''),
    accountHolderName: this.fb.nonNullable.control(''),
    bankAccountNumber: this.fb.nonNullable.control(''),
    iban: this.fb.nonNullable.control(''),
  });

  readonly cropForm = this.fb.nonNullable.group({
    availableQuantityTons: this.fb.control<number | null>(null),
    availableFrom: this.fb.control<string>(''),
    availableTo: this.fb.control<string>(''),
    minPricePerTon: this.fb.control<number | null>(null),
    isPublished: this.fb.nonNullable.control(true),
  });

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly mutationError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saveSuccess = signal(false);

  readonly cropTypes = signal<CropType[]>([]);
  readonly selectedCropTypeId = signal('');
  readonly editingCropTypeId = signal<string | null>(null);
  readonly addingCrop = signal(false);
  readonly savingCrop = signal(false);
  readonly deletingCropId = signal<string | null>(null);

  readonly certificationCatalog = signal<CertificationCatalogItem[]>([]);
  readonly selectedCertificationId = signal('');
  readonly certExpiresAt = signal('');
  readonly addingCertification = signal(false);
  readonly deletingCertificationId = signal<string | null>(null);

  readonly uploadingDocument = signal(false);
  readonly deletingDocumentId = signal<string | null>(null);
  readonly uploadingImage = signal(false);
  readonly deletingImageId = signal<string | null>(null);
  readonly phoneNumber = signal('');
  readonly updatingPhone = signal(false);

  ngOnInit(): void {
    this.loadProfile();
    this.loadCropTypes();
    this.loadCertificationCatalog();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);

    this.farmService
      .getProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.profile.set({
            ...response,
            certifications: response.certifications ?? [],
            images: response.images ?? [],
            description: response.description ?? null,
          });
          this.phoneNumber.set(response.phone || '');
          this.form.patchValue({
            name: response.name,
            location: response.location ?? '',
            governorate: response.governorate ?? '',
            latitude: response.latitude ?? null,
            longitude: response.longitude ?? null,
            sizeInFeddans: response.sizeInFeddans ?? 0,
            soilType: response.soilType ?? '',
            description: response.description ?? '',
            bankName: response.bankName ?? '',
            accountHolderName: response.accountHolderName ?? '',
            bankAccountNumber: '',
            iban: response.iban ?? '',
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

  loadCertificationCatalog(): void {
    this.farmService.getCertificationCatalog().subscribe({
      next: (items) => this.certificationCatalog.set(items),
      error: () =>
        this.mutationError.set(
          this.i18n.instant('farm.profile.certsLoadFailed')
        ),
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
      description: raw.description?.trim() || null,
      bankName: raw.bankName?.trim() || null,
      accountHolderName: raw.accountHolderName?.trim() || null,
      bankAccountNumber: raw.bankAccountNumber?.trim() || null,
      iban: raw.iban?.trim() || null,
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

  private commercialPayload() {
    const raw = this.cropForm.getRawValue();
    return {
      availableQuantityTons: raw.availableQuantityTons,
      availableFrom: raw.availableFrom?.trim() || null,
      availableTo: raw.availableTo?.trim() || null,
      minPricePerTon: raw.minPricePerTon,
      isPublished: raw.isPublished,
    };
  }

  addCrop(): void {
    const cropTypeId = this.selectedCropTypeId();
    if (!cropTypeId) return;

    this.addingCrop.set(true);
    this.mutationError.set(null);
    this.farmService
      .addCrop(cropTypeId, this.commercialPayload())
      .pipe(finalize(() => this.addingCrop.set(false)))
      .subscribe({
        next: () => {
          this.selectedCropTypeId.set('');
          this.cropForm.reset({
            availableQuantityTons: null,
            availableFrom: '',
            availableTo: '',
            minPricePerTon: null,
            isPublished: true,
          });
          this.loadProfile();
        },
        error: (err) =>
          this.mutationError.set(
            err?.error?.detail ||
              err?.error?.title ||
              this.i18n.instant('farm.profile.addCropFailed')
          ),
      });
  }

  startEditCrop(crop: FarmCropListing): void {
    this.editingCropTypeId.set(crop.cropTypeId);
    this.cropForm.patchValue({
      availableQuantityTons: crop.availableQuantityTons,
      availableFrom: crop.availableFrom?.slice(0, 10) ?? '',
      availableTo: crop.availableTo?.slice(0, 10) ?? '',
      minPricePerTon: crop.minPricePerTon,
      isPublished: crop.isPublished ?? true,
    });
  }

  cancelEditCrop(): void {
    this.editingCropTypeId.set(null);
    this.cropForm.reset({
      availableQuantityTons: null,
      availableFrom: '',
      availableTo: '',
      minPricePerTon: null,
      isPublished: true,
    });
  }

  saveCropEdit(): void {
    const cropTypeId = this.editingCropTypeId();
    if (!cropTypeId) return;

    this.savingCrop.set(true);
    this.mutationError.set(null);
    this.farmService
      .updateCrop(cropTypeId, this.commercialPayload())
      .pipe(finalize(() => this.savingCrop.set(false)))
      .subscribe({
        next: () => {
          this.cancelEditCrop();
          this.loadProfile();
        },
        error: (err) =>
          this.mutationError.set(
            err?.error?.detail ||
              err?.error?.title ||
              this.i18n.instant('farm.profile.updateCropFailed')
          ),
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

  addCertification(): void {
    const certificationId = this.selectedCertificationId();
    if (!certificationId) return;

    this.addingCertification.set(true);
    this.mutationError.set(null);
    this.farmService
      .addCertification({
        certificationId,
        expiresAt: this.certExpiresAt()?.trim() || null,
      })
      .pipe(finalize(() => this.addingCertification.set(false)))
      .subscribe({
        next: () => {
          this.selectedCertificationId.set('');
          this.certExpiresAt.set('');
          this.loadProfile();
        },
        error: (err) =>
          this.mutationError.set(
            err?.error?.detail ||
              err?.error?.title ||
              this.i18n.instant('farm.profile.addCertFailed')
          ),
      });
  }

  async deleteCertification(certificationId: string): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'common.confirmTitle',
      bodyKey: 'common.confirmBody',
      confirmKey: 'common.remove',
      danger: true,
    });
    if (!confirmed) return;
    this.deletingCertificationId.set(certificationId);
    this.mutationError.set(null);
    this.farmService
      .deleteCertification(certificationId)
      .pipe(finalize(() => this.deletingCertificationId.set(null)))
      .subscribe({
        next: () => this.loadProfile(),
        error: () =>
          this.mutationError.set(
            this.i18n.instant('farm.profile.deleteCertFailed')
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

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingImage.set(true);
    this.mutationError.set(null);
    this.farmService
      .addImage(file)
      .pipe(
        finalize(() => {
          this.uploadingImage.set(false);
          input.value = '';
        })
      )
      .subscribe({
        next: () => this.loadProfile(),
        error: () =>
          this.mutationError.set(
            this.i18n.instant('farm.profile.uploadImageFailed')
          ),
      });
  }

  async deleteImage(imageId: string): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'common.confirmTitle',
      bodyKey: 'common.confirmBody',
      confirmKey: 'common.delete',
      danger: true,
    });
    if (!confirmed) return;
    this.deletingImageId.set(imageId);
    this.mutationError.set(null);
    this.farmService
      .deleteImage(imageId)
      .pipe(finalize(() => this.deletingImageId.set(null)))
      .subscribe({
        next: () => this.loadProfile(),
        error: () =>
          this.mutationError.set(
            this.i18n.instant('farm.profile.deleteImageFailed')
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

  isCertificationAdded(certificationId: string): boolean {
    return (
      this.profile()?.certifications.some(
        (c) => c.certificationId === certificationId
      ) ?? false
    );
  }

  formatCropMeta(crop: FarmCropListing): string {
    const parts: string[] = [];
    if (crop.availableQuantityTons != null) {
      parts.push(`${crop.availableQuantityTons} t`);
    }
    if (crop.minPricePerTon != null) {
      parts.push(`≥ ${crop.minPricePerTon} EGP/t`);
    }
    if (crop.availableFrom || crop.availableTo) {
      const from = crop.availableFrom?.slice(0, 10) ?? '…';
      const to = crop.availableTo?.slice(0, 10) ?? '…';
      parts.push(`${from} → ${to}`);
    }
    parts.push(
      crop.isPublished
        ? this.i18n.instant('farm.profile.published')
        : this.i18n.instant('farm.profile.unpublished')
    );
    return parts.join(' · ');
  }
}
