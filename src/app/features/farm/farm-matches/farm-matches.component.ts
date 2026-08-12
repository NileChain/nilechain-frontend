import { DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { FarmService } from '../../../core/services/farm/farm.service';
import {
  FarmMatchItem,
  FarmMatchSummary,
} from '../../../core/models/farm/farm-match.model';
import { CropType } from '../../../core/models/farm/farm-profile.model';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import {
  ListSortMode,
  normalizeListSort,
  relativeTimeParts,
} from '../../../shared/list/list-ordering.util';

type DateFilter = 'all' | '7d' | '30d' | '90d';

interface FilterChip {
  key: 'status' | 'crop' | 'date' | 'search';
  label: string;
}

@Component({
  selector: 'app-farm-matches',
  standalone: true,
  imports: [
    TranslatePipe,
    AppTopBarComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    FormsModule,
    RouterLink,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './farm-matches.component.html',
  styleUrl: './farm-matches.component.scss',
})
export class FarmMatchesComponent implements OnInit {
  private readonly farmService = inject(FarmService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly matches = signal<FarmMatchItem[]>([]);
  readonly newMatches = signal<FarmMatchItem[]>([]);
  readonly cropTypes = signal<CropType[]>([]);
  readonly respondingId = signal<string | null>(null);
  readonly openingId = signal<string | null>(null);
  readonly counteringId = signal<string | null>(null);
  readonly counterFormMatchId = signal<string | null>(null);
  readonly counterQty = signal<number | null>(null);
  readonly counterPrice = signal<number | null>(null);
  readonly counterDelivery = signal('');
  readonly counterNote = signal('');
  readonly filtersOpen = signal(false);
  readonly menuOpenId = signal<string | null>(null);
  readonly expandedId = signal<string | null>(null);

  readonly summary = signal<FarmMatchSummary>({
    total: 0,
    proposed: 0,
    accepted: 0,
    rejected: 0,
    newCount: 0,
  });

  readonly statusFilter = signal('');
  readonly cropTypeFilter = signal('');
  readonly searchQuery = signal('');
  readonly dateFilter = signal<DateFilter>('all');
  readonly sortMode = signal<ListSortMode>('newest');
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly totalCount = signal(0);
  readonly totalPages = signal(1);

  /** Draft values inside the filter panel (applied on confirm). */
  readonly draftStatus = signal('');
  readonly draftCrop = signal('');
  readonly draftDate = signal<DateFilter>('all');

  readonly hasActiveFilters = computed(
    () =>
      !!this.statusFilter() ||
      !!this.cropTypeFilter() ||
      !!this.searchQuery().trim() ||
      this.dateFilter() !== 'all'
  );

  /** Reset is visible when filters, search, or non-default sort are applied. */
  readonly showReset = computed(
    () => this.hasActiveFilters() || this.sortMode() !== 'newest'
  );

  readonly activeFilterCount = computed(() => {
    let n = 0;
    if (this.statusFilter()) n++;
    if (this.cropTypeFilter()) n++;
    if (this.dateFilter() !== 'all') n++;
    return n;
  });

  readonly filterChips = computed((): FilterChip[] => {
    const chips: FilterChip[] = [];
    const status = this.statusFilter();
    if (status) {
      chips.push({
        key: 'status',
        label: `${this.i18n.instant('farm.matches.status')}: ${this.i18n.instant(this.statusLabelKey(status))}`,
      });
    }
    const cropId = this.cropTypeFilter();
    if (cropId) {
      const crop = this.cropTypes().find((c) => c.cropTypeId === cropId);
      chips.push({
        key: 'crop',
        label: `${this.i18n.instant('farm.matches.crop')}: ${crop?.name ?? cropId}`,
      });
    }
    const date = this.dateFilter();
    if (date !== 'all') {
      const dateKey =
        date === '7d'
          ? 'farm.matches.date7d'
          : date === '30d'
            ? 'farm.matches.date30d'
            : 'farm.matches.date90d';
      chips.push({
        key: 'date',
        label: `${this.i18n.instant('farm.matches.dateFilter')}: ${this.i18n.instant(dateKey)}`,
      });
    }
    const q = this.searchQuery().trim();
    if (q) {
      chips.push({
        key: 'search',
        label: `${this.i18n.instant('common.search')}: ${q}`,
      });
    }
    return chips;
  });

  readonly resultsCountLabel = computed(() => {
    const total = this.totalCount();
    if (total === 0) {
      return this.i18n.instant('farm.matches.resultsCountZero');
    }
    return this.i18n.instant('farm.matches.resultsCount', { count: total });
  });

  readonly pageRangeLabel = computed(() => {
    const total = this.totalCount();
    if (total === 0) {
      return this.i18n.instant('farm.matches.resultsNone');
    }
    const start = (this.page() - 1) * this.pageSize() + 1;
    const end = Math.min(this.page() * this.pageSize(), total);
    return this.i18n.instant('farm.matches.resultsRange', {
      start,
      end,
      total,
    });
  });

  readonly mainListEmpty = computed(
    () => !this.loading() && !this.error() && this.matches().length === 0
  );

  readonly globallyEmpty = computed(
    () =>
      this.mainListEmpty() &&
      !this.hasActiveFilters() &&
      this.summary().total === 0
  );

  readonly filteredEmpty = computed(
    () => this.mainListEmpty() && this.hasActiveFilters()
  );

  ngOnInit(): void {
    this.farmService.getCropTypes().subscribe({
      next: (crops) => this.cropTypes.set(crops),
    });
    this.loadMatches();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (!target.closest?.('.mx-menu')) {
      this.menuOpenId.set(null);
    }

    if (
      this.filtersOpen() &&
      !target.closest?.('.mx-filter') &&
      !target.closest?.('.mx-sheet') &&
      !target.closest?.('.mx-sheet-backdrop')
    ) {
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      if (!isMobile) {
        this.closeFilters();
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.filtersOpen()) {
      this.closeFilters();
    }
    this.menuOpenId.set(null);
  }

  loadMatches(): void {
    this.loading.set(true);
    this.error.set(null);
    this.menuOpenId.set(null);

    const days =
      this.dateFilter() === 'all'
        ? null
        : this.dateFilter() === '7d'
          ? 7
          : this.dateFilter() === '30d'
            ? 30
            : 90;

    this.farmService
      .getMatches({
        status: this.statusFilter() || null,
        cropTypeId: this.cropTypeFilter() || null,
        sort: this.sortMode(),
        search: this.searchQuery().trim() || null,
        days,
        page: this.page(),
        pageSize: this.pageSize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.matches.set(page.items ?? []);
          this.newMatches.set(page.newMatches ?? []);
          this.summary.set(
            page.summary ?? {
              total: 0,
              proposed: 0,
              accepted: 0,
              rejected: 0,
              newCount: 0,
            }
          );
          this.totalCount.set(page.totalCount ?? 0);
          this.totalPages.set(Math.max(1, page.totalPages ?? 1));
          this.page.set(page.page ?? this.page());
          this.pageSize.set(page.pageSize ?? this.pageSize());
        },
        error: () =>
          this.error.set(this.i18n.instant('farm.matches.loadFailed')),
      });
  }

  applySearch(): void {
    this.page.set(1);
    this.loadMatches();
  }

  onSortChange(value: string): void {
    this.sortMode.set(normalizeListSort(value));
    this.page.set(1);
    this.loadMatches();
  }

  onPageSizeChange(value: string | number): void {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) return;
    this.pageSize.set(n);
    this.page.set(1);
    this.loadMatches();
  }

  goToPage(page: number): void {
    const p = Math.min(Math.max(1, page), this.totalPages());
    if (p === this.page()) return;
    this.page.set(p);
    this.loadMatches();
  }

  openFilters(event?: Event): void {
    event?.stopPropagation();
    this.draftStatus.set(this.statusFilter());
    this.draftCrop.set(this.cropTypeFilter());
    this.draftDate.set(this.dateFilter());
    this.filtersOpen.set(true);
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
  }

  toggleFilters(event?: Event): void {
    if (this.filtersOpen()) {
      this.closeFilters();
      return;
    }
    this.openFilters(event);
  }

  applyFilters(): void {
    this.statusFilter.set(this.draftStatus());
    this.cropTypeFilter.set(this.draftCrop());
    this.dateFilter.set(this.draftDate());
    this.page.set(1);
    this.filtersOpen.set(false);
    this.loadMatches();
  }

  /** Clears draft fields + applied filters from the panel without leaving search. */
  resetPanelFilters(): void {
    this.draftStatus.set('');
    this.draftCrop.set('');
    this.draftDate.set('all');
    this.statusFilter.set('');
    this.cropTypeFilter.set('');
    this.dateFilter.set('all');
    this.page.set(1);
    this.filtersOpen.set(false);
    this.loadMatches();
  }

  resetFilters(): void {
    this.statusFilter.set('');
    this.cropTypeFilter.set('');
    this.searchQuery.set('');
    this.dateFilter.set('all');
    this.draftStatus.set('');
    this.draftCrop.set('');
    this.draftDate.set('all');
    this.sortMode.set('newest');
    this.page.set(1);
    this.filtersOpen.set(false);
    this.loadMatches();
  }

  clearChip(key: FilterChip['key']): void {
    if (key === 'status') this.statusFilter.set('');
    if (key === 'crop') this.cropTypeFilter.set('');
    if (key === 'date') this.dateFilter.set('all');
    if (key === 'search') this.searchQuery.set('');
    this.page.set(1);
    this.loadMatches();
  }

  toggleMenu(matchId: string, event: Event): void {
    event.stopPropagation();
    this.menuOpenId.update((id) => (id === matchId ? null : matchId));
  }

  toggleExpand(matchId: string): void {
    this.expandedId.update((id) => (id === matchId ? null : matchId));
  }

  statusKey(status: string | null | undefined): string {
    return (status || '').toLowerCase();
  }

  statusLabelKey(status: string): string {
    const s = this.statusKey(status);
    if (s === 'accepted') return 'farm.matches.statusAccepted';
    if (s === 'rejected') return 'farm.matches.statusRejected';
    if (s === 'countered') return 'farm.matches.statusCountered';
    return 'farm.matches.statusProposed';
  }

  statusTone(status: string): 'pending' | 'success' | 'danger' | 'neutral' {
    const s = this.statusKey(status);
    if (s === 'accepted') return 'success';
    if (s === 'rejected') return 'danger';
    if (s === 'proposed' || s === 'countered') return 'pending';
    return 'neutral';
  }

  displayQty(match: FarmMatchItem): number {
    return match.effectiveQuantityTons ?? match.quantityTons;
  }

  displayPrice(match: FarmMatchItem): number | null {
    return match.effectivePricePerTon ?? match.pricePerTon;
  }

  displayDelivery(match: FarmMatchItem): string | null {
    return match.effectiveDeliveryDate ?? match.deliveryDate;
  }

  openCounterForm(match: FarmMatchItem, event?: Event): void {
    event?.stopPropagation();
    this.menuOpenId.set(null);
    this.counterFormMatchId.set(match.matchId);
    this.counterQty.set(match.quantityTons);
    this.counterPrice.set(match.pricePerTon);
    this.counterDelivery.set(match.deliveryDate?.slice(0, 10) ?? '');
    this.counterNote.set('');
  }

  closeCounterForm(): void {
    this.counterFormMatchId.set(null);
  }

  submitCounterOffer(match: FarmMatchItem): void {
    if (this.counteringId()) return;
    this.counteringId.set(match.matchId);
    this.farmService
      .counterOffer(match.matchId, {
        quantityTons: this.counterQty(),
        pricePerTon: this.counterPrice(),
        deliveryDate: this.counterDelivery().trim() || null,
        note: this.counterNote().trim() || null,
      })
      .pipe(finalize(() => this.counteringId.set(null)))
      .subscribe({
        next: () => {
          this.toast.info(this.i18n.instant('farm.matches.counterSuccess'));
          this.closeCounterForm();
          this.loadMatches();
        },
        error: (err) =>
          this.toast.error(
            err?.error?.detail ||
              err?.error?.message ||
              this.i18n.instant('farm.matches.counterFailed')
          ),
      });
  }

  riskLabel(score: number | null): string {
    if (score == null) return '—';
    if (score >= 70) return this.i18n.instant('farm.matches.riskLow');
    if (score >= 40) return this.i18n.instant('farm.matches.riskMedium');
    return this.i18n.instant('farm.matches.riskHigh');
  }

  truncateQuality(specs: string | null | undefined, max = 80): string | null {
    const text = specs?.trim();
    if (!text) return null;
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
  }

  riskTone(score: number | null): 'low' | 'med' | 'high' | 'none' {
    if (score == null) return 'none';
    if (score >= 70) return 'low';
    if (score >= 40) return 'med';
    return 'high';
  }

  scoreClass(score: number | null): string {
    if (score == null) return 'mx-score--na';
    if (score >= 80) return 'mx-score--high';
    if (score >= 50) return 'mx-score--mid';
    return 'mx-score--low';
  }

  relativeLabel(iso: string | null | undefined): string | null {
    const parts = relativeTimeParts(iso);
    if (!parts) return null;
    return this.i18n.instant(parts.key, parts.params);
  }

  viewContract(match: FarmMatchItem): void {
    this.menuOpenId.set(null);
    this.openingId.set(match.matchId);

    const go = (contractId: string) => {
      void this.router.navigate(['/farm/contracts', contractId], {
        queryParams: { matchId: match.matchId, from: 'matches' },
      });
    };

    if (match.contractId) {
      this.openingId.set(null);
      go(match.contractId);
      return;
    }

    this.farmService
      .getOrCreateContractForMatch(match.matchId)
      .pipe(finalize(() => this.openingId.set(null)))
      .subscribe({
        next: (contract) => go(contract.contractId),
        error: (err) => {
          this.toast.error(
            err?.error?.message ||
              this.i18n.instant('farm.matches.openContractFailed')
          );
        },
      });
  }

  async rejectOffer(match: FarmMatchItem): Promise<void> {
    this.menuOpenId.set(null);
    const ok = await this.confirm.confirm({
      titleKey: 'farm.matches.confirmRejectTitle',
      bodyKey: 'farm.matches.confirmRejectBody',
      confirmKey: 'farm.matches.declineOffer',
      cancelKey: 'common.cancel',
      danger: true,
    });
    if (!ok) return;

    this.respondingId.set(match.matchId);
    this.farmService
      .respondToMatch(match.matchId, 'reject')
      .pipe(finalize(() => this.respondingId.set(null)))
      .subscribe({
        next: () => {
          this.toast.info(this.i18n.instant('farm.matches.rejectSuccess'));
          this.loadMatches();
        },
        error: (err) =>
          this.toast.error(
            err?.error?.message ||
              this.i18n.instant('farm.matches.rejectFailed')
          ),
      });
  }
}
