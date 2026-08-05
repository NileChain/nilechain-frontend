import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiPreviewBannerComponent } from '../../../shared/ui/preview-banner/preview-banner.component';
import { MobileNavService } from '../../../core/services/mobile-nav.service';

@Component({
  selector: 'app-supply-request',
  standalone: true,
  imports: [
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiPreviewBannerComponent,
  ],
  templateUrl: './supply-request.component.html',
})
export class SupplyRequestComponent {
  readonly mobileNav = inject(MobileNavService);
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
