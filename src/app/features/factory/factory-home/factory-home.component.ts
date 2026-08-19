import { Component, OnInit, computed, inject } from '@angular/core';
import { PageTitleService } from '../../../core/services/page-title.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateService } from '../../../core/services/translate.service';
import {
  PortalLandingLink,
  UiPortalHomeComponent,
} from '../../../shared/ui/portal-home/portal-home.component';

@Component({
  selector: 'app-factory-home',
  standalone: true,
  imports: [UiPortalHomeComponent],
  templateUrl: './factory-home.component.html',
})
export class FactoryHomeComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslateService);
  private readonly pageTitle = inject(PageTitleService);

  readonly displayName = computed(
    () =>
      this.auth.currentUser()?.displayName?.trim() ||
      this.i18n.instant('shell.userName')
  );

  readonly primaryCtas: PortalLandingLink[] = [
    {
      labelKey: 'factory.home.ctaSupply',
      link: '/factory/supply-request',
      icon: 'add_box',
    },
    {
      labelKey: 'factory.home.ctaMatches',
      link: '/factory/matches',
      icon: 'handshake',
    },
  ];

  readonly pathCards: PortalLandingLink[] = [
    {
      labelKey: 'nav.supplyRequest',
      link: '/factory/supply-request',
      icon: 'add_box',
      bodyKey: 'factory.home.pathSupplyBody',
      imageUrl:
        'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=80',
    },
    {
      labelKey: 'nav.matches',
      link: '/factory/matches',
      icon: 'handshake',
      bodyKey: 'factory.home.pathMatchesBody',
      imageUrl:
        'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=900&q=80',
    },
    {
      labelKey: 'nav.contracts',
      link: '/factory/contracts',
      icon: 'description',
      bodyKey: 'factory.home.pathContractsBody',
      imageUrl:
        'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
    },
    {
      labelKey: 'nav.dashboard',
      link: '/factory/dashboard',
      icon: 'dashboard',
      bodyKey: 'factory.home.pathDashBody',
      imageUrl:
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80',
    },
  ];

  ngOnInit(): void {
    this.pageTitle.setKey('app.page.factoryHome');
  }
}
