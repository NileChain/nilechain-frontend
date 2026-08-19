import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AdminContractListItem } from '../../../core/models/admin/admin-dashboard.model';
import { AdminService } from '../../../core/services/admin/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-contracts',
  standalone: true,
  imports: [
    TranslatePipe,
    FormsModule,
    AppTopBarComponent,
    UiLoaderComponent,
    UiEmptyStateComponent,
  ],
  templateUrl: './admin-contracts.component.html',
})
export class AdminContractsComponent implements OnInit {
  private readonly adminApi = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly contracts = signal<AdminContractListItem[]>([]);
  readonly totalCount = signal(0);
  readonly page = signal(1);
  readonly pageSize = 20;

  statusFilter = '';
  search = '';

  readonly statusOptions = [
    { value: '', labelKey: 'admin.contracts.allStatuses' },
    { value: 'Signed', labelKey: 'admin.contracts.statusSigned' },
    { value: 'PendingSignature', labelKey: 'admin.contracts.statusReview' },
    { value: 'Cancelled', labelKey: 'admin.contracts.statusRejected' },
  ] as const;

  ngOnInit(): void {
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(page);
    this.adminApi
      .getContracts({
        status: this.statusFilter || null,
        search: this.search.trim() || null,
        page,
        pageSize: this.pageSize,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.contracts.set(res.items ?? []);
          this.totalCount.set(res.totalCount ?? 0);
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            this.i18n.instant('admin.contracts.loadFailed');
          this.error.set(message);
          this.toast.error(message);
        },
      });
  }

  applyFilters(): void {
    this.load(1);
  }

  resetFilters(): void {
    this.statusFilter = '';
    this.search = '';
    this.load(1);
  }

  nextPage(): void {
    if (this.page() * this.pageSize >= this.totalCount()) return;
    this.load(this.page() + 1);
  }

  prevPage(): void {
    if (this.page() <= 1) return;
    this.load(this.page() - 1);
  }

  formatValue(v: number | null): string {
    if (v == null) return '—';
    return v.toLocaleString(this.i18n.currentLang() === 'ar' ? 'ar-EG' : 'en-US', {
      maximumFractionDigits: 0,
    });
  }
}
