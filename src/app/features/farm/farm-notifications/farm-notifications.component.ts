import { Component } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-farm-notifications',
  standalone: true,
  imports: [TranslatePipe, UiLanguageToggleComponent, UiThemeToggleComponent],
  templateUrl: './farm-notifications.component.html',
})
export class FarmNotificationsComponent {
  readonly todayItems = [
    {
      id: 'n1',
      type: 'risk' as const,
      unread: true,
      titleKey: 'notifications.riskTitle',
      bodyKey: 'notifications.riskBody',
      timeKey: 'notifications.ago10m',
      actionKey: 'notifications.viewDetails',
      tagKey: 'notifications.climateRisk',
      tagIcon: 'thermostat',
    },
    {
      id: 'n2',
      type: 'match' as const,
      unread: true,
      titleKey: 'notifications.matchTitle',
      bodyKey: 'notifications.matchBody',
      timeKey: 'notifications.ago1h',
      actionKey: 'notifications.reviewMatch',
      tagKey: 'notifications.matchScore',
      tagIcon: 'auto_awesome',
    },
    {
      id: 'n3',
      type: 'contract' as const,
      unread: false,
      titleKey: 'notifications.contractReadyTitle',
      bodyKey: 'notifications.contractReadyBody',
      timeKey: 'notifications.ago2h',
      actionKey: 'notifications.viewContract',
      tagKey: '',
      tagIcon: '',
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
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDpsb3al6kO-Ue5vKDIWZlJgf2ZxsmanGj7eFPpLwaKfK1jEavI3gKXzzs5Fj2-CN5ntXrRSBCsCtfRcm6NBHxSD7LFCs3sRpMnq21FTGN5NNtjK9qAFcuSBAyN0NN5hLfNb026VNbnRE76iH3VbCKcpqG3gAbiwj8xtFCz-h5uiDPBafD0LtWqMOc3OKXzmQaa5bGZcEt2zXQMV7BCaMOxRR610H8sRw8jidQeu7WwnGI-miJiP7FQPuQcQ99Uphzskn4sfyLdFoA',
    },
  ] as const;
}
