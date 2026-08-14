import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import {
  FactoryContract,
  FactoryService,
} from '../../../core/services/factory/factory.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiPortalHeroComponent } from '../../../shared/ui/portal-hero/portal-hero.component';
import { contractStatusLabelKey } from '../../../shared/contracts/contract-text.util';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { UiAutoAnimateDirective } from '../../../shared/directives/ui-auto-animate.directive';

type StatusFilter = 'all' | 'pending' | 'signed' | 'cancelled';
type SortKey = 'newest' | 'oldest' | 'delivery' | 'status' | 'farm';

@Component({
  selector: 'app-factory-contracts',
  standalone: true,
  imports: [
    TranslatePipe,
    RouterLink,
    FormsModule,
    AppTopBarComponent,
    UiPortalHeroComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    DatePipe,
    DecimalPipe,
    UiAutoAnimateDirective,
  ],
  templateUrl: './factory-contracts.component.html',
})
export class FactoryContractsComponent implements OnInit {
  private readonly factoryService = inject(FactoryService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly contracts = signal<FactoryContract[]>([]);
  readonly downloadingId = signal<string | null>(null);

  readonly statusFilter = signal<StatusFilter>('all');
  readonly searchQuery = signal('');
  /** Default: newest first by CreatedAt (not deliveryDate). */
  readonly sortKey = signal<SortKey>('newest');

  readonly filteredContracts = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const filter = this.statusFilter();
    let rows = this.contracts().filter((c) => this.matchesFilter(c, filter));

    if (q) {
      rows = rows.filter((c) => {
        const id = (c.contractId || '').toLowerCase();
        const farm = (c.farmName || '').toLowerCase();
        const crop = (c.cropName || '').toLowerCase();
        return id.includes(q) || farm.includes(q) || crop.includes(q);
      });
    }

    const key = this.sortKey();
    return [...rows].sort((a, b) => this.compare(a, b, key));
  });

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.factoryService
      .getContracts()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.contracts.set(items ?? []),
        error: (err) =>
          this.error.set(
            err?.error?.message ||
              this.i18n.instant('factory.contracts.loadFailed')
          ),
      });
  }

  setStatusFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  onSort(value: string): void {
    if (
      value === 'newest' ||
      value === 'oldest' ||
      value === 'delivery' ||
      value === 'status' ||
      value === 'farm'
    ) {
      this.sortKey.set(value);
    }
  }

  openContract(contract: FactoryContract): void {
    void this.router.navigate(['/factory/contracts', contract.contractId]);
  }

  downloadPdf(contract: FactoryContract, event: Event): void {
    event.stopPropagation();
    if (this.downloadingId()) {
      return;
    }
    this.downloadingId.set(contract.contractId);
    this.factoryService
      .downloadContractPdf(contract.contractId)
      .pipe(finalize(() => this.downloadingId.set(null)))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nilechain-contract-${contract.contractId}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          this.toast.success(
            this.i18n.instant('factory.contracts.downloadSuccess')
          );
        },
        error: () =>
          this.toast.error(
            this.i18n.instant('factory.contracts.downloadFailed')
          ),
      });
  }

  shortId(id: string): string {
    return id?.length > 8 ? `${id.slice(0, 8).toUpperCase()}…` : id;
  }

  statusLabelKey(status: string): string {
    return contractStatusLabelKey(status);
  }

  isActive(status: string): boolean {
    const s = status.toLowerCase();
    return s === 'signed' || s === 'active' || s === 'completed';
  }

  isPending(status: string): boolean {
    const s = status.toLowerCase();
    return (
      s === 'pendingsignature' ||
      s === 'pendingfarmsignature' ||
      s === 'pendingfactorysignature' ||
      s === 'draft' ||
      s === 'pending'
    );
  }

  isCancelled(status: string): boolean {
    const s = status.toLowerCase();
    return s === 'cancelled' || s === 'rejected';
  }

  private matchesFilter(c: FactoryContract, filter: StatusFilter): boolean {
    if (filter === 'all') return true;
    if (filter === 'pending') return this.isPending(c.status);
    if (filter === 'signed') return this.isActive(c.status);
    if (filter === 'cancelled') return this.isCancelled(c.status);
    return true;
  }

  private compare(a: FactoryContract, b: FactoryContract, key: SortKey): number {
    if (key === 'farm') {
      return (a.farmName || '').localeCompare(b.farmName || '');
    }
    if (key === 'status') {
      return (a.status || '').localeCompare(b.status || '');
    }
    if (key === 'delivery') {
      const da = a.deliveryDate ? Date.parse(a.deliveryDate) : 0;
      const db = b.deliveryDate ? Date.parse(b.deliveryDate) : 0;
      return db - da;
    }
    if (key === 'oldest') {
      const ca = a.createdAt ? Date.parse(a.createdAt) : 0;
      const cb = b.createdAt ? Date.parse(b.createdAt) : 0;
      if (ca !== cb) return ca - cb;
      return (a.contractId || '').localeCompare(b.contractId || '');
    }
    // newest (default): CreatedAt DESC
    const ca = a.createdAt ? Date.parse(a.createdAt) : 0;
    const cb = b.createdAt ? Date.parse(b.createdAt) : 0;
    if (cb !== ca) return cb - ca;
    return (b.contractId || '').localeCompare(a.contractId || '');
  }
}
