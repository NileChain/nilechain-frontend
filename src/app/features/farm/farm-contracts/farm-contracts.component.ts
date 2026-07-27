import { Component, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { AuthService } from '../../../core/services/auth.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { FarmContractItem } from '../../../core/models/farm/farm-contract-item.model';

@Component({
  selector: 'app-farm-contracts',
  standalone: true,
  imports: [TranslatePipe, UiLanguageToggleComponent, UiThemeToggleComponent, DatePipe, DecimalPipe],
  templateUrl: './farm-contracts.component.html',
})
export class FarmContractsComponent {
  private readonly authService = inject(AuthService);
  private readonly farmService = inject(FarmService);

  readonly currentUser = this.authService.currentUser;
  readonly contracts = signal<FarmContractItem[]>([]);
  readonly loading = signal(true);

  readonly firstLetter = (name: string): string => name?.charAt(0)?.toUpperCase() ?? '?';

  readonly statusBadgeClass = (status: string): string => {
    switch (status) {
      case 'Signed': return 'bg-primary-container text-on-primary-container border-primary';
      case 'PendingSignature': return 'bg-warning-container text-on-warning-container border-warning';
      case 'Draft': return 'bg-surface-container-high text-on-surface-variant border-outline-variant';
      case 'Cancelled': return 'bg-error-container text-on-error-container border-error-container';
      default: return 'bg-surface-container-high text-on-surface-variant border-outline-variant';
    }
  };

  readonly statusLabel = (status: string): string => {
    switch (status) {
      case 'Signed': return 'Signed';
      case 'PendingSignature': return 'Pending Signature';
      case 'Draft': return 'Draft';
      case 'Cancelled': return 'Cancelled';
      default: return status;
    }
  };

  constructor(title: Title) {
    title.setTitle('NileChain - Farm Contracts');
    this.loadContracts();
  }

  private loadContracts(): void {
    this.loading.set(true);
    this.farmService.getContracts().subscribe(data => {
      this.contracts.set(data);
      this.loading.set(false);
    });
  }
}
