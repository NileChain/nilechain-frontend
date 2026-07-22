import { Component } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-farm-matches',
  standalone: true,
  imports: [TranslatePipe, UiLanguageToggleComponent, UiThemeToggleComponent],
  templateUrl: './farm-matches.component.html',
})
export class FarmMatchesComponent {
  readonly matches = [
    {
      factory: 'Golden Nile Mills',
      location: 'Industrial Zone, Cairo',
      matchScore: 94,
      riskScore: 87,
      riskTone: 'safe' as const,
      crop: 'Premium Wheat',
      cropIcon: 'grass',
      quantity: '500 ton',
      price: '14,000 EGP / ton',
      deliveryDate: '15 Nov 2026',
    },
    {
      factory: 'Delta Textiles',
      location: 'Free Zone, Alexandria',
      matchScore: 88,
      riskScore: 65,
      riskTone: 'risk' as const,
      crop: 'Long Staple Cotton',
      cropIcon: 'eco',
      quantity: '150 ton',
      price: '12,500 EGP / ton',
      deliveryDate: '01 Dec 2026',
    },
  ] as const;
}
