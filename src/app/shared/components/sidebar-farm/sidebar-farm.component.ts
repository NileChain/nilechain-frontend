import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar-farm',
  standalone: true,
  imports: [],
  templateUrl: './sidebar-farm.component.html'
})
export class SidebarFarmComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /** Key of the currently active nav item (e.g. 'dashboard', 'profile'). */
  @Input() active = 'dashboard';

  readonly items: Array<{ key: string; icon: string; labelKey: string; link: string }> = [
    { key: 'dashboard', icon: 'dashboard', labelKey: 'nav.dashboard', link: '/farm-dashboard' },
    { key: 'profile', icon: 'person', labelKey: 'nav.profile', link: '/farm-profile' },
    { key: 'matches', icon: 'handshake', labelKey: 'nav.matches', link: '/farm-matches' },
    { key: 'contracts', icon: 'description', labelKey: 'nav.contracts', link: '/farm-contracts' },
    { key: 'messages', icon: 'forum', labelKey: 'nav.messages', link: '/farm-messages' },
    { key: 'notifications', icon: 'notifications', labelKey: 'nav.notifications', link: '/farm-notifications' },
  ];

  logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/landing']),
    });
  }
}
