import { Component } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-agent-progress',
  standalone: true,
  imports: [TranslatePipe, UiLanguageToggleComponent, UiThemeToggleComponent],
  templateUrl: './agent-progress.component.html',
})
export class AgentProgressComponent {
  readonly summary = [
    { labelKey: 'factory.progress.cropLabel', value: 'Durum Wheat' },
    { labelKey: 'factory.progress.quantityLabel', value: '500 ton' },
    { labelKey: 'factory.progress.priceLabel', value: '12,000 EGP / ton' },
    { labelKey: 'factory.progress.deliveryLabel', value: '15 Aug 2026' },
  ] as const;

  readonly steps = [
    {
      id: 's1',
      titleKey: 'factory.progress.step1',
      descKey: 'factory.progress.step1Desc',
      status: 'done' as const,
    },
    {
      id: 's2',
      titleKey: 'factory.progress.step2',
      descKey: 'factory.progress.step2Desc',
      status: 'done' as const,
    },
    {
      id: 's3',
      titleKey: 'factory.progress.step3',
      descKey: 'factory.progress.step3Desc',
      status: 'done' as const,
    },
    {
      id: 's4',
      titleKey: 'factory.progress.step4',
      descKey: 'factory.progress.step4Desc',
      status: 'active' as const,
    },
    {
      id: 's5',
      titleKey: 'factory.progress.step5',
      descKey: 'factory.progress.step5Desc',
      status: 'pending' as const,
    },
    {
      id: 's6',
      titleKey: 'factory.progress.step6',
      descKey: null,
      status: 'pending' as const,
    },
  ] as const;
}
