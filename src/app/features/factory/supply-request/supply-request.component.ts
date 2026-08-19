import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { GovLabelPipe } from '../../../core/pipes/gov-label.pipe';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiPortalHeroComponent } from '../../../shared/ui/portal-hero/portal-hero.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { SupplyRequestService } from '../../../core/services/supply-request.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { CropType } from '../../../core/models/farm/farm-profile.model';
import { EGYPT_GOVERNORATES } from '../../../shared/geo/egypt-governorates';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-supply-request',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    GovLabelPipe,
    AppTopBarComponent,
    UiPortalHeroComponent,
    RouterLink,
    UiLoaderComponent,
    UiErrorStateComponent,
  ],
  templateUrl: './supply-request.component.html',
})
export class SupplyRequestComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly supplyRequestService = inject(SupplyRequestService);
  private readonly farmService = inject(FarmService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly http = inject(HttpClient);

  readonly submitting = signal(false);
  readonly cropsLoading = signal(true);
  readonly cropsError = signal<string | null>(null);
  readonly cropTypes = signal<CropType[]>([]);
  readonly fairHint = signal<string | null>(null);

  private preferredFarmId: string | null = null;

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
    moistureMaxPercent: this.fb.control<number | null>(null),
    impuritiesMaxPercent: this.fb.control<number | null>(null),
    grade: this.fb.nonNullable.control(''),
    labRequired: this.fb.nonNullable.control(false),
    selectedGovernorates: this.fb.nonNullable.control<string[]>(['Giza']),
    geographicScope: this.fb.nonNullable.control('Exact'),
    deliveryPoint: this.fb.nonNullable.control<'FactoryGate' | 'FarmGate'>(
      'FactoryGate'
    ),
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const quantity = params.get('quantity');
      const price = params.get('price');
      const governorate = params.get('governorate');
      const farmId = params.get('farmId');
      const availableTo = params.get('availableTo');
      const cropTypeId = params.get('cropTypeId');

      if (quantity) {
        const q = Number(quantity);
        if (Number.isFinite(q) && q > 0) {
          this.form.controls.quantity.setValue(q);
        }
      }
      if (price) {
        const p = Number(price);
        if (Number.isFinite(p) && p >= 0) {
          this.form.controls.price.setValue(p);
        }
      }
      if (governorate) {
        this.form.controls.selectedGovernorates.setValue([governorate]);
      }
      if (farmId) {
        this.preferredFarmId = farmId;
      }
      if (availableTo) {
        const d = availableTo.slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
          this.form.controls.deliveryDate.setValue(d);
        }
      }
      if (cropTypeId) {
        this.applyCropTypeId(cropTypeId);
      }
    });
    this.loadCrops();
    this.form.valueChanges.pipe(debounceTime(400)).subscribe(() => this.refreshFairHint());
    this.refreshFairHint();
  }

  private refreshFairHint(): void {
    const crop = this.form.controls.crop.value;
    const price = this.form.controls.price.value;
    const gov = this.form.controls.selectedGovernorates.value[0] ?? '';
    if (!crop || price == null) {
      this.fairHint.set(null);
      return;
    }
    this.http
      .get<{
        alignment: string;
        latestPricePerTon: number | null;
        percentageDelta: number | null;
        hint: string;
      }>(`${environment.backendUrl}/market-prices/fair-hint`, {
        params: { crop, price: String(price), governorate: gov },
      })
      .subscribe({
        next: (res) => this.fairHint.set(res.hint || null),
        error: () => this.fairHint.set(null),
      });
  }

  loadCrops(): void {
    this.cropsLoading.set(true);
    this.cropsError.set(null);
    this.farmService
      .getCropTypes()
      .pipe(finalize(() => this.cropsLoading.set(false)))
      .subscribe({
        next: (crops) => {
          this.cropTypes.set(crops);
          const cropTypeId = this.route.snapshot.queryParamMap.get('cropTypeId');
          if (cropTypeId) {
            this.applyCropTypeId(cropTypeId);
          }
        },
        error: () =>
          this.cropsError.set(
            this.i18n.instant('factory.supplyRequest.cropsLoadFailed')
          ),
      });
  }

  private applyCropTypeId(cropTypeId: string): void {
    const crop = this.cropTypes().find((c) => c.cropTypeId === cropTypeId);
    if (crop) {
      this.form.controls.crop.setValue(crop.name);
    }
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
    const structuredQuality = this.buildStructuredQuality(value);
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
        deliveryPoint: value.deliveryPoint,
        structuredQuality,
        preferredFarmId: this.preferredFarmId ?? undefined,
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

  private buildStructuredQuality(value: ReturnType<typeof this.form.getRawValue>) {
    const hasStructured =
      value.moistureMaxPercent != null ||
      value.impuritiesMaxPercent != null ||
      value.grade.trim() !== '' ||
      value.labRequired;

    if (!hasStructured) {
      return undefined;
    }

    return {
      moistureMaxPercent: value.moistureMaxPercent ?? undefined,
      impuritiesMaxPercent: value.impuritiesMaxPercent ?? undefined,
      grade: value.grade.trim() || undefined,
      labRequired: value.labRequired || undefined,
    };
  }

  private defaultDeliveryDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }
}
