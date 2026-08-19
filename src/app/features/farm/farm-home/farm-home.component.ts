import { Component, OnInit, computed, inject } from '@angular/core';
import { PageTitleService } from '../../../core/services/page-title.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateService } from '../../../core/services/translate.service';
import {
  PortalLandingLink,
  UiPortalHomeComponent,
} from '../../../shared/ui/portal-home/portal-home.component';

@Component({
  selector: 'app-farm-home',
  standalone: true,
  imports: [UiPortalHomeComponent],
  templateUrl: './farm-home.component.html',
})
export class FarmHomeComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslateService);
  private readonly pageTitle = inject(PageTitleService);

  readonly displayName = computed(
    () =>
      this.auth.currentUser()?.displayName?.trim() ||
      this.i18n.instant('shell.userName')
  );

  readonly primaryCtas: PortalLandingLink[] = [
    { labelKey: 'farm.home.ctaMatches', link: '/farm/matches', icon: 'handshake' },
    { labelKey: 'farm.home.ctaContracts', link: '/farm/contracts', icon: 'description' },
  ];

  readonly pathCards: PortalLandingLink[] = [
    {
      labelKey: 'nav.matches',
      link: '/farm/matches',
      icon: 'handshake',
      bodyKey: 'farm.home.pathMatchesBody',
      imageUrl:
        'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80',
    },
    {
      labelKey: 'nav.contracts',
      link: '/farm/contracts',
      icon: 'description',
      bodyKey: 'farm.home.pathContractsBody',
      imageUrl:
        'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
    },
    {
      labelKey: 'nav.wallet',
      link: '/farm/wallet',
      icon: 'account_balance_wallet',
      bodyKey: 'farm.home.pathWalletBody',
      imageUrl:
        'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=900&q=80',
    },
    {
      labelKey: 'nav.dashboard',
      link: '/farm/dashboard',
      icon: 'dashboard',
      bodyKey: 'farm.home.pathDashBody',
      imageUrl:
        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80',
    },
  ];

  ngOnInit(): void {
    this.pageTitle.setKey('app.page.farmHome');
  }
}
