import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { SupplyRequestService } from '../../../core/services/supply-request.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { CropType } from '../../../core/models/farm/farm-profile.model';
import { EGYPT_GOVERNORATES } from '../../../shared/geo/egypt-governorates';
import { Router } from '@angular/router';

@Component({
  selector: 'app-supply-request',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    AppTopBarComponent,
    RouterLink,
    UiLoaderComponent,
    UiErrorStateComponent,
  ],
  templateUrl: './supply-request.component.html',
})
export class SupplyRequestComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supplyRequestService = inject(SupplyRequestService);
  private readonly farmService = inject(FarmService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly submitting = signal(false);
  readonly cropsLoading = signal(true);
  readonly cropsError = signal<string | null>(null);
  readonly cropTypes = signal<CropType[]>([]);

  readonly geographicScopes = [
    { value: 'Exact', labelKey: 'factory.supplyRequest.scopeExact' },
    { value: 'Nearby', labelKey: 'factory.supplyRequest.scopeNearby' },
    { value: 'Nationwide', labelKey: 'factory.supplyRequest.scopeNationwide' },
  ] as const;

  readonly governorates = EGYPT_GOVERNORATES.map((g) => ({
    value: g.name,
    labelEn: g.name,
    labelAr: g.nameAr,
  }));

  readonly form = this.fb.nonNullable.group({
    crop: this.fb.nonNullable.control('', Validators.required),
    quantity: this.fb.nonNullable.control(50, [
      Validators.required,
      Validators.min(1),
    ]),
    price: this.fb.nonNullable.control(12000, [
      Validators.required,
      Validators.min(0),
    ]),
    deliveryDate: this.fb.nonNullable.control(
      this.defaultDeliveryDate(),
      Validators.required
    ),
    quality: this.fb.nonNullable.control(''),
    selectedGovernorates: this.fb.nonNullable.control<string[]>(['Giza']),
    geographicScope: this.fb.nonNullable.control('Exact'),
  });

  ngOnInit(): void {
    this.loadCrops();
  }

  loadCrops(): void {
    this.cropsLoading.set(true);
    this.cropsError.set(null);
    this.farmService
      .getCropTypes()
      .pipe(finalize(() => this.cropsLoading.set(false)))
      .subscribe({
        next: (crops) => this.cropTypes.set(crops),
        error: () =>
          this.cropsError.set(
            this.i18n.instant('factory.supplyRequest.cropsLoadFailed')
          ),
      });
  }

  isGovSelected(value: string): boolean {
    return this.form.controls.selectedGovernorates.value.includes(value);
  }

  toggleGovernorate(value: string): void {
    const current = [...this.form.controls.selectedGovernorates.value];
    const idx = current.indexOf(value);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(value);
    }
    this.form.controls.selectedGovernorates.setValue(current);
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitting.set(true);

    this.supplyRequestService
      .createRequest({
        crop: value.crop,
        quantity: value.quantity,
        price: value.price,
        deliveryDate: value.deliveryDate,
        quality: value.quality,
        selectedGovernorates: value.selectedGovernorates,
        geographicScope: value.geographicScope,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: ({ requestId }) => {
          if (!requestId) {
            this.toast.error(
              this.i18n.instant('factory.supplyRequest.submitFailed')
            );
            return;
          }
          this.toast.success(
            this.i18n.instant('factory.supplyRequest.submitted')
          );
          void this.router.navigate(['/factory/agent-progress'], {
            queryParams: { requestId },
          });
        },
        error: () => {
          this.toast.error(
            this.i18n.instant('factory.supplyRequest.submitFailed')
          );
        },
      });
  }

  private defaultDeliveryDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }
}
