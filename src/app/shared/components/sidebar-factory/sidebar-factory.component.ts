import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-sidebar-factory',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './sidebar-factory.component.html'
})
export class SidebarFactoryComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly items: Array<{ key: string; icon: string; labelKey: string; link: string }> = [
    { key: 'dashboard', icon: 'dashboard', labelKey: 'nav.dashboard', link: '/factory/dashboard' },
    { key: 'profile', icon: 'factory', labelKey: 'nav.profile', link: '/factory/profile' },
    { key: 'supplyRequest', icon: 'add_box', labelKey: 'nav.supplyRequest', link: '/factory/supply-request' },
    { key: 'matches', icon: 'handshake', labelKey: 'nav.matches', link: '/factory/matches' },
    { key: 'contracts', icon: 'description', labelKey: 'nav.contracts', link: '/factory/contract-signing' },
    { key: 'messages', icon: 'forum', labelKey: 'nav.messages', link: '/factory/messages' },
    { key: 'notifications', icon: 'notifications', labelKey: 'nav.notifications', link: '/factory/notifications' },
  ];

  readonly active = signal(this.resolveActive(this.router.url));

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => this.active.set(this.resolveActive((e as NavigationEnd).url)));
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
