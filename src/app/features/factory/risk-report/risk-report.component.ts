import { Component } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-risk-report',
  standalone: true,
  imports: [TranslatePipe, UiLanguageToggleComponent, UiThemeToggleComponent],
  templateUrl: './risk-report.component.html',
})
export class RiskReportComponent {
  readonly factors = [
    { key: 'factory.riskReport.factorProfile', value: 95, barClass: 'bg-primary-container' },
    { key: 'factory.riskReport.factorCerts', value: 80, barClass: 'bg-secondary-container' },
    { key: 'factory.riskReport.factorDelivery', value: 90, barClass: 'bg-primary-container' },
    { key: 'factory.riskReport.factorRatings', value: 75, barClass: 'bg-success-green' },
  ] as const;

  readonly sources = [
    { icon: 'description', key: 'factory.riskReport.source1' },
    { icon: 'verified', key: 'factory.riskReport.source2' },
    { icon: 'bar_chart', key: 'factory.riskReport.source3' },
  ] as const;
}
