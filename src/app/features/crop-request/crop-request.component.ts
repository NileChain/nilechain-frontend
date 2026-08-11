import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { CropRequestService } from '../../core/services/crop-request.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslateService } from '../../core/services/translate.service';
import { CropRequest } from '../../core/models/crop-request.model';
import { AppTopBarComponent } from '../../shared/components/app-top-bar/app-top-bar.component';
import type { AppTopBarPortal } from '../../shared/components/app-top-bar/app-top-bar.component';
import { UiLoaderComponent } from '../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-crop-request',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    TranslatePipe,
    AppTopBarComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
  ],
  templateUrl: './crop-request.component.html',
})
export class CropRequestComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cropRequestService = inject(CropRequestService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly router = inject(Router);

  readonly portal: AppTopBarPortal = this.router.url.startsWith('/farm')
    ? 'farm'
    : 'factory';

  readonly profileLink =
    this.portal === 'farm' ? '/farm/profile' : '/factory/profile';
  readonly notificationsLink =
    this.portal === 'farm'
      ? '/farm/notifications'
      : '/factory/notifications';

  readonly submitting = signal(false);
  readonly listLoading = signal(true);
  readonly listError = signal<string | null>(null);
  readonly requests = signal<CropRequest[]>([]);
  readonly submitSuccess = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(100),
    ]),
    category: this.fb.nonNullable.control(''),
    description: this.fb.nonNullable.control(''),
  });

  ngOnInit(): void {
    this.loadMyRequests();
  }

  loadMyRequests(): void {
    this.listLoading.set(true);
    this.listError.set(null);
    this.cropRequestService
      .getMyCropRequests()
      .pipe(finalize(() => this.listLoading.set(false)))
      .subscribe({
        next: (items) => this.requests.set(items ?? []),
        error: () =>
          this.listError.set(this.i18n.instant('cropRequest.loadFailed')),
      });
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const name = value.name.trim();
    if (!name) {
      this.form.controls.name.setErrors({ required: true });
      return;
    }

    this.submitting.set(true);
    this.submitSuccess.set(false);

    this.cropRequestService
      .createCropRequest({
        name,
        category: value.category.trim() || null,
        description: value.description.trim() || null,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.submitSuccess.set(true);
          this.toast.success(this.i18n.instant('cropRequest.submitSuccess'));
          this.form.reset({ name: '', category: '', description: '' });
          this.loadMyRequests();
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            err?.error?.Message ||
            this.i18n.instant('cropRequest.submitFailed');
          this.toast.error(message);
        },
      });
  }

  statusKey(status: string): string {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'approved') {
      return 'cropRequest.statusApproved';
    }
    if (normalized === 'rejected') {
      return 'cropRequest.statusRejected';
    }
    return 'cropRequest.statusPending';
  }

  statusClass(status: string): string {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'approved') {
      return 'bg-secondary-container/40 text-on-secondary-container border-outline-variant';
    }
    if (normalized === 'rejected') {
      return 'bg-error-container/20 text-error border-error/30';
    }
    return 'bg-surface-container-high text-on-surface-variant border-outline-variant';
  }
}
