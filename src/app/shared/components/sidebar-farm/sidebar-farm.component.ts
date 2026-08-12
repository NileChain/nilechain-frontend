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
import { NotificationCenterService } from '../../../core/services/notification-center.service';
import { PersonalizationService } from '../../../core/services/personalization.service';
import { filter } from 'rxjs';
import {
  captureFocus,
  restoreFocus,
  trapTabKey,
} from '../../a11y/focus-trap';
import { UiBrandMarkComponent } from '../../ui/brand-mark/brand-mark.component';

@Component({
  selector: 'app-sidebar-farm',
  standalone: true,
  imports: [RouterLink, TranslatePipe, NgTemplateOutlet, UiBrandMarkComponent],
  templateUrl: './sidebar-farm.component.html',
})
export class SidebarFarmComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly mobileNav = inject(MobileNavService);
  readonly personalization = inject(PersonalizationService);
  readonly notificationCenter = inject(NotificationCenterService);

  readonly drawerPanel = viewChild<ElementRef<HTMLElement>>('drawerPanel');
  readonly drawerClose = viewChild<ElementRef<HTMLButtonElement>>('drawerClose');

  readonly items: Array<{
    key: string;
    icon: string;
    labelKey: string;
    link: string;
  }> = [
    {
      key: 'dashboard',
      icon: 'dashboard',
      labelKey: 'nav.dashboard',
      link: '/farm/dashboard',
    },
    {
      key: 'profile',
      icon: 'person',
      labelKey: 'nav.profile',
      link: '/farm/profile',
    },
    {
      key: 'matches',
      icon: 'handshake',
      labelKey: 'nav.matches',
      link: '/farm/matches',
    },
    {
      key: 'contracts',
      icon: 'description',
      labelKey: 'nav.contracts',
      link: '/farm/contracts',
    },
    {
      key: 'disputes',
      icon: 'gavel',
      labelKey: 'nav.disputes',
      link: '/farm/disputes',
    },
    {
      key: 'wallet',
      icon: 'account_balance_wallet',
      labelKey: 'nav.wallet',
      link: '/farm/wallet',
    },
    {
      key: 'messages',
      icon: 'forum',
      labelKey: 'nav.messages',
      link: '/farm/messages',
    },
    {
      key: 'notifications',
      icon: 'notifications',
      labelKey: 'nav.notifications',
      link: '/farm/notifications',
    },
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
        const match = this.items.find((item) => url.startsWith(item.link));
        if (match) {
          this.personalization.trackRecent({
            id: `farm-${match.key}`,
            label: match.labelKey,
            route: match.link,
            icon: match.icon,
          });
        }
      });
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

  private resolveActive(url: string): string {
    const match = this.items.find((item) => url.startsWith(item.link));
    return match?.key ?? 'dashboard';
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/landing']),
    });
  }
}
