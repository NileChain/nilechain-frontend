import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { SupplyRequestService } from '../../../core/services/supply-request.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';

@Component({
  selector: 'app-supply-request',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    AppTopBarComponent,
    RouterLink,
  ],
  templateUrl: './supply-request.component.html',
})
export class SupplyRequestComponent {
  private readonly fb = inject(FormBuilder);
  private readonly supplyRequestService = inject(SupplyRequestService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly submitting = signal(false);

  readonly crops = [
    { value: 'Wheat', labelKey: 'factory.supplyRequest.cropWheat' },
    { value: 'Corn', labelKey: 'factory.supplyRequest.cropCorn' },
    { value: 'Rice', labelKey: 'factory.supplyRequest.cropRice' },
    { value: 'Cotton', labelKey: 'factory.supplyRequest.cropCotton' },
  ] as const;

  readonly governorates = [
    { value: 'cairo', labelKey: 'factory.supplyRequest.govCairo' },
    { value: 'giza', labelKey: 'factory.supplyRequest.govGiza' },
    { value: 'alex', labelKey: 'factory.supplyRequest.govAlexandria' },
    { value: 'beheira', labelKey: 'factory.supplyRequest.govBeheira' },
    { value: 'minya', labelKey: 'factory.supplyRequest.govMinya' },
  ] as const;

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
    selectedGovernorates: this.fb.nonNullable.control<string[]>(['giza']),
  });

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
