import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { MobileNavService } from '../../../core/services/mobile-nav.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-sidebar-farm',
  standalone: true,
  imports: [RouterLink, TranslatePipe, NgTemplateOutlet],
  templateUrl: './sidebar-farm.component.html',
})
export class SidebarFarmComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly mobileNav = inject(MobileNavService);

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

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.active.set(this.resolveActive((e as NavigationEnd).url));
        this.mobileNav.closeMenu();
      });
  }

  @HostListener('window:keydown.escape')
  closeOnEscape(): void {
    this.mobileNav.closeMenu();
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
