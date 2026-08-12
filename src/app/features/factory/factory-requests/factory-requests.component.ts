import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { FactorySupplyRequestListItem } from '../../../core/models/factory/factory-dashboard.model';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { TranslateService } from '../../../core/services/translate.service';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-factory-requests',
  standalone: true,
  imports: [
    TranslatePipe,
    AppTopBarComponent,
    UiEmptyStateComponent,
    UiErrorStateComponent,
    UiSkeletonComponent,
    FormsModule,
    RouterLink,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './factory-requests.component.html',
})
export class FactoryRequestsComponent implements OnInit {
  private readonly factoryService = inject(FactoryService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<FactorySupplyRequestListItem[]>([]);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly totalCount = signal(0);
  readonly statusFilter = signal('');

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCount() / this.pageSize()))
  );

  readonly statusOptions = [
    '',
    'Pending',
    'Matched',
    'Fulfilled',
    'Cancelled',
  ] as const;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.factoryService
      .listRequests(
        this.page(),
        this.pageSize(),
        this.statusFilter() || null
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.items.set(res.items ?? []);
          this.totalCount.set(res.totalCount ?? 0);
        },
        error: () =>
          this.error.set(this.i18n.instant('factory.requests.loadFailed')),
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  resetFilters(): void {
    this.statusFilter.set('');
    this.page.set(1);
    this.load();
  }

  prevPage(): void {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
    this.load();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((p) => p + 1);
    this.load();
  }

  shortId(id: string): string {
    if (!id) return '—';
    const clean = id.replace(/-/g, '');
    return clean.length > 8 ? `#${clean.slice(0, 8).toUpperCase()}` : `#${clean.toUpperCase()}`;
  }

  budget(row: FactorySupplyRequestListItem): number | null {
    if (row.pricePerTon == null) return null;
    return row.pricePerTon * row.quantityTons;
  }

  statusKey(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 'factory.requests.statusPending';
    if (s === 'matched') return 'factory.requests.statusMatched';
    if (s === 'fulfilled') return 'factory.requests.statusFulfilled';
    if (s === 'cancelled') return 'factory.requests.statusCancelled';
    return 'factory.requests.statusUnknown';
  }

  statusTone(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'matched' || s === 'fulfilled') return 'success';
    if (s === 'cancelled') return 'muted';
    return 'attention';
  }
}
