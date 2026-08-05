import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AuthService } from '../../../core/services/auth.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { MobileNavService } from '../../../core/services/mobile-nav.service';
import { FarmContract } from '../../../core/models/farm/farm-contract.model';

@Component({
  selector: 'app-farm-contracts',
  standalone: true,
  imports: [
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './farm-contracts.component.html',
})
export class FarmContractsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly farmService = inject(FarmService);
  readonly currentUser = this.authService.currentUser;
  readonly mobileNav = inject(MobileNavService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly contracts = signal<FarmContract[]>([]);
  readonly selected = signal<FarmContract | null>(null);

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
        next: (items) => {
          this.contracts.set(items);
          if (items.length > 0 && !this.selected()) {
            this.selected.set(items[0]);
          }
        },
        error: () => this.error.set('Failed to load contracts.'),
      });
  }

  selectContract(contract: FarmContract): void {
    this.selected.set(contract);
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
}
