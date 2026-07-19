import { Component } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SidebarFactoryComponent } from '../../../shared/components/sidebar-factory/sidebar-factory.component';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-supply-request',
  standalone: true,
  imports: [TranslatePipe, SidebarFactoryComponent, UiLanguageToggleComponent, UiThemeToggleComponent],
  templateUrl: './supply-request.component.html',
})
export class SupplyRequestComponent {
  readonly crops = [
    { value: 'wheat', labelKey: 'factory.supplyRequest.cropWheat' },
    { value: 'corn', labelKey: 'factory.supplyRequest.cropCorn' },
    { value: 'rice', labelKey: 'factory.supplyRequest.cropRice' },
    { value: 'cotton', labelKey: 'factory.supplyRequest.cropCotton' },
  ] as const;

  readonly governorates = [
    { value: 'cairo', labelKey: 'factory.supplyRequest.govCairo' },
    { value: 'giza', labelKey: 'factory.supplyRequest.govGiza' },
    { value: 'alex', labelKey: 'factory.supplyRequest.govAlexandria' },
    { value: 'beheira', labelKey: 'factory.supplyRequest.govBeheira' },
    { value: 'minya', labelKey: 'factory.supplyRequest.govMinya' },
  ] as const;
}
