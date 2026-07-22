import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SidebarFarmComponent } from '../../../shared/components/sidebar-farm/sidebar-farm.component';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { FarmService } from '../../../core/services/farm/farm.service';
import { AuthService } from '../../../core/services/auth.service';
import { CropType, FarmProfile } from '../../../core/models/farm/farm-profile.model';
import { UpdateFarmProfileRequest } from '../../../core/models/farm/update-farm-profile-request.model';

@Component({
  selector: 'app-farm-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    SidebarFarmComponent,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiLoaderComponent,
  ],
  templateUrl: './farm-profile.component.html',
})
export class FarmProfileComponent implements OnInit {

  private readonly farmService = inject(FarmService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly currentUser = this.authService.currentUser;

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

  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', Validators.required),
    location: this.fb.nonNullable.control('', Validators.required),
    governorate: this.fb.nonNullable.control('', Validators.required),
    sizeInFeddans: this.fb.nonNullable.control(0, Validators.required),
    soilType: this.fb.nonNullable.control(''),
  });

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
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
            location: response.location,
            governorate: response.governorate,
            sizeInFeddans: response.sizeInFeddans,
            soilType: response.soilType ?? '',
          });
        },
        error: (err) => {
          console.error(err);
          this.error.set('Failed to load profile.');
        },
      });
  }

  loadCropTypes(): void {
    this.farmService.getCropTypes().subscribe({
      next: (types) => this.cropTypes.set(types),
      error: (err) => console.error('Failed to load crop types', err),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.saveSuccess.set(false);

    const raw = this.form.getRawValue();
    const payload: UpdateFarmProfileRequest = {
      ...raw,
      soilType: raw.soilType ? (this.SOIL_TYPE_MAP[raw.soilType] ?? null) : null,
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
            this.error.set(messages || 'Failed to save profile.');
          } else {
            this.error.set(err.error?.title || 'Failed to save profile.');
          }
        },
      });
  }

  addCrop(): void {
    const cropTypeId = this.selectedCropTypeId();
    if (!cropTypeId) return;

    this.addingCrop.set(true);
    this.farmService.addCrop(cropTypeId).pipe(finalize(() => this.addingCrop.set(false))).subscribe({
      next: () => {
        this.selectedCropTypeId.set('');
        this.loadProfile();
      },
      error: (err) => console.error('Failed to add crop', err),
    });
  }

  deleteCrop(cropTypeId: string): void {
    if (!confirm('Are you sure you want to remove this crop?')) return;
    this.deletingCropId.set(cropTypeId);
    this.farmService.deleteCrop(cropTypeId).pipe(finalize(() => this.deletingCropId.set(null))).subscribe({
      next: () => this.loadProfile(),
      error: (err) => console.error('Failed to delete crop', err),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingDocument.set(true);
    this.farmService.addDocument(file).pipe(finalize(() => {
      this.uploadingDocument.set(false);
      input.value = '';
    })).subscribe({
      next: () => this.loadProfile(),
      error: (err) => console.error('Failed to upload document', err),
    });
  }

  deleteDocument(documentId: string): void {
    if (!confirm('Are you sure you want to delete this document?')) return;
    this.deletingDocumentId.set(documentId);
    this.farmService.deleteDocument(documentId).pipe(finalize(() => this.deletingDocumentId.set(null))).subscribe({
      next: () => this.loadProfile(),
      error: (err) => console.error('Failed to delete document', err),
    });
  }

  updatePhone(): void {
    const phone = this.phoneNumber();
    if (!phone) return;

    this.updatingPhone.set(true);
    this.authService.updatePhone(phone).pipe(finalize(() => this.updatingPhone.set(false))).subscribe({
      next: () => this.loadProfile(),
      error: (err) => console.error('Failed to update phone', err),
    });
  }

  isCropAdded(cropTypeId: string): boolean {
    return this.profile()?.cropTypes.some((c) => c.cropTypeId === cropTypeId) ?? false;
  }
}