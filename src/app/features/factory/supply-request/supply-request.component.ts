import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CreateSupplyRequestPayload } from '../../../core/models/supply-request.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SupplyRequestService } from '../../../core/services/supply-request.service';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-supply-request',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
  ],
  templateUrl: './supply-request.component.html',
})
export class SupplyRequestComponent {
  private readonly fb = inject(FormBuilder);
  private readonly requestService = inject(SupplyRequestService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly crops = [
    { value: 'wheat', labelKey: 'factory.supplyRequest.cropWheat' },
    { value: 'corn', labelKey: 'factory.supplyRequest.cropCorn' },
    { value: 'rice', labelKey: 'factory.supplyRequest.cropRice' },
    { value: 'cotton', labelKey: 'factory.supplyRequest.cropCotton' },
  ] as const;

  readonly governorates = [
    { value: 'cairo', labelKey: 'factory.supplyRequest.govCairo' },
    { value: 'giza', labelKey: 'factory.supplyRequest.govGiza' },
    { value: 'alex', labelKey: 'factory.supplyRequest.govAlexandria' },
    { value: 'beheira', labelKey: 'factory.supplyRequest.govBeheira' },
    { value: 'minya', labelKey: 'factory.supplyRequest.govMinya' },
  ] as const;

  readonly form = this.fb.group({
    cropType: this.fb.nonNullable.control('', Validators.required),
    quantity: this.fb.nonNullable.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
    ]),
    targetPrice: this.fb.nonNullable.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
    ]),
    deliveryDate: this.fb.nonNullable.control('', Validators.required),
    qualitySpecs: this.fb.nonNullable.control(''),
    governorates: this.fb.nonNullable.control<string[]>([]),
  });

  hasGovernorate(value: string): boolean {
    return this.form.controls.governorates.value.includes(value);
  }

  toggleGovernorate(value: string): void {
    const current = this.form.controls.governorates.value;

    if (current.includes(value)) {
      this.form.controls.governorates.setValue(current.filter((entry) => entry !== value));
      return;
    }

    this.form.controls.governorates.setValue([...current, value]);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const payload = this.form.getRawValue() as CreateSupplyRequestPayload;

    this.requestService
      .createRequest(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (created) => {
          void this.router.navigate(['/agent-progress'], {
            queryParams: { requestId: created.id },
          });
        },
        error: () => {
          this.submitError.set('Unable to submit request. Please try again.');
        },
      });
  }

  cancel(): void {
    void this.router.navigate(['/factory-dashboard']);
  }
}
