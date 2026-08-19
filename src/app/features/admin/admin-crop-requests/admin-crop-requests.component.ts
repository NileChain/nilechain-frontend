import { UiDatePipe } from '../../../core/pipes/ui-date.pipe';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { CropRequestService } from '../../../core/services/crop-request.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { CropRequest } from '../../../core/models/crop-request.model';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';

type StatusFilter = '' | 'Pending' | 'Approved' | 'Rejected';

@Component({
  selector: 'app-admin-crop-requests',
  standalone: true,
  imports: [
    UiDatePipe, FormsModule,
    TranslatePipe,
    AppTopBarComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
  ],
  templateUrl: './admin-crop-requests.component.html',
})
export class AdminCropRequestsComponent implements OnInit {
  private readonly cropRequestService = inject(CropRequestService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly requests = signal<CropRequest[]>([]);
  readonly actionLoading = signal<string | null>(null);

  statusFilter: StatusFilter = 'Pending';

  /** Optional name override keyed by request id before approve. */
  readonly editNames: Record<string, string> = {};
  readonly adminNotes: Record<string, string> = {};

  readonly filters: Array<{ value: StatusFilter; labelKey: string }> = [
    { value: 'Pending', labelKey: 'admin.cropRequests.filterPending' },
    { value: '', labelKey: 'admin.cropRequests.filterAll' },
    { value: 'Approved', labelKey: 'admin.cropRequests.filterApproved' },
    { value: 'Rejected', labelKey: 'admin.cropRequests.filterRejected' },
  ];

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.error.set(null);
    this.cropRequestService
      .listCropRequests(this.statusFilter || null)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.requests.set(items ?? []);
          for (const item of items ?? []) {
            if (this.editNames[item.cropRequestId] == null) {
              this.editNames[item.cropRequestId] = item.name;
            }
            if (this.adminNotes[item.cropRequestId] == null) {
              this.adminNotes[item.cropRequestId] = item.adminNotes ?? '';
            }
          }
        },
        error: () =>
          this.error.set(this.i18n.instant('admin.cropRequests.loadFailed')),
      });
  }

  setFilter(filter: StatusFilter): void {
    this.statusFilter = filter;
    this.loadRequests();
  }

  async approve(req: CropRequest): Promise<void> {
    if (this.actionLoading()) {
      return;
    }
    const editedName = (this.editNames[req.cropRequestId] ?? req.name).trim();
    if (!editedName) {
      this.toast.error(this.i18n.instant('cropRequest.nameRequired'));
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'admin.cropRequests.confirmApproveTitle',
      bodyKey: 'admin.cropRequests.confirmApproveBody',
      confirmKey: 'common.accept',
      cancelKey: 'common.cancel',
      danger: false,
    });
    if (!confirmed) {
      return;
    }

    this.actionLoading.set(req.cropRequestId);
    this.cropRequestService
      .approveCropRequest(req.cropRequestId, {
        name: editedName !== req.name ? editedName : null,
        adminNotes: (this.adminNotes[req.cropRequestId] ?? '').trim() || null,
      })
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.toast.success(
            this.i18n.instant('admin.cropRequests.approveSuccess')
          );
          this.loadRequests();
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            err?.error?.Message ||
            this.i18n.instant('admin.cropRequests.approveFailed');
          this.toast.error(message);
        },
      });
  }

  async reject(req: CropRequest): Promise<void> {
    if (this.actionLoading()) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'admin.cropRequests.confirmRejectTitle',
      bodyKey: 'admin.cropRequests.confirmRejectBody',
      confirmKey: 'common.reject',
      cancelKey: 'common.cancel',
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    this.actionLoading.set(req.cropRequestId);
    this.cropRequestService
      .rejectCropRequest(req.cropRequestId, {
        adminNotes: (this.adminNotes[req.cropRequestId] ?? '').trim() || null,
      })
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.toast.success(
            this.i18n.instant('admin.cropRequests.rejectSuccess')
          );
          this.loadRequests();
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            err?.error?.Message ||
            this.i18n.instant('admin.cropRequests.rejectFailed');
          this.toast.error(message);
        },
      });
  }

  isPending(status: string): boolean {
    return (status || '').toLowerCase() === 'pending';
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
}
