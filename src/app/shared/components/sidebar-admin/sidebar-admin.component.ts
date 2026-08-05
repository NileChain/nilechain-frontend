import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { MobileNavService } from '../../../core/services/mobile-nav.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-sidebar-admin',
  standalone: true,
  imports: [RouterLink, TranslatePipe, NgTemplateOutlet],
  templateUrl: './sidebar-admin.component.html',
})
export class SidebarAdminComponent {
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
      icon: 'monitoring',
      labelKey: 'nav.dashboard',
      link: '/admin/dashboard',
    },
    {
      key: 'users',
      icon: 'group',
      labelKey: 'nav.users',
      link: '/admin/users',
    },
    {
      key: 'contracts',
      icon: 'description',
      labelKey: 'nav.contracts',
      link: '/admin/contracts',
    },
    {
      key: 'knowledgeBase',
      icon: 'auto_stories',
      labelKey: 'nav.knowledgeBase',
      link: '/admin/knowledge-base',
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
