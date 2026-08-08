import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { finalize } from 'rxjs';
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
  ],
  templateUrl: './farm-dashboard.component.html',
  styleUrl: './farm-dashboard.component.scss',
})
export class FarmDashboardComponent implements OnInit {
  private readonly farmService = inject(FarmService);
  private readonly i18n = inject(TranslateService);

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

  constructor(title: Title) {
    title.setTitle('NileChain - Farm Dashboard');
  }

  ngOnInit(): void {
    this.loadDashboard();
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
          }),
        error: () => this.error.set('Failed to load dashboard.'),
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

  trendDelta(points: ReliabilityTrendPoint[]): number | null {
    if (!points || points.length < 2) {
      return null;
    }
    const first = Number(points[0]!.value);
    const last = Number(points[points.length - 1]!.value);
    return Math.round(last - first);
  }

  barHeight(value: number): number {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return 4;
    }
    return Math.max(4, Math.min(100, n));
  }

  private buildAttention(data: FarmDashboard | null): AttentionItem[] {
    if (!data) {
      return [];
    }
    const items: AttentionItem[] = [];
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

    const profileTip = (data.improvementTips ?? []).find((t) =>
      /profile/i.test(t.category)
    );
    if (profileTip && profileTip.currentScore < 100) {
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

    const certTip = (data.improvementTips ?? []).find((t) =>
      /certif/i.test(t.category)
    );
    if (certTip && certTip.currentScore < 50 && items.length < 3) {
      items.push({
        id: 'certs',
        icon: 'verified',
        titleKey: 'farm.dashboard.attentionCerts',
        statusKey: 'farm.dashboard.attentionImprove',
        ctaKey: 'farm.dashboard.improveScoreCta',
        link: '/farm/profile',
        tone: 'info',
      });
    }

    return items.slice(0, 3);
  }

  private buildActivity(data: FarmDashboard | null): ActivityItem[] {
    if (!data) {
      return [];
    }
    return (data.recentMatches ?? []).slice(0, 5).map((m: RecentMatchItem) => ({
      id: m.matchId,
      icon: 'handshake',
      title: `${m.factoryName} · ${m.cropName}`,
      meta: `${m.quantityTons} MT · ${m.status}`,
      link: '/farm/matches',
    }));
  }
}
