import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AdminService } from '../../../core/services/admin/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { Dispute } from '../../../core/models/dispute/dispute.model';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';

type StatusFilter = '' | 'Open' | 'UnderReview' | 'Resolved' | 'Rejected';
type TypeFilter =
  | ''
  | 'QualityShortfall'
  | 'LateDelivery'
  | 'QuantityDispute'
  | 'Other';

@Component({
  selector: 'app-admin-disputes',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    TranslatePipe,
    AppTopBarComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
  ],
  templateUrl: './admin-disputes.component.html',
})
export class AdminDisputesComponent implements OnInit {
  private readonly adminApi = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly disputes = signal<Dispute[]>([]);
  readonly actionLoading = signal<string | null>(null);
  readonly selectedId = signal<string | null>(null);

  statusFilter: StatusFilter = 'Open';
  typeFilter: TypeFilter = '';
  readonly adminNotes: Record<string, string> = {};
  readonly outcomeFavors: Record<string, string> = {};

  readonly statusFilters: Array<{ value: StatusFilter; labelKey: string }> = [
    { value: 'Open', labelKey: 'admin.disputes.filterOpen' },
    { value: 'UnderReview', labelKey: 'admin.disputes.filterUnderReview' },
    { value: '', labelKey: 'admin.disputes.filterAll' },
    { value: 'Resolved', labelKey: 'admin.disputes.filterResolved' },
    { value: 'Rejected', labelKey: 'admin.disputes.filterRejected' },
  ];

  readonly typeFilters: Array<{ value: TypeFilter; labelKey: string }> = [
    { value: '', labelKey: 'admin.disputes.filterAllTypes' },
    { value: 'QualityShortfall', labelKey: 'dispute.type.QualityShortfall' },
    { value: 'LateDelivery', labelKey: 'dispute.type.LateDelivery' },
    { value: 'QuantityDispute', labelKey: 'dispute.type.QuantityDispute' },
    { value: 'Other', labelKey: 'dispute.type.Other' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminApi
      .listDisputes({
        status: this.statusFilter || null,
        type: this.typeFilter || null,
        page: 1,
        pageSize: 50,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.disputes.set(res.items ?? []);
          for (const d of res.items ?? []) {
            if (this.adminNotes[d.disputeId] == null) {
              this.adminNotes[d.disputeId] = d.adminNote ?? '';
            }
            if (this.outcomeFavors[d.disputeId] == null) {
              this.outcomeFavors[d.disputeId] =
                d.outcomeFavor === 'None' ? 'Farm' : d.outcomeFavor;
            }
          }
        },
        error: () =>
          this.error.set(this.i18n.instant('admin.disputes.loadFailed')),
      });
  }

  setStatusFilter(filter: StatusFilter): void {
    this.statusFilter = filter;
    this.load();
  }

  setTypeFilter(filter: TypeFilter): void {
    this.typeFilter = filter;
    this.load();
  }

  toggleDetail(id: string): void {
    this.selectedId.set(this.selectedId() === id ? null : id);
  }

  async moveUnderReview(d: Dispute): Promise<void> {
    if (this.actionLoading()) {
      return;
    }
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'admin.disputes.confirmReviewTitle',
      bodyKey: 'admin.disputes.confirmReviewBody',
    });
    if (!confirmed) {
      return;
    }

    this.actionLoading.set(d.disputeId);
    this.adminApi
      .moveDisputeUnderReview(d.disputeId, this.adminNotes[d.disputeId])
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.toast.success(this.i18n.instant('admin.disputes.movedUnderReview'));
          this.load();
        },
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message ?? this.i18n.instant('admin.disputes.actionFailed')
          ),
      });
  }

  async resolve(d: Dispute): Promise<void> {
    if (this.actionLoading()) {
      return;
    }
    const note = (this.adminNotes[d.disputeId] ?? '').trim();
    const favor = this.outcomeFavors[d.disputeId] ?? 'Farm';
    if (!note) {
      this.toast.error(this.i18n.instant('admin.disputes.noteRequired'));
      return;
    }
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'admin.disputes.confirmResolveTitle',
      bodyKey: 'admin.disputes.confirmResolveBody',
    });
    if (!confirmed) {
      return;
    }

    this.actionLoading.set(d.disputeId);
    this.adminApi
      .resolveDispute(d.disputeId, note, favor)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.toast.success(this.i18n.instant('admin.disputes.resolved'));
          this.load();
        },
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message ?? this.i18n.instant('admin.disputes.actionFailed')
          ),
      });
  }

  async reject(d: Dispute): Promise<void> {
    if (this.actionLoading()) {
      return;
    }
    const note = (this.adminNotes[d.disputeId] ?? '').trim();
    if (!note) {
      this.toast.error(this.i18n.instant('admin.disputes.noteRequired'));
      return;
    }
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'admin.disputes.confirmRejectTitle',
      bodyKey: 'admin.disputes.confirmRejectBody',
    });
    if (!confirmed) {
      return;
    }

    this.actionLoading.set(d.disputeId);
    this.adminApi
      .rejectDispute(d.disputeId, note)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.toast.success(this.i18n.instant('admin.disputes.rejected'));
          this.load();
        },
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message ?? this.i18n.instant('admin.disputes.actionFailed')
          ),
      });
  }

  statusKey(status: string): string {
    return `dispute.status.${status}`;
  }

  typeKey(type: string): string {
    return `dispute.type.${type}`;
  }
}
