import {
  Component,
  ElementRef,
  HostListener,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { MobileNavService } from '../../../core/services/mobile-nav.service';
import { PersonalizationService } from '../../../core/services/personalization.service';
import { filter } from 'rxjs';
import {
  captureFocus,
  restoreFocus,
  trapTabKey,
} from '../../a11y/focus-trap';
import { UiBrandMarkComponent } from '../../ui/brand-mark/brand-mark.component';

@Component({
  selector: 'app-sidebar-factory',
  standalone: true,
  imports: [RouterLink, TranslatePipe, NgTemplateOutlet, UiBrandMarkComponent],
  templateUrl: './sidebar-factory.component.html',
})
export class SidebarFactoryComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly mobileNav = inject(MobileNavService);
  readonly personalization = inject(PersonalizationService);

  readonly drawerPanel = viewChild<ElementRef<HTMLElement>>('drawerPanel');
  readonly drawerClose = viewChild<ElementRef<HTMLButtonElement>>('drawerClose');

  /** Supply-request loop — keep in demo order so the sidebar follows each stage. */
  readonly flowItems: Array<{
    key: string;
    icon: string;
    labelKey: string;
    link: string;
  }> = [
    {
      key: 'supplyRequest',
      icon: 'add_box',
      labelKey: 'nav.supplyRequest',
      link: '/factory/supply-request',
    },
    {
      key: 'agentProgress',
      icon: 'smart_toy',
      labelKey: 'nav.agentProgress',
      link: '/factory/agent-progress',
    },
    {
      key: 'matches',
      icon: 'handshake',
      labelKey: 'nav.matches',
      link: '/factory/matches',
    },
    {
      key: 'riskReport',
      icon: 'health_and_safety',
      labelKey: 'nav.riskReport',
      link: '/factory/risk-report',
    },
    {
      key: 'contracts',
      icon: 'description',
      labelKey: 'nav.contracts',
      link: '/factory/contracts',
    },
  ];

  readonly moreItems: Array<{
    key: string;
    icon: string;
    labelKey: string;
    link: string;
  }> = [
    {
      key: 'home',
      icon: 'home',
      labelKey: 'nav.home',
      link: '/factory/home',
    },
    {
      key: 'dashboard',
      icon: 'dashboard',
      labelKey: 'nav.dashboard',
      link: '/factory/dashboard',
    },
    {
      key: 'profile',
      icon: 'factory',
      labelKey: 'nav.profile',
      link: '/factory/profile',
    },
    {
      key: 'requests',
      icon: 'list_alt',
      labelKey: 'nav.requests',
      link: '/factory/requests',
    },
    {
      key: 'listings',
      icon: 'storefront',
      labelKey: 'nav.listings',
      link: '/factory/listings',
    },
    {
      key: 'negotiations',
      icon: 'edit_note',
      labelKey: 'nav.negotiations',
      link: '/factory/negotiations',
    },
    {
      key: 'disputes',
      icon: 'gavel',
      labelKey: 'nav.disputes',
      link: '/factory/disputes',
    },
    {
      key: 'wallet',
      icon: 'account_balance_wallet',
      labelKey: 'nav.wallet',
      link: '/factory/wallet',
    },
    {
      key: 'billing',
      icon: 'workspace_premium',
      labelKey: 'nav.billing',
      link: '/factory/billing',
    },
    {
      key: 'messages',
      icon: 'forum',
      labelKey: 'nav.messages',
      link: '/factory/messages',
    },
    {
      key: 'notifications',
      icon: 'notifications',
      labelKey: 'nav.notifications',
      link: '/factory/notifications',
    },
  ];

  private readonly routeAliases: Array<{ prefix: string; key: string }> = [
    { prefix: '/factory/contract-signing', key: 'contracts' },
    { prefix: '/factory/suppliers', key: 'matches' },
  ];

  readonly active = signal(this.resolveActive(this.router.url));

  private previousFocus: HTMLElement | null = null;
  private wasOpen = false;

  constructor() {
    effect(() => {
      const isOpen = this.mobileNav.open();
      if (isOpen && !this.wasOpen) {
        this.previousFocus = captureFocus();
        queueMicrotask(() => {
          this.drawerClose()?.nativeElement.focus();
        });
      } else if (!isOpen && this.wasOpen) {
        restoreFocus(this.previousFocus);
        this.previousFocus = null;
      }
      this.wasOpen = isOpen;
    });

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url =
          (e as NavigationEnd).urlAfterRedirects || (e as NavigationEnd).url;
        this.active.set(this.resolveActive(url));
        this.mobileNav.closeMenu();
        const match = this.findNavItem(this.active());
        if (match) {
          this.personalization.trackRecent({
            id: `factory-${match.key}`,
            label: match.labelKey,
            route: match.link,
            icon: match.icon,
          });
        }
        this.scrollActiveIntoView();
      });

    queueMicrotask(() => this.scrollActiveIntoView());
  }

  @HostListener('window:keydown.escape')
  closeOnEscape(): void {
    if (this.mobileNav.open()) {
      this.mobileNav.closeMenu();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.mobileNav.open()) {
      return;
    }
    const panelEl = this.drawerPanel()?.nativeElement;
    if (!panelEl) {
      return;
    }
    trapTabKey(event, panelEl);
  }

  toggleMenu(): void {
    this.mobileNav.toggleMenu();
  }

  private navItems() {
    return [...this.flowItems, ...this.moreItems];
  }

  private findNavItem(key: string) {
    return this.navItems().find((item) => item.key === key);
  }

  private pathOf(url: string): string {
    const bare = url.split('?')[0].split('#')[0];
    const outlet = bare.indexOf('(');
    const path = (outlet >= 0 ? bare.slice(0, outlet) : bare).replace(/\/+$/, '');
    return path || '/';
  }

  private pathMatches(path: string, prefix: string): boolean {
    return path === prefix || path.startsWith(`${prefix}/`);
  }

  private resolveActive(url: string): string {
    const path = this.pathOf(url);
    const alias = [...this.routeAliases]
      .sort((a, b) => b.prefix.length - a.prefix.length)
      .find((item) => this.pathMatches(path, item.prefix));
    if (alias) {
      return alias.key;
    }
    const match = this.navItems()
      .sort((a, b) => b.link.length - a.link.length)
      .find((item) => this.pathMatches(path, item.link));
    return match?.key ?? 'dashboard';
  }

  private scrollActiveIntoView(): void {
    const key = this.active();
    queueMicrotask(() => {
      document
        .querySelectorAll<HTMLElement>(
          `.app-sidebar__scroll [data-nav-key="${key}"]`
        )
        .forEach((el) => {
          const scroller = el.closest('.app-sidebar__scroll');
          if (!(scroller instanceof HTMLElement)) {
            return;
          }
          const elRect = el.getBoundingClientRect();
          const box = scroller.getBoundingClientRect();
          if (elRect.top < box.top) {
            scroller.scrollTop += elRect.top - box.top;
          } else if (elRect.bottom > box.bottom) {
            scroller.scrollTop += elRect.bottom - box.bottom;
          }
        });
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/landing']),
    });
  }
}
