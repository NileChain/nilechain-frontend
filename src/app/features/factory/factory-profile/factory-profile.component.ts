import { DecimalPipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { LocationPickerComponent } from '../../../shared/components/location-picker/location-picker.component';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import {
  FactoryProfile,
  UpdateFactoryProfileRequest,
} from '../../../core/models/factory/factory-profile.model';
import { PickedLocation } from '../../../shared/geo/egypt-governorates';

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
  @ViewChild('nameInput') nameInput?: ElementRef<HTMLInputElement>;

  private readonly factoryService = inject(FactoryService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveSuccess = signal(false);
  readonly profile = signal<FactoryProfile | null>(null);
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
        error: () => this.error.set('Failed to load factory profile.'),
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

  focusBasicInfo(): void {
    this.nameInput?.nativeElement?.focus();
    this.nameInput?.nativeElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  /** 1–5 star slots derived from averageRating (no fake data). */
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
