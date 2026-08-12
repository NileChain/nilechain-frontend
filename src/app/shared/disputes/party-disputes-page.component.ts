import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { Dispute, DisputeList } from '../../core/models/dispute/dispute.model';
import { FarmService } from '../../core/services/farm/farm.service';
import { FactoryService } from '../../core/services/factory/factory.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslateService } from '../../core/services/translate.service';
import { AppTopBarComponent } from '../components/app-top-bar/app-top-bar.component';
import { UiLoaderComponent } from '../ui/loader/loader.component';
import { UiErrorStateComponent } from '../ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../ui/empty-state/empty-state.component';

@Component({
  selector: 'app-party-disputes-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    AppTopBarComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
  ],
  templateUrl: './party-disputes-page.component.html',
})
export class PartyDisputesPageComponent implements OnInit {
  private readonly farmApi = inject(FarmService);
  private readonly factoryApi = inject(FactoryService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly disputes = signal<Dispute[]>([]);

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
    const req =
      this.portal === 'farm'
        ? this.farmApi.listMyDisputes()
        : this.factoryApi.listMyDisputes();
    req.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res: DisputeList) => this.disputes.set(res.items ?? []),
      error: () => this.error.set(this.i18n.instant('dispute.inboxLoadFailed')),
    });
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
}
