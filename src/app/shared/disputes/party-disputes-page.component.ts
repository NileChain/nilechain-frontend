import { SlicePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { UiDatePipe } from '../../core/pipes/ui-date.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { Dispute, DisputeList } from '../../core/models/dispute/dispute.model';
import { FarmService } from '../../core/services/farm/farm.service';
import { FactoryService } from '../../core/services/factory/factory.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslateService } from '../../core/services/translate.service';
import { AppTopBarComponent } from '../components/app-top-bar/app-top-bar.component';
import { UiPortalHeroComponent } from '../ui/portal-hero/portal-hero.component';
import { UiLoaderComponent } from '../ui/loader/loader.component';
import { UiErrorStateComponent } from '../ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../ui/empty-state/empty-state.component';
import { UiAutoAnimateDirective } from '../directives/ui-auto-animate.directive';
import { UiRevealDirective } from '../directives/ui-reveal.directive';

type DisputeFilter = 'all' | 'active' | 'closed';

@Component({
  selector: 'app-party-disputes-page',
  standalone: true,
  imports: [
    UiDatePipe, SlicePipe,
    RouterLink,
    TranslatePipe,
    AppTopBarComponent,
    UiPortalHeroComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
    UiAutoAnimateDirective,
    UiRevealDirective,
  ],
  templateUrl: './party-disputes-page.component.html',
})
export class PartyDisputesPageComponent implements OnInit {
  private readonly farmApi = inject(FarmService);
  private readonly factoryApi = inject(FactoryService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly disputes = signal<Dispute[]>([]);
  readonly filter = signal<DisputeFilter>('all');
  readonly focusDisputeId = signal<string | null>(null);

  readonly filterTabs: { id: DisputeFilter; labelKey: string }[] = [
    { id: 'all', labelKey: 'dispute.filterAll' },
    { id: 'active', labelKey: 'dispute.filterActive' },
    { id: 'closed', labelKey: 'dispute.filterClosed' },
  ];

  readonly filteredDisputes = computed(() => {
    const items = this.disputes();
    const f = this.filter();
    if (f === 'active') {
      return items.filter((d) => this.isActive(d.status));
    }
    if (f === 'closed') {
      return items.filter((d) => !this.isActive(d.status));
    }
    return items;
  });

  get portal(): 'farm' | 'factory' {
    const role = this.auth.currentUser()?.role ?? this.auth.roles()[0];
    return role === 'Factory' ? 'factory' : 'farm';
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.focusDisputeId.set(params.get('disputeId'));
      this.scrollToFocus();
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const req =
      this.portal === 'farm'
        ? this.farmApi.listMyDisputes()
        : this.factoryApi.listMyDisputes();
    req.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res: DisputeList) => {
        const items = res.items ?? [];
        this.disputes.set(items);
        const id = this.focusDisputeId();
        if (id) {
          const found = items.find((d) => d.disputeId === id);
          if (found && !this.isActive(found.status)) {
            this.filter.set('all');
          }
        }
        this.scrollToFocus();
      },
      error: () => this.error.set(this.i18n.instant('dispute.inboxLoadFailed')),
    });
  }

  private scrollToFocus(): void {
    const id = this.focusDisputeId();
    if (!id) {
      return;
    }
    setTimeout(() => {
      document
        .getElementById(`dispute-${id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  }

  setFilter(id: DisputeFilter): void {
    this.filter.set(id);
  }

  countFor(id: DisputeFilter): number {
    const items = this.disputes();
    if (id === 'active') {
      return items.filter((d) => this.isActive(d.status)).length;
    }
    if (id === 'closed') {
      return items.filter((d) => !this.isActive(d.status)).length;
    }
    return items.length;
  }

  contractLink(contractId: string): string {
    return this.portal === 'farm'
      ? `/farm/contracts/${contractId}`
      : `/factory/contracts/${contractId}`;
  }

  statusKey(status: string): string {
    return `dispute.status.${status}`;
  }

  typeKey(type: string): string {
    return `dispute.type.${type}`;
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2);
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  /** Maps dispute status → shared ui-status-pill modifier (token colors). */
  statusPillClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('open') || s.includes('pending') || s.includes('raised')) {
      return 'ui-status-pill--warning';
    }
    if (s.includes('review')) {
      return 'ui-status-pill--warning';
    }
    if (s.includes('resolv') || s.includes('closed') || s.includes('won')) {
      return 'ui-status-pill--success';
    }
    if (s.includes('reject') || s.includes('escalat') || s.includes('lost')) {
      return 'ui-status-pill--error';
    }
    return 'ui-status-pill--info';
  }

  private isActive(status: string): boolean {
    const s = (status || '').toLowerCase();
    return (
      s.includes('open') ||
      s.includes('review') ||
      s.includes('pending') ||
      s.includes('raised')
    );
  }
}
