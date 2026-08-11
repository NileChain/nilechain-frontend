import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import {
  AdminActivityItem,
  CropDemand,
  DashboardSummary,
  MonthlyContractPoint,
} from '../../../core/models/admin/admin-dashboard.model';
import { StuckFulfillment } from '../../../core/models/fulfillment/fulfillment.model';
import { AdminService } from '../../../core/services/admin/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiStatCardComponent } from '../../../shared/ui/stat-card/stat-card.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    TranslatePipe,
    RouterLink,
    DatePipe,
    AppTopBarComponent,
    UiStatCardComponent,
    UiLoaderComponent,
    UiEmptyStateComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminApi = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly stuckLoading = signal(true);
  readonly stuckError = signal<string | null>(null);
  readonly stuckItems = signal<StuckFulfillment[]>([]);
  readonly stuckTotal = signal(0);

  readonly summaryLoading = signal(true);
  readonly summaryError = signal<string | null>(null);
  readonly summary = signal<DashboardSummary | null>(null);

  ngOnInit(): void {
    this.loadSummary();
    this.loadStuckDeliveries();
  }

  loadSummary(): void {
    this.summaryLoading.set(true);
    this.summaryError.set(null);
    this.adminApi
      .getDashboardSummary()
      .pipe(finalize(() => this.summaryLoading.set(false)))
      .subscribe({
        next: (res) => this.summary.set(res),
        error: (err) => {
          const message =
            err?.error?.message ||
            this.i18n.instant('admin.dashboard.summaryLoadFailed');
          this.summaryError.set(message);
          this.toast.error(message);
        },
      });
  }

  loadStuckDeliveries(): void {
    this.stuckLoading.set(true);
    this.stuckError.set(null);
    this.adminApi
      .getStuckFulfillments(1, 20)
      .pipe(finalize(() => this.stuckLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.stuckItems.set(res.items ?? []);
          this.stuckTotal.set(res.totalCount ?? 0);
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            this.i18n.instant('admin.dashboard.stuckLoadFailed');
          this.stuckError.set(message);
          this.toast.error(message);
        },
      });
  }

  shortId(id: string): string {
    return id?.length > 8 ? `${id.slice(0, 8).toUpperCase()}…` : id;
  }

  monthlyBars(): MonthlyContractPoint[] {
    return this.summary()?.monthlyContracts ?? [];
  }

  crops(): CropDemand[] {
    return this.summary()?.topCrops ?? [];
  }

  activity(): AdminActivityItem[] {
    return this.summary()?.recentActivity ?? [];
  }

  farmMixPercent(): number {
    const s = this.summary();
    if (!s || s.totalUsers <= 0) return 0;
    return Math.round((100 * s.farmCount) / s.totalUsers);
  }

  factoryMixPercent(): number {
    const s = this.summary();
    if (!s || s.totalUsers <= 0) return 0;
    return Math.round((100 * s.factoryCount) / s.totalUsers);
  }

  adminMixPercent(): number {
    const s = this.summary();
    if (!s || s.totalUsers <= 0) return 0;
    return Math.round((100 * s.adminCount) / s.totalUsers);
  }

  conicGradient(): string {
    const farm = this.farmMixPercent();
    const factory = this.factoryMixPercent();
    const adminEnd = Math.min(100, farm + factory + this.adminMixPercent());
    return `conic-gradient(var(--color-primary) 0% ${farm}%, var(--color-secondary-container) ${farm}% ${farm + factory}%, var(--color-surface-container-high) ${farm + factory}% ${adminEnd}%)`;
  }

  formatTons(n: number): string {
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }

  formatPrice(n: number | null): string {
    if (n == null) return '—';
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
}
