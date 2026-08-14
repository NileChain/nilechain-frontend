import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiPortalHeroComponent } from '../../../shared/ui/portal-hero/portal-hero.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import {
  RiskReportDto,
  RiskReportService,
} from '../../../core/services/agent/risk-report.service';
import {
  FactoryMatchedFarm,
  FactoryService,
} from '../../../core/services/factory/factory.service';

interface RiskFactorRow {
  key: string;
  value: number;
  max: number;
  barClass: string;
}

@Component({
  selector: 'app-risk-report',
  standalone: true,
  imports: [
    TranslatePipe,
    AppTopBarComponent,
    UiPortalHeroComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
    DecimalPipe,
    RouterLink,
  ],
  templateUrl: './risk-report.component.html',
  styleUrl: './risk-report.component.scss',
})
export class RiskReportComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly riskApi = inject(RiskReportService);
  private readonly factoryApi = inject(FactoryService);

  readonly farmName = signal('—');
  readonly farmId = signal<string | null>(null);
  readonly requestId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly picking = signal(false);
  readonly error = signal<string | null>(null);
  readonly report = signal<RiskReportDto | null>(null);
  readonly factors = signal<RiskFactorRow[]>([]);
  readonly candidates = signal<FactoryMatchedFarm[]>([]);
  readonly mode = signal<'picker' | 'report'>('picker');

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const name = params.get('farmName');
      const id = params.get('farmId');
      const requestId = params.get('requestId');
      if (name) {
        this.farmName.set(name);
      }
      this.farmId.set(id);
      this.requestId.set(requestId);

      if (id) {
        this.mode.set('report');
        this.loadReport(id);
      } else {
        this.mode.set('picker');
        this.report.set(null);
        this.error.set(null);
        this.loadCandidates();
      }
    });
  }

  loadCandidates(): void {
    this.picking.set(true);
    this.error.set(null);
    this.factoryApi.getMatchedFarms().subscribe({
      next: (farms) => {
        this.candidates.set(farms ?? []);
        this.picking.set(false);
      },
      error: () => {
        this.picking.set(false);
        this.error.set(this.i18n.instant('factory.riskReport.candidatesFailed'));
      },
    });
  }

  selectCandidate(farm: FactoryMatchedFarm): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        farmId: farm.farmId,
        farmName: farm.farmName,
        requestId: farm.requestId ?? undefined,
      },
      queryParamsHandling: 'merge',
    });
  }

  clearFarmSelection(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { farmId: null, farmName: null, requestId: null },
      queryParamsHandling: 'merge',
    });
  }

  loadReport(farmId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.riskApi.getRiskReport(farmId).subscribe({
      next: (r) => {
        this.report.set(r);
        if (r.farmName) {
          this.farmName.set(r.farmName);
        }
        // Values are raw points (profile max 25, certs 25, contracts 30, ratings 20).
        this.factors.set([
          {
            key: 'factory.riskReport.factorProfile',
            value: r.profileCompleteness,
            max: 25,
            barClass: 'bg-primary',
          },
          {
            key: 'factory.riskReport.factorCerts',
            value: r.certificationScore,
            max: 25,
            barClass: 'bg-secondary-container',
          },
          {
            key: 'factory.riskReport.factorDelivery',
            value: r.contractHistoryScore,
            max: 30,
            barClass: 'bg-primary',
          },
          {
            key: 'factory.riskReport.factorRatings',
            value: r.ratingScore,
            max: 20,
            barClass: 'bg-success-green',
          },
        ]);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const message =
          typeof err?.error === 'string'
            ? err.error
            : err?.error?.message ||
              this.i18n.instant('factory.riskReport.loadFailed');
        this.error.set(message);
      },
    });
  }

  overallScore(): number {
    return Math.round(Number(this.report()?.overallScore ?? 0));
  }

  /** Risk band for badge coloring — separate from provenance teal. */
  riskLevel(): 'low' | 'medium' | 'high' {
    const score = this.overallScore();
    if (score >= 70) return 'low';
    if (score >= 40) return 'medium';
    return 'high';
  }

  riskLevelKey(): string {
    return `factory.riskReport.${this.riskLevel()}Risk`;
  }

  /** CSS color for gauge arc — risk tokens, not provenance. */
  riskColor(): string {
    switch (this.riskLevel()) {
      case 'low':
        return 'var(--color-success)';
      case 'medium':
        return 'var(--color-warning)';
      default:
        return 'var(--color-danger)';
    }
  }

  factorPercent(factor: RiskFactorRow): number {
    if (factor.max <= 0) return 0;
    return Math.max(0, Math.min(100, (factor.value / factor.max) * 100));
  }

  selectFarm(): void {
    void this.router.navigate(['/factory/contract-signing'], {
      queryParams: {
        requestId: this.requestId(),
        farmId: this.farmId(),
        farmName: this.farmName(),
      },
    });
  }

  downloadReport(): void {
    const r = this.report();
    const body = [
      this.i18n.instant('factory.riskReport.title'),
      this.farmName(),
      '',
      `${this.i18n.instant('factory.riskReport.trustScore')}: ${this.overallScore()}`,
      `${this.i18n.instant('factory.riskReport.factorProfile')}: ${r?.profileCompleteness ?? 0}/25`,
      `${this.i18n.instant('factory.riskReport.factorCerts')}: ${r?.certificationScore ?? 0}/25`,
      `${this.i18n.instant('factory.riskReport.factorDelivery')}: ${r?.contractHistoryScore ?? 0}/30`,
      `${this.i18n.instant('factory.riskReport.factorRatings')}: ${r?.ratingScore ?? 0}/20`,
      '',
      r?.aiAnalysis || r?.recommendation || '',
    ].join('\n');

    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-report-${this.farmId() ?? 'farm'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success(this.i18n.instant('factory.riskReport.downloadSuccess'));
  }
}
