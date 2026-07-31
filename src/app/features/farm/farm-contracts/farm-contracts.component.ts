import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { AuthService } from '../../../core/services/auth.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { FarmContract } from '../../../core/models/farm/farm-contract.model';

@Component({
  selector: 'app-farm-contracts',
  standalone: true,
  imports: [
    TranslatePipe,
    SidebarFarmComponent,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiLoaderComponent,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './farm-contracts.component.html',
})
export class FarmContractsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly farmService = inject(FarmService);
  readonly currentUser = this.authService.currentUser;

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
    return status.toLowerCase() === 'signed' || status.toLowerCase() === 'active';
  }
}
