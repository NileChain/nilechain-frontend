import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { FarmService } from '../../../core/services/farm/farm.service';
import { FarmContract } from '../../../core/models/farm/farm-contract.model';
import { contractStatusLabelKey } from '../../../shared/contracts/contract-text.util';
import { TranslateService } from '../../../core/services/translate.service';

@Component({
  selector: 'app-farm-contracts',
  standalone: true,
  imports: [
    TranslatePipe,
    RouterLink,
    AppTopBarComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './farm-contracts.component.html',
})
export class FarmContractsComponent implements OnInit {
  private readonly farmService = inject(FarmService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly contracts = signal<FarmContract[]>([]);

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.farmService
      .getContracts()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.contracts.set(items),
        error: () =>
          this.error.set(this.i18n.instant('farm.contracts.loadFailed')),
      });
  }

  openContract(contract: FarmContract): void {
    void this.router.navigate(['/farm/contracts', contract.contractId]);
  }

  contractValue(contract: FarmContract): number | null {
    if (contract.pricePerTon == null) {
      return null;
    }
    return Number(contract.quantityTons) * Number(contract.pricePerTon);
  }

  isActive(status: string): boolean {
    return (
      status.toLowerCase() === 'signed' || status.toLowerCase() === 'active'
    );
  }

  isPending(status: string): boolean {
    const s = status.toLowerCase();
    return (
      s === 'pendingsignature' ||
      s === 'pendingfarmsignature' ||
      s === 'pendingfactorysignature' ||
      s === 'draft'
    );
  }

  statusLabelKey(status: string): string {
    return contractStatusLabelKey(status);
  }
}
