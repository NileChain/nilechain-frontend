import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { finalize } from 'rxjs';
import {
  CategoryScale,
  Chart,
  ChartConfiguration,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { TranslateService } from '../../../core/services/translate.service';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { FarmService } from '../../../core/services/farm/farm.service';
import {
  FarmDashboard,
  ImprovementTip,
  RecentMatchItem,
  ReliabilityTrendPoint,
} from '../../../core/models/farm/farm-dashboard.model';
import { MarketPriceTrendsComponent } from '../../factory/market-price-trends/market-price-trends.component';

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
  tone: string;
}

@Component({
  selector: 'app-farm-dashboard',
  imports: [
    TranslatePipe,
    UiErrorStateComponent,
    UiSkeletonComponent,
    AppTopBarComponent,
    RouterLink,
    DecimalPipe,
    MarketPriceTrendsComponent,
  ],
  templateUrl: './farm-dashboard.component.html',
  styleUrl: './farm-dashboard.component.scss',
})
export class FarmDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly farmService = inject(FarmService);
  private readonly i18n = inject(TranslateService);

  @ViewChild('trendChart') trendChartRef?: ElementRef<HTMLCanvasElement>;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<FarmDashboard | null>(null);

  readonly attentionItems = computed(() =>
    this.buildAttention(this.dashboard())
  );
  readonly activityItems = computed(() =>
    this.buildActivity(this.dashboard())
  );
  readonly topTips = computed(() => {
    const tips = this.dashboard()?.improvementTips ?? [];
    const rank = (s: string) =>
      s === 'high' ? 0 : s === 'medium' ? 1 : 2;
    return [...tips]
      .sort((a, b) => rank(a.severity) - rank(b.severity))
      .slice(0, 3);
  });

  private chart: Chart | null = null;
  private chartRegistered = false;
  private viewReady = false;

  constructor(title: Title) {
    title.setTitle('NileChain - Farm Dashboard');

    effect(() => {
      const data = this.dashboard();
      const loading = this.loading();
      if (!this.viewReady || loading || !data) {
        return;
      }
      queueMicrotask(() => this.applyTrendChart(data.reliabilityTrend ?? []));
    });
  }

  ngOnInit(): void {
    this.ensureChartJs();
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    const data = this.dashboard();
    if (data && !this.loading()) {
      this.applyTrendChart(data.reliabilityTrend ?? []);
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);
    this.farmService
      .getDashboard()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) =>
          this.dashboard.set({
            ...data,
            reliabilityTrend: data.reliabilityTrend ?? [],
            recentMatches: data.recentMatches ?? [],
            riskBreakdown: data.riskBreakdown ?? [],
            improvementTips: data.improvementTips ?? [],
            collectionsSummary: data.collectionsSummary ?? {
              pendingAmount: 0,
              awaitingConfirmAmount: 0,
              receivedAmount: 0,
              overdueAmount: 0,
              currency: 'EGP',
            },
            expiringCertifications: data.expiringCertifications ?? 0,
            expiredCertifications: data.expiredCertifications ?? 0,
            onTimeFulfillmentRate: data.onTimeFulfillmentRate ?? null,
            qcIssueRate: data.qcIssueRate ?? null,
            repeatBuyers: data.repeatBuyers ?? [],
          }),
        error: () => this.error.set(this.i18n.instant('farm.dashboard.loadFailed')),
      });
  }

  reliabilityHint(score: number | null | undefined): string {
    if (score == null) {
      return this.i18n.instant('farm.dashboard.reliabilityUnset');
    }
    if (score >= 80) {
      return this.i18n.instant('farm.dashboard.reliabilityStrong');
    }
    if (score >= 60) {
      return this.i18n.instant('farm.dashboard.reliabilityModerate');
    }
    return this.i18n.instant('farm.dashboard.reliabilityNeedsWork');
  }

  proposedReviewCount(data: FarmDashboard): number {
    return (data.recentMatches ?? []).filter(
      (m) => (m.status || '').toLowerCase() === 'proposed'
    ).length;
  }

  activeMatchesHint(data: FarmDashboard): string {
    const n = this.proposedReviewCount(data);
    if (n > 0) {
      return this.i18n.instant('farm.dashboard.activeMatchesNeedReview', {
        count: n,
      });
    }
    if (data.activeMatchesCount > 0) {
      return this.i18n.instant('farm.dashboard.activeMatchesOngoing');
    }
    return this.i18n.instant('farm.dashboard.activeMatchesNone');
  }

  scoreTone(score: number | null | undefined): 'high' | 'mid' | 'low' | 'none' {
    if (score == null) return 'none';
    if (score >= 80) return 'high';
    if (score >= 60) return 'mid';
    return 'low';
  }

  statusKey(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'proposed') return 'farm.dashboard.statusProposed';
    if (s === 'accepted') return 'farm.dashboard.statusAccepted';
    if (s === 'rejected') return 'farm.dashboard.statusRejected';
    if (s === 'expired') return 'farm.dashboard.statusExpired';
    return 'farm.dashboard.statusProposed';
  }

  statusTone(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'accepted') return 'success';
    if (s === 'rejected') return 'danger';
    if (s === 'expired') return 'muted';
    return 'attention';
  }

  tipShort(tip: ImprovementTip): string {
    const msg = (tip.message || '').trim();
    if (!msg) {
      return tip.category;
    }
    const sentence = msg.split(/(?<=[.!?])\s+/)[0] ?? msg;
    return sentence.length > 120 ? `${sentence.slice(0, 117)}…` : sentence;
  }

  tipLink(tip: ImprovementTip): string {
    const cat = (tip.category || '').toLowerCase();
    if (/contract/.test(cat)) {
      return '/farm/contracts';
    }
    if (/match|rating|buyer/.test(cat)) {
      return '/farm/matches';
    }
    return '/farm/profile';
  }

  trendDelta(points: ReliabilityTrendPoint[]): number | null {
    if (!points || points.length < 2) {
      return null;
    }
    const first = Number(points[0]!.value);
    const last = Number(points[points.length - 1]!.value);
    return Math.round(last - first);
  }

  private buildAttention(data: FarmDashboard | null): AttentionItem[] {
    if (!data) {
      return [];
    }
    const items: AttentionItem[] = [];
    if ((data.collectionsSummary?.overdueAmount ?? 0) > 0) {
      items.push({
        id: 'overdue-payments',
        icon: 'warning',
        titleKey: 'farm.dashboard.attentionOverdue',
        titleParams: {
          amount: Math.round(data.collectionsSummary.overdueAmount),
        },
        statusKey: 'farm.dashboard.attentionOverdueStatus',
        ctaKey: 'farm.dashboard.reviewContractsCta',
        link: '/farm/contracts',
        tone: 'attention',
      });
    }

    const proposed = this.proposedReviewCount(data);
    if (proposed > 0) {
      items.push({
        id: 'proposed-matches',
        icon: 'handshake',
        titleKey: 'farm.dashboard.attentionProposed',
        titleParams: { count: proposed },
        statusKey: 'farm.dashboard.attentionWaiting',
        ctaKey: 'farm.dashboard.reviewMatchesCta',
        link: '/farm/matches',
        tone: 'attention',
      });
    }

    const expired = data.expiredCertifications ?? 0;
    const expiring = data.expiringCertifications ?? 0;
    if (expired > 0 || expiring > 0) {
      items.push({
        id: 'certs-expiry',
        icon: 'verified',
        titleKey: 'farm.dashboard.attentionCertExpiry',
        titleParams: { expired, expiring },
        statusKey: 'farm.dashboard.attentionImprove',
        ctaKey: 'farm.dashboard.completeProfileCta',
        link: '/farm/profile',
        tone: 'info',
      });
    }

    const profileTip = (data.improvementTips ?? []).find((t) =>
      /profile/i.test(t.category)
    );
    if (profileTip && profileTip.currentScore < 100 && items.length < 4) {
      items.push({
        id: 'profile-incomplete',
        icon: 'person',
        titleKey: 'farm.dashboard.attentionProfile',
        statusKey: 'farm.dashboard.attentionIncomplete',
        ctaKey: 'farm.dashboard.completeProfileCta',
        link: '/farm/profile',
        tone: 'info',
      });
    }

    return items.slice(0, 4);
  }

  private buildActivity(data: FarmDashboard | null): ActivityItem[] {
    if (!data) {
      return [];
    }
    return (data.recentMatches ?? []).slice(0, 5).map((m: RecentMatchItem) => {
      const status = (m.status || '').toLowerCase();
      const icon =
        status === 'accepted'
          ? 'check_circle'
          : status === 'rejected'
            ? 'cancel'
            : status === 'expired'
              ? 'schedule'
              : 'handshake';
      return {
        id: m.matchId,
        icon,
        title: `${m.factoryName} · ${m.cropName}`,
        meta: `${m.quantityTons} MT · ${this.i18n.instant(this.statusKey(m.status))}`,
        link: '/farm/matches',
        tone: this.statusTone(m.status),
      };
    });
  }

  private applyTrendChart(points: ReliabilityTrendPoint[]): void {
    if (!points.length) {
      this.chart?.destroy();
      this.chart = null;
      return;
    }

    const canvas = this.trendChartRef?.nativeElement;
    if (!canvas) {
      setTimeout(() => this.applyTrendChart(points), 40);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const labels = points.map((p) => p.label || '');
    const values = points.map((p) => Number(p.value) || 0);
    const primary = this.cssVar('--color-primary', '#1B5E20');
    const muted = this.cssVar('--color-on-surface-variant', '#5f6b64');
    const grid = this.cssVar('--color-outline-variant', '#e4e7e1');
    const surface = this.cssVar('--color-surface-container-lowest', '#fff');
    const onSurface = this.cssVar('--color-on-surface', '#1a1c19');
    const rtl =
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('dir') === 'rtl';

    const fill = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight || 160);
    fill.addColorStop(0, this.withAlpha(primary, 0.22));
    fill.addColorStop(1, this.withAlpha(primary, 0.02));

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: this.i18n.instant('farm.dashboard.reliabilityScore'),
            data: values,
            borderColor: primary,
            backgroundColor: fill,
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: values.map((_, i) =>
              i === values.length - 1 ? 4 : 0
            ),
            pointHoverRadius: 5,
            pointBackgroundColor: primary,
            pointBorderColor: surface,
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 420, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: surface,
            titleColor: onSurface,
            bodyColor: muted,
            borderColor: grid,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (item) =>
                ` ${Math.round(item.parsed.y ?? 0)}/100`,
            },
          },
        },
        scales: {
          x: {
            reverse: rtl,
            grid: { display: false },
            border: { display: false },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 6,
              color: muted,
              font: { family: 'Work Sans, IBM Plex Sans Arabic, sans-serif', size: 10 },
            },
          },
          y: {
            min: 0,
            max: 100,
            border: { display: false },
            grid: {
              color: this.withAlpha(grid, 0.7),
              lineWidth: 0.75,
            },
            ticks: {
              stepSize: 25,
              color: muted,
              font: { family: 'Work Sans, IBM Plex Sans Arabic, sans-serif', size: 10 },
            },
          },
        },
      },
    };

    try {
      this.chart?.destroy();
      this.chart = new Chart(ctx, config);
    } catch {
      /* chart paint failures should not break the page */
    }
  }

  private ensureChartJs(): void {
    if (this.chartRegistered) {
      return;
    }
    try {
      Chart.register(
        LineController,
        LineElement,
        PointElement,
        LinearScale,
        CategoryScale,
        Filler,
        Legend,
        Tooltip
      );
    } catch {
      /* already registered */
    }
    this.chartRegistered = true;
  }

  private cssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined') {
      return fallback;
    }
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return v || fallback;
  }

  private withAlpha(color: string, alpha: number): string {
    const c = color.trim();
    if (c.startsWith('#')) {
      const hex = c.slice(1);
      const full =
        hex.length === 3
          ? hex
              .split('')
              .map((ch) => ch + ch)
              .join('')
          : hex;
      if (full.length === 6) {
        const r = parseInt(full.slice(0, 2), 16);
        const g = parseInt(full.slice(2, 4), 16);
        const b = parseInt(full.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
    if (c.startsWith('rgb(')) {
      return c.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    return c;
  }
}
