import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiPreviewBannerComponent } from '../../../shared/ui/preview-banner/preview-banner.component';
import { MobileNavService } from '../../../core/services/mobile-nav.service';

@Component({
  selector: 'app-factory-notifications',
  standalone: true,
  imports: [
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiPreviewBannerComponent,
  ],
  templateUrl: './factory-notifications.component.html',
})
export class FactoryNotificationsComponent {
  readonly mobileNav = inject(MobileNavService);
  readonly tabs = [
    {
      key: 'all',
      labelKey: 'notifications.all',
      active: true,
      icon: null as string | null,
    },
    {
      key: 'unread',
      labelKey: 'notifications.unread',
      active: false,
      icon: null as string | null,
    },
    {
      key: 'matches',
      labelKey: 'notifications.matches',
      active: false,
      icon: 'hub',
    },
    {
      key: 'risks',
      labelKey: 'notifications.risks',
      active: false,
      icon: 'warning',
    },
  ] as const;

  readonly todayItems = [
    {
      id: 'n1',
      type: 'risk' as const,
      unread: true,
      titleKey: 'notifications.riskTitle',
      bodyKey: 'notifications.riskBody',
      timeKey: 'notifications.ago10m',
      actionKey: 'notifications.viewDetails',
      chipKey: 'notifications.climateRisk',
      chipIcon: 'thermostat',
    },
    {
      id: 'n2',
      type: 'match' as const,
      unread: true,
      titleKey: 'notifications.matchTitle',
      bodyKey: 'notifications.matchBody',
      timeKey: 'notifications.ago1h',
      actionKey: 'notifications.reviewMatch',
      chipKey: 'notifications.matchScore',
      chipIcon: 'auto_awesome',
    },
    {
      id: 'n3',
      type: 'contract' as const,
      unread: false,
      titleKey: 'notifications.contractReadyTitle',
      bodyKey: 'notifications.contractReadyBody',
      timeKey: 'notifications.ago2h',
      actionKey: 'notifications.viewContract',
      chipKey: null as string | null,
      chipIcon: null as string | null,
    },
  ] as const;

  readonly yesterdayItems = [
    {
      id: 'n4',
      type: 'message' as const,
      unread: false,
      titleKey: 'notifications.messageTitle',
      bodyKey: 'notifications.messageBody',
      timeKey: 'notifications.yesterdayTime',
      actionKey: 'notifications.reply',
      chipKey: null as string | null,
      chipIcon: null as string | null,
    },
  ] as const;
}
