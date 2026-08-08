import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { FarmService } from '../../../core/services/farm/farm.service';
import { FarmMatchItem } from '../../../core/models/farm/farm-match.model';
import { CropType } from '../../../core/models/farm/farm-profile.model';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';

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
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './farm-matches.component.html',
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
  readonly cropTypes = signal<CropType[]>([]);
  readonly respondingId = signal<string | null>(null);
  readonly openingId = signal<string | null>(null);

  statusFilter = '';
  cropTypeFilter = '';

  ngOnInit(): void {
    this.farmService.getCropTypes().subscribe({
      next: (crops) => this.cropTypes.set(crops),
    });
    this.loadMatches();
  }

  loadMatches(): void {
    this.loading.set(true);
    this.error.set(null);
    this.farmService
      .getMatches(this.statusFilter || null, this.cropTypeFilter || null)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.matches.set(items),
        error: () => this.error.set('Failed to load matches.'),
      });
  }

  resetFilters(): void {
    this.statusFilter = '';
    this.cropTypeFilter = '';
    this.loadMatches();
  }

  riskTone(score: number | null): 'safe' | 'risk' {
    return score != null && score >= 70 ? 'safe' : 'risk';
  }

  viewContract(match: FarmMatchItem): void {
    this.openingId.set(match.matchId);
    this.error.set(null);

    const go = (contractId: string) => {
      void this.router.navigate(['/farm/contracts', contractId], {
        queryParams: {
          matchId: match.matchId,
          from: 'matches',
        },
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
    const ok = await this.confirm.confirm({
      titleKey: 'farm.matches.confirmRejectTitle',
      bodyKey: 'farm.matches.confirmRejectBody',
      confirmKey: 'farm.matches.declineOffer',
      cancelKey: 'common.cancel',
      danger: true,
    });
    if (!ok) {
      return;
    }

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
