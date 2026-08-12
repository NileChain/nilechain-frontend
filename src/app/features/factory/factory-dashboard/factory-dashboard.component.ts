import { DecimalPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { TranslateService } from '../../../core/services/translate.service';
import {
  FactoryAttentionItem,
  FactoryDashboardResponse,
  FactorySupplyRequestListItem,
} from '../../../core/models/factory/factory-dashboard.model';
import {
  FactoryConversation,
  FactoryNotification,
  FactoryService,
} from '../../../core/services/factory/factory.service';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { MarketPriceTrendsComponent } from '../market-price-trends/market-price-trends.component';

export interface AttentionItem {
  id: string;
  icon: string;
  title: string;
  status: string;
  cta: string;
  link: string;
  tone: 'attention' | 'info';
}

export interface ActivityItem {
  id: string;
  icon: string;
  title: string;
  meta: string;
  link: string;
  tone?: 'info' | 'alert' | 'success' | 'neutral';
}

export interface ProcurementRow {
  id: string;
  requestId: string;
  commodity: string | null;
  quantityTons: number | null;
  budgetEgp: number | null;
  status: string;
  date: string | null;
  link: string;
  matchCount?: number;
}

@Component({
  selector: 'app-factory-dashboard',
  imports: [
    RouterLink,
    TranslatePipe,
    DecimalPipe,
    DatePipe,
    UiErrorStateComponent,
    UiSkeletonComponent,
    AppTopBarComponent,
    MarketPriceTrendsComponent,
  ],
  templateUrl: './factory-dashboard.component.html',
  styleUrl: './factory-dashboard.component.scss',
})
export class FactoryDashboardComponent implements OnInit {
  private readonly factoryService = inject(FactoryService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly dashboard = signal<FactoryDashboardResponse | null>(null);
  readonly notifications = signal<FactoryNotification[]>([]);
  readonly conversations = signal<FactoryConversation[]>([]);

  readonly openRequestCount = computed(
    () => this.dashboard()?.openRequestsCount ?? 0
  );

  readonly matchesCount = computed(
    () => this.dashboard()?.activeMatchesCount ?? 0
  );

  readonly activeContractsCount = computed(
    () => this.dashboard()?.activeContractsCount ?? 0
  );

  readonly totalProcurement = computed(() => {
    const value = this.dashboard()?.totalProcurementValue;
    return value != null && value > 0 ? value : null;
  });

  readonly supplyHealthScore = computed(() => {
    const avg = this.dashboard()?.averageSupplierRiskScore;
    if (avg == null || avg <= 0) return null;
    return Math.max(0, Math.min(100, Math.round(avg)));
  });

  readonly attentionItems = computed(() => this.buildAttention());
  readonly activityItems = computed(() => this.buildActivity());
  readonly procurementRows = computed(() => this.buildProcurementRows());

  readonly menuOpenId = signal<string | null>(null);

  constructor(title: Title) {
    title.setTitle('NileChain - Factory Dashboard');
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      dashboard: this.factoryService.getDashboard(),
      notifications: this.factoryService.getNotifications().pipe(
        catchError(() => of([] as FactoryNotification[]))
      ),
      conversations: this.factoryService.getConversations().pipe(
        catchError(() => of([] as FactoryConversation[]))
      ),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ dashboard, notifications, conversations }) => {
          this.dashboard.set(dashboard);
          this.notifications.set(notifications ?? []);
          this.conversations.set(conversations ?? []);
        },
        error: () =>
          this.error.set(
            this.i18n.instant('factory.dashboard.loadError')
          ),
      });
  }

  formatProcurement(value: number | null): string {
    if (value == null) return '—';
    if (value >= 1_000_000) {
      const m = value / 1_000_000;
      return `EGP ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
    }
    if (value >= 1_000) {
      const k = value / 1_000;
      return `EGP ${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
    }
    return `EGP ${Math.round(value).toLocaleString()}`;
  }

  shortId(id: string): string {
    if (!id) return '—';
    const clean = id.replace(/-/g, '');
    return clean.length > 8 ? `#${clean.slice(0, 8).toUpperCase()}` : `#${clean.toUpperCase()}`;
  }

  statusKey(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'matched') return 'factory.requests.statusMatched';
    if (s === 'pending') return 'factory.requests.statusPending';
    if (s === 'fulfilled') return 'factory.requests.statusFulfilled';
    if (s === 'cancelled') return 'factory.requests.statusCancelled';
    return 'factory.dashboard.statusPendingApproval';
  }

  statusTone(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'matched' || s === 'fulfilled') return 'success';
    if (s === 'cancelled') return 'muted';
    return 'attention';
  }

  supplyHealthLabel(score: number | null): string {
    if (score == null) {
      return this.i18n.instant('factory.dashboard.supplyHealthUnset');
    }
    if (score >= 75) return this.i18n.instant('factory.dashboard.optimal');
    if (score >= 50) return this.i18n.instant('factory.dashboard.supplyHealthModerate');
    return this.i18n.instant('factory.dashboard.supplyHealthNeedsWork');
  }

  supplyHealthBody(score: number | null): string {
    if (score == null) {
      return this.i18n.instant('factory.dashboard.supplyHealthEmptyBody');
    }
    if (score >= 75) {
      return this.i18n.instant('factory.dashboard.supplyHealthGoodBody');
    }
    if (score >= 50) {
      return this.i18n.instant('factory.dashboard.supplyHealthModerateBody');
    }
    return this.i18n.instant('factory.dashboard.supplyHealthRiskBody');
  }

  toggleMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.menuOpenId.update((cur) => (cur === id ? null : id));
  }

  closeMenu(): void {
    this.menuOpenId.set(null);
  }

  private buildAttention(): AttentionItem[] {
    const items = this.dashboard()?.attention ?? [];
    return items.slice(0, 3).map((item) => this.mapAttentionItem(item));
  }

  private mapAttentionItem(item: FactoryAttentionItem): AttentionItem {
    return {
      id: item.id,
      icon: this.attentionIcon(item.kind),
      title: item.title,
      status: item.status,
      cta: item.cta,
      link: item.link.startsWith('/') ? item.link : `/${item.link}`,
      tone: item.tone === 'info' ? 'info' : 'attention',
    };
  }

  private attentionIcon(kind: string): string {
    const k = (kind || '').toLowerCase();
    if (k.includes('sign')) return 'draw';
    if (k.includes('counter')) return 'handshake';
    if (k.includes('fulfill') || k.includes('receive') || k.includes('qc')) {
      return 'local_shipping';
    }
    if (k.includes('pay')) return 'payments';
    if (k.includes('pending') || k.includes('request')) return 'assignment';
    return 'notifications';
  }

  private buildActivity(): ActivityItem[] {
    const notes = [...this.notifications()]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    if (notes.length) {
      const seen = new Set<string>();
      const items: ActivityItem[] = [];
      for (const n of notes) {
        const title = (n.title || n.message || '').trim();
        const key = `${title.toLowerCase()}|${n.type ?? ''}`;
        if (!title || seen.has(key)) continue;
        seen.add(key);
        items.push({
          id: n.notificationId,
          icon: this.notificationIcon(n.type),
          title,
          meta: this.relativeTime(n.createdAt),
          link: n.link || '/factory/notifications',
          tone: this.activityTone(n.type, title),
        });
        if (items.length >= 6) break;
      }
      return items;
    }

    const convos = [...this.conversations()]
      .filter((c) => c.lastMessageAt)
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt!).getTime() -
          new Date(a.lastMessageAt!).getTime()
      )
      .slice(0, 5);

    return convos.map((c) => ({
      id: c.matchId,
      icon: 'mail',
      title: c.lastMessage || c.farmName,
      meta: this.relativeTime(c.lastMessageAt!),
      link: '/factory/messages',
      tone: 'neutral' as const,
    }));
  }

  private activityTone(
    type: string | null,
    title: string
  ): ActivityItem['tone'] {
    const t = `${type ?? ''} ${title}`.toLowerCase();
    if (/risk|weather|alert|warn|fail|error/.test(t)) return 'alert';
    if (/sign|complet|success|approved|accept/.test(t)) return 'success';
    if (/match|ai|agent|price|market/.test(t)) return 'info';
    return 'neutral';
  }

  private buildProcurementRows(): ProcurementRow[] {
    const recent = this.dashboard()?.recentRequests ?? [];
    return recent.map((r) => this.mapProcurementRow(r));
  }

  private mapProcurementRow(r: FactorySupplyRequestListItem): ProcurementRow {
    const budget =
      r.pricePerTon != null ? r.pricePerTon * r.quantityTons : null;
    return {
      id: r.requestId,
      requestId: r.requestId,
      commodity: r.crop || null,
      quantityTons: r.quantityTons ?? null,
      budgetEgp: budget,
      status: r.status,
      date: r.deliveryDate || r.createdAt || null,
      matchCount: r.matchCount,
      link: `/factory/requests/${r.requestId}`,
    };
  }

  private notificationIcon(type: string | null): string {
    const t = (type || '').toLowerCase();
    if (t.includes('match')) return 'handshake';
    if (t.includes('contract')) return 'description';
    if (t.includes('message') || t.includes('chat')) return 'mail';
    if (t.includes('agent')) return 'smart_toy';
    if (t.includes('weather')) return 'thermostat';
    if (t.includes('price')) return 'trending_up';
    return 'notifications';
  }

  private relativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return '';
    const diffMs = Date.now() - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return this.i18n.instant('factory.dashboard.timeJustNow');
    if (mins < 60) {
      return this.i18n.instant('factory.dashboard.timeMinutesAgo', {
        count: mins,
      });
    }
    const hours = Math.floor(mins / 60);
    if (hours < 24) {
      return this.i18n.instant('factory.dashboard.timeHoursAgo', {
        count: hours,
      });
    }
    const days = Math.floor(hours / 24);
    if (days === 1) return this.i18n.instant('factory.dashboard.timeYesterday');
    return this.i18n.instant('factory.dashboard.timeDaysAgo', { count: days });
  }
}
