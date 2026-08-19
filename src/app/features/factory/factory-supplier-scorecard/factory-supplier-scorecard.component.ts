import { UiDatePipe } from '../../../core/pipes/ui-date.pipe';
import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { GovLabelPipe } from '../../../core/pipes/gov-label.pipe';
import { FactorySupplierScorecard } from '../../../core/models/factory/factory-dashboard.model';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { ReviewService } from '../../../core/services/review/review.service';
import { Review } from '../../../core/models/review/review.model';
import { TranslateService } from '../../../core/services/translate.service';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { UiRiskScoreBadgeComponent } from '../../../shared/ui/risk-score-badge/risk-score-badge.component';
import {
  contractStatusLabelKey,
} from '../../../shared/contracts/contract-text.util';
import { fulfillmentStatusLabelKey } from '../../../core/i18n/status-i18n.util';

@Component({
  selector: 'app-factory-supplier-scorecard',
  standalone: true,
  imports: [
    UiDatePipe, TranslatePipe,
    GovLabelPipe,
    AppTopBarComponent,
    UiEmptyStateComponent,
    UiErrorStateComponent,
    UiSkeletonComponent,
    UiRiskScoreBadgeComponent,
    RouterLink,
    DecimalPipe,
  ],
  templateUrl: './factory-supplier-scorecard.component.html',
  styleUrl: './factory-supplier-scorecard.component.scss',
})
export class FactorySupplierScorecardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly factoryService = inject(FactoryService);
  private readonly reviewsApi = inject(ReviewService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notFound = signal(false);
  readonly scorecard = signal<FactorySupplierScorecard | null>(null);
  readonly farmId = signal<string | null>(null);
  readonly activeMatchId = signal<string | null>(null);
  readonly canMessage = signal(false);
  readonly reviews = signal<Review[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('farmId');
      this.farmId.set(id);
      if (id) {
        this.load(id);
      } else {
        this.error.set(this.i18n.instant('factory.scorecard.missingFarmId'));
        this.loading.set(false);
      }
    });
  }

  load(farmId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    this.activeMatchId.set(null);
    this.canMessage.set(false);
    this.factoryService
      .getSupplierScorecard(farmId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.scorecard.set(data);
          this.resolveActiveMatch(farmId);
          this.loadReviews(data.farmUserId);
        },
        error: (err: HttpErrorResponse) => {
          this.scorecard.set(null);
          if (err?.status === 404) {
            this.notFound.set(true);
            return;
          }
          this.error.set(this.i18n.instant('factory.scorecard.loadFailed'));
        },
      });
  }

  private loadReviews(farmUserId: string | null | undefined): void {
    if (!farmUserId) {
      this.reviews.set([]);
      return;
    }
    this.reviewsApi.listForTarget(farmUserId).subscribe({
      next: (rows) => this.reviews.set(rows ?? []),
      error: () => this.reviews.set([]),
    });
  }

  private resolveActiveMatch(farmId: string): void {
    this.factoryService.getActiveMatchWithFarm(farmId).subscribe({
      next: (m) => {
        this.activeMatchId.set(m.matchId);
        this.canMessage.set(!!m.canMessage);
      },
      error: () => {
        this.activeMatchId.set(null);
        this.canMessage.set(false);
      },
    });
  }

  formatPercent(value: number | null | undefined): string {
    if (value == null) return '—';
    return `${Math.round(value * 100) / 100}%`;
  }

  riskTone(score: number | null | undefined): 'low' | 'medium' | 'high' {
    if (score == null) return 'medium';
    if (score >= 70) return 'low';
    if (score >= 40) return 'medium';
    return 'high';
  }

  contractStatusKey(status: string): string {
    return contractStatusLabelKey(status);
  }

  fulfillmentStatusKey(status: string): string {
    return fulfillmentStatusLabelKey(status);
  }
}
