import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-farm-contracts',
  standalone: true,
  imports: [TranslatePipe, UiLanguageToggleComponent, UiThemeToggleComponent],
  templateUrl: './farm-contracts.component.html',
})
export class FarmContractsComponent {
  private readonly authService = inject(AuthService);
  readonly currentUser = this.authService.currentUser;
  readonly contracts = [
    {
      id: 'NCH-2026-084',
      factory: 'Al-Wadi Food Industries',
      crop: 'Hard Wheat',
      amount: '250,000',
      date: '12 May 2026',
      status: 'review' as const,
    },
    {
      id: 'NCH-2026-038',
      factory: 'Nile Sugar Company',
      crop: 'Sugar Beet',
      amount: '820,000',
      date: '05 May 2026',
      status: 'active' as const,
    },
    {
      id: 'NCH-2026-041',
      factory: 'Al-Wadi Food Industries',
      crop: 'Hard Wheat',
      amount: '250,000',
      date: '12 May 2026',
      status: 'review' as const,
    },
  ] as const;

  readonly pages = [1, 2] as const;
}
