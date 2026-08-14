import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { FarmContract } from '../../core/models/farm/farm-contract.model';
import { FarmService } from '../../core/services/farm/farm.service';
import {
  FactoryContract,
  FactoryService,
} from '../../core/services/factory/factory.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslateService } from '../../core/services/translate.service';
import { AppTopBarComponent } from '../components/app-top-bar/app-top-bar.component';
import { UiLoaderComponent } from '../ui/loader/loader.component';
import { UiErrorStateComponent } from '../ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../ui/empty-state/empty-state.component';
import {
  contractStatusLabelKey,
  isPreSignContractStatus,
} from '../contracts/contract-text.util';

interface NegotiationRow {
  contractId: string;
  counterparty: string;
  cropName: string | null;
  quantityTons: number;
  status: string;
  createdAt: string;
  awaitingYou: boolean;
}

@Component({
  selector: 'app-party-negotiations-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    TranslatePipe,
    AppTopBarComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
  ],
  templateUrl: './party-negotiations-page.component.html',
})
export class PartyNegotiationsPageComponent implements OnInit {
  private readonly farmApi = inject(FarmService);
  private readonly factoryApi = inject(FactoryService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<NegotiationRow[]>([]);

  get portal(): 'farm' | 'factory' {
    const role = this.auth.currentUser()?.role ?? this.auth.roles()[0];
    return role === 'Factory' ? 'factory' : 'farm';
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const onSuccess = (rows: Array<FarmContract | FactoryContract> | null) =>
      this.items.set(this.mapRows(rows ?? []));
    const onError = () =>
      this.error.set(this.i18n.instant('negotiation.inboxLoadFailed'));

    if (this.portal === 'farm') {
      this.farmApi
        .getContracts()
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({ next: onSuccess, error: onError });
      return;
    }

    this.factoryApi
      .getContracts()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: onSuccess, error: onError });
  }

  contractLink(contractId: string): string {
    return this.portal === 'farm'
      ? `/farm/contracts/${contractId}`
      : `/factory/contracts/${contractId}`;
  }

  statusLabelKey(status: string): string {
    return contractStatusLabelKey(status);
  }

  private mapRows(rows: Array<FarmContract | FactoryContract>): NegotiationRow[] {
    const asFactory = this.portal === 'factory';
    return rows
      .filter((c) => isPreSignContractStatus(c.status) && !this.isFullySigned(c))
      .map((c) => {
        const factorySigned = !!c.factorySigned;
        const farmSigned = !!c.farmSigned;
        return {
          contractId: c.contractId,
          counterparty: asFactory
            ? c.farmName || '—'
            : c.factoryName || '—',
          cropName: c.cropName ?? null,
          quantityTons: c.quantityTons,
          status: c.status,
          createdAt: c.createdAt,
          awaitingYou: asFactory ? !factorySigned : !farmSigned,
        };
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  private isFullySigned(c: FarmContract | FactoryContract): boolean {
    if (c.factorySigned != null && c.farmSigned != null) {
      return !!c.factorySigned && !!c.farmSigned;
    }
    const s = (c.status || '').toLowerCase();
    return s === 'signed' || s === 'active' || s === 'completed';
  }
}
