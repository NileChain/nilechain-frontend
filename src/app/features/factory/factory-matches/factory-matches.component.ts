import { Component } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SidebarFactoryComponent } from '../../../shared/components/sidebar-factory/sidebar-factory.component';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-factory-matches',
  standalone: true,
  imports: [TranslatePipe, SidebarFactoryComponent, UiLanguageToggleComponent, UiThemeToggleComponent],
  templateUrl: './factory-matches.component.html',
})
export class FactoryMatchesComponent {
  readonly farms = [
    {
      id: 'f1',
      name: 'Nile Valley Farm',
      location: 'Sharqia',
      crop: 'Premium Wheat',
      quantity: '500 ton',
      match: 98,
      risk: 12,
      riskLevel: 'low' as const,
      verified: true,
      featured: true,
    },
    {
      id: 'f2',
      name: 'Delta Agri Cooperative',
      location: 'Dakahlia',
      crop: 'Yellow Corn',
      quantity: '1,200 ton',
      match: 85,
      risk: 45,
      riskLevel: 'medium' as const,
      verified: false,
      featured: false,
    },
    {
      id: 'f3',
      name: 'Reclaimed Desert Farms',
      location: 'New Valley',
      crop: 'Durum Wheat',
      quantity: '320 ton',
      match: 62,
      risk: 78,
      riskLevel: 'high' as const,
      verified: false,
      featured: false,
    },
  ] as const;
}
