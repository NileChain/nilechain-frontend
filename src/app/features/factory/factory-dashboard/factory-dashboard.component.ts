import { DecimalPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { TranslateService } from '../../../core/services/translate.service';
import {
  FactoryContract,
  FactoryConversation,
  FactoryMatchedFarm,
  FactoryNotification,
  FactoryService,
} from '../../../core/services/factory/factory.service';
import {
  PendingSupplyRequest,
  readPendingSupplyRequest,
} from '../../../core/utils/agent-session';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { MarketPriceTrendsComponent } from '../market-price-trends/market-price-trends.component';

export interface AttentionItem {
  id: string;
  icon: string;
  titleKey: string;
  titleParams?: Record<string, string | number>;
  statusKey: string;
  ctaKey: string;
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
  status: 'matched' | 'draft' | 'pending';
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

  readonly matches = signal<FactoryMatchedFarm[]>([]);
  readonly contracts = signal<FactoryContract[]>([]);
  readonly notifications = signal<FactoryNotification[]>([]);
  readonly conversations = signal<FactoryConversation[]>([]);
  readonly pendingRequest = signal<PendingSupplyRequest | null>(null);

  readonly openRequestCount = computed(() => {
    const ids = new Set<string>();
    for (const m of this.matches()) {
      if (m.requestId) ids.add(m.requestId);
    }
    const pending = this.pendingRequest();
    if (pending?.requestId) ids.add(pending.requestId);
    return ids.size;
  });

  readonly matchesCount = computed(() => this.matches().length);

  readonly activeContractsCount = computed(() =>
    this.contracts().filter((c) => this.isActiveContract(c.status)).length
  );

  readonly totalProcurement = computed(() => {
    let total = 0;
    let hasValue = false;
    for (const c of this.contracts()) {
      if (c.pricePerTon != null && c.quantityTons > 0) {
        total += c.pricePerTon * c.quantityTons;
        hasValue = true;
      }
    }
    return hasValue ? total : null;
  });

  readonly supplyHealthScore = computed(() => {
    const scores = this.matches()
      .map((m) => m.riskScore)
      .filter((s): s is number => s != null && Number.isFinite(s));
    if (!scores.length) return null;
    // Matched-farm scores use higher = healthier / lower risk (same as matches UI).
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
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
    this.pendingRequest.set(readPendingSupplyRequest());

    forkJoin({
      matches: this.factoryService.getMatchedFarms(),
      contracts: this.factoryService.getContracts(),
      notifications: this.factoryService.getNotifications().pipe(
        catchError(() => of([] as FactoryNotification[]))
      ),
      conversations: this.factoryService.getConversations().pipe(
        catchError(() => of([] as FactoryConversation[]))
      ),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ matches, contracts, notifications, conversations }) => {
          this.matches.set(matches ?? []);
          this.contracts.set(contracts ?? []);
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

  statusKey(status: ProcurementRow['status']): string {
    if (status === 'matched') return 'factory.dashboard.statusMatched';
    if (status === 'draft') return 'factory.dashboard.statusDraft';
    return 'factory.dashboard.statusPendingApproval';
  }

  statusTone(status: ProcurementRow['status']): string {
    if (status === 'matched') return 'success';
    if (status === 'draft') return 'muted';
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

  private isActiveContract(status: string): boolean {
    const s = (status || '').toLowerCase();
    return s === 'signed' || s === 'active' || s === 'draft' || s === 'pending';
  }

  private buildAttention(): AttentionItem[] {
    const items: AttentionItem[] = [];
    const matchCount = this.matches().length;
    if (matchCount > 0) {
      items.push({
        id: 'matches',
        icon: 'handshake',
        titleKey: 'factory.dashboard.attentionMatches',
        titleParams: { count: matchCount },
        statusKey: 'factory.dashboard.attentionReady',
        ctaKey: 'factory.dashboard.reviewMatchesCta',
        link: '/factory/matches',
        tone: 'attention',
      });
    }

    const awaiting = this.contracts().filter((c) => {
      const s = (c.status || '').toLowerCase();
      return s === 'draft' || s === 'pending' || s === 'generated';
    }).length;
    if (awaiting > 0) {
      items.push({
        id: 'contracts',
        icon: 'draw',
        titleKey: 'factory.dashboard.attentionContracts',
        titleParams: { count: awaiting },
        statusKey: 'factory.dashboard.attentionSignature',
        ctaKey: 'factory.dashboard.reviewContractsCta',
        link: '/factory/contracts',
        tone: 'attention',
      });
    }

    const unreadMsgs = this.conversations().reduce(
      (sum, c) => sum + (c.unreadCount || 0),
      0
    );
    if (unreadMsgs > 0) {
      items.push({
        id: 'messages',
        icon: 'chat',
        titleKey: 'factory.dashboard.attentionMessages',
        titleParams: { count: unreadMsgs },
        statusKey: 'factory.dashboard.attentionUnread',
        ctaKey: 'factory.dashboard.openMessagesCta',
        link: '/factory/messages',
        tone: 'info',
      });
    }

    const unreadNotes = this.notifications().filter((n) => !n.isRead).length;
    if (unreadNotes > 0 && items.length < 3) {
      items.push({
        id: 'notifications',
        icon: 'notifications',
        titleKey: 'factory.dashboard.attentionNotifications',
        titleParams: { count: unreadNotes },
        statusKey: 'factory.dashboard.attentionUnread',
        ctaKey: 'factory.dashboard.viewNotificationsCta',
        link: '/factory/notifications',
        tone: 'info',
      });
    }

    return items.slice(0, 3);
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
    const rows: ProcurementRow[] = [];
    const pending = this.pendingRequest();
    const seen = new Set<string>();

    if (pending?.requestId) {
      seen.add(pending.requestId);
      const budget =
        pending.price != null && pending.quantity != null
          ? pending.price * pending.quantity
          : null;
      rows.push({
        id: `pending-${pending.requestId}`,
        requestId: pending.requestId,
        commodity: pending.crop || null,
        quantityTons: pending.quantity ?? null,
        budgetEgp: budget,
        status: 'draft',
        date: pending.deliveryDate || null,
        link: `/factory/agent-progress?requestId=${encodeURIComponent(pending.requestId)}`,
      });
    }

    const byRequest = new Map<string, FactoryMatchedFarm[]>();
    for (const m of this.matches()) {
      const rid = m.requestId;
      if (!rid) continue;
      if (!byRequest.has(rid)) byRequest.set(rid, []);
      byRequest.get(rid)!.push(m);
    }

    for (const [requestId, group] of byRequest) {
      if (seen.has(requestId)) {
        const existing = rows.find((r) => r.requestId === requestId);
        if (existing) {
          existing.status = 'matched';
          existing.matchCount = group.length;
          existing.link = '/factory/matches';
        }
        continue;
      }
      seen.add(requestId);
      const latest = group.reduce((best, cur) => {
        const bt = best.createdAt ? Date.parse(best.createdAt) : 0;
        const ct = cur.createdAt ? Date.parse(cur.createdAt) : 0;
        return ct >= bt ? cur : best;
      }, group[0]);
      rows.push({
        id: `req-${requestId}`,
        requestId,
        commodity: null,
        quantityTons: null,
        budgetEgp: null,
        status: 'matched',
        date: latest?.createdAt || null,
        matchCount: group.length,
        link: '/factory/matches',
      });
    }

    // Newest procurement activity first (match CreatedAt / pending first).
    rows.sort((a, b) => {
      if (a.status === 'draft' && b.status !== 'draft') return -1;
      if (b.status === 'draft' && a.status !== 'draft') return 1;
      const ta = a.date ? Date.parse(a.date) : 0;
      const tb = b.date ? Date.parse(b.date) : 0;
      return tb - ta;
    });

    return rows.slice(0, 8);
  }

  private notificationIcon(type: string | null): string {
    const t = (type || '').toLowerCase();
    if (t.includes('match')) return 'handshake';
    if (t.includes('contract')) return 'description';
    if (t.includes('message') || t.includes('chat')) return 'mail';
    if (t.includes('agent')) return 'smart_toy';
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
