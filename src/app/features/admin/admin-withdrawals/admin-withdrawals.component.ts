import { UiDatePipe } from '../../../core/pipes/ui-date.pipe';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AdminService, AdminWithdrawal } from '../../../core/services/admin/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import {
  adminWithdrawalStatusKey,
  walletMethodKey,
} from '../../../core/i18n/status-i18n.util';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-withdrawals',
  standalone: true,
  imports: [
    UiDatePipe, FormsModule,
    TranslatePipe,
    AppTopBarComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
  ],
  templateUrl: './admin-withdrawals.component.html',
})
export class AdminWithdrawalsComponent implements OnInit {
  private readonly adminApi = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly acting = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly items = signal<AdminWithdrawal[]>([]);

  statusFilter = 'Pending';
  readonly statusFilters = [
    { value: 'Pending', labelKey: 'admin.withdrawals.filterPending' },
    { value: '', labelKey: 'admin.withdrawals.filterAll' },
    { value: 'Completed', labelKey: 'admin.withdrawals.filterCompleted' },
    { value: 'Cancelled', labelKey: 'admin.withdrawals.filterRejected' },
  ];

  ngOnInit(): void {
    this.load();
  }

  setStatusFilter(value: string): void {
    this.statusFilter = value;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminApi
      .listWithdrawals(this.statusFilter || null)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => this.items.set(res.items ?? []),
        error: () =>
          this.error.set(this.i18n.instant('admin.withdrawals.loadFailed')),
      });
  }

  async complete(row: AdminWithdrawal): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'admin.withdrawals.confirmCompleteTitle',
      bodyKey: 'admin.withdrawals.confirmCompleteBody',
      confirmKey: 'admin.withdrawals.complete',
      cancelKey: 'common.cancel',
    });
    if (!confirmed) return;
    this.acting.set(row.withdrawalId);
    this.adminApi
      .completeWithdrawal(row.withdrawalId)
      .pipe(finalize(() => this.acting.set(null)))
      .subscribe({
        next: () => {
          this.toast.success(this.i18n.instant('admin.withdrawals.completed'));
          this.load();
        },
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message ?? this.i18n.instant('admin.withdrawals.actionFailed')
          ),
      });
  }

  async reject(row: AdminWithdrawal): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'admin.withdrawals.confirmRejectTitle',
      bodyKey: 'admin.withdrawals.confirmRejectBody',
      confirmKey: 'admin.withdrawals.reject',
      cancelKey: 'common.cancel',
      danger: true,
    });
    if (!confirmed) return;
    this.acting.set(row.withdrawalId);
    this.adminApi
      .rejectWithdrawal(row.withdrawalId)
      .pipe(finalize(() => this.acting.set(null)))
      .subscribe({
        next: () => {
          this.toast.success(this.i18n.instant('admin.withdrawals.rejected'));
          this.load();
        },
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message ?? this.i18n.instant('admin.withdrawals.actionFailed')
          ),
      });
  }

  canAct(row: AdminWithdrawal): boolean {
    return row.status === 'Pending' || row.status === 'Processing';
  }

  statusLabelKey(status: string): string {
    return adminWithdrawalStatusKey(status);
  }

  methodLabelKey(method: string): string {
    return walletMethodKey(method);
  }
}
