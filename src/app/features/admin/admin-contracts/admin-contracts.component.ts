import { Component } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-admin-contracts',
  standalone: true,
  imports: [TranslatePipe, UiLanguageToggleComponent, UiThemeToggleComponent],
  templateUrl: './admin-contracts.component.html',
})
export class AdminContractsComponent {
  readonly contracts = [
    {
      id: 'CTR-2026-084',
      farm: 'Eastern Nile Farms',
      factory: 'Modern Food Factories',
      crop: 'Processing Tomato (200 ton)',
      value: '2,400,000',
      risk: 'low',
      riskScore: '8%',
      status: 'signed',
    },
    {
      id: 'CTR-2026-085',
      farm: 'Delta Cooperative',
      factory: 'National Export Co.',
      crop: 'Long Staple Cotton (50 ton)',
      value: '4,500,000',
      risk: 'medium',
      riskScore: '35%',
      status: 'review',
    },
    {
      id: 'CTR-2026-086',
      farm: 'Amal Farm',
      factory: 'Greater Cairo Mills',
      crop: 'Wheat (500 ton)',
      value: '6,000,000',
      risk: 'high',
      riskScore: '82%',
      status: 'rejected',
    },
  ] as const;
}
