import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiStatCardComponent } from '../../../shared/ui/stat-card/stat-card.component';
import { UiPreviewBannerComponent } from '../../../shared/ui/preview-banner/preview-banner.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    TranslatePipe,
    RouterLink,
    AppTopBarComponent,
    UiStatCardComponent,
    UiPreviewBannerComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent {
  /** Illustrative sample only — not backed by an admin analytics API. */
  readonly monthlyBars = [
    { label: 'Jan', height: '72%' },
    { label: 'Feb', height: '66%' },
    { label: 'Mar', height: '89%' },
    { label: 'Apr', height: '90%' },
    { label: 'May', height: '62%' },
    { label: 'Jun', height: '61%' },
    { label: 'Jul', height: '100%' },
  ] as const;

  /** Illustrative sample only — not backed by an admin analytics API. */
  readonly crops = [
    {
      name: 'Hard Wheat',
      icon: 'grass',
      demand: '12,500',
      avgPrice: '8,200',
      risk: 'low',
      riskScore: 12,
    },
    {
      name: 'Long Staple Cotton',
      icon: 'eco',
      demand: '4,200',
      avgPrice: '15,000',
      risk: 'medium',
      riskScore: 45,
    },
    {
      name: 'Sugar Beet',
      icon: 'local_florist',
      demand: '8,900',
      avgPrice: '1,200',
      risk: 'high',
      riskScore: 82,
    },
  ] as const;
}
