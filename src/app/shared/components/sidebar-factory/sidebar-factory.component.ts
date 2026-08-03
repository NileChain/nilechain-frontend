import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar-factory',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './sidebar-factory.component.html'
})
export class SidebarFactoryComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /** Key of the currently active nav item. */
  @Input() active = 'dashboard';

  readonly items: Array<{ key: string; icon: string; labelKey: string; link: string }> = [
    { key: 'dashboard', icon: 'dashboard', labelKey: 'nav.dashboard', link: '/factory-dashboard' },
    { key: 'profile', icon: 'factory', labelKey: 'nav.profile', link: '/factory-profile' },
    { key: 'supplyRequest', icon: 'add_box', labelKey: 'nav.supplyRequest', link: '/supply-request' },
    { key: 'matches', icon: 'handshake', labelKey: 'nav.matches', link: '/factory-matches' },
    { key: 'contracts', icon: 'description', labelKey: 'nav.contracts', link: '/contract-signing' },
    { key: 'messages', icon: 'forum', labelKey: 'nav.messages', link: '/factory-messages' },
    { key: 'notifications', icon: 'notifications', labelKey: 'nav.notifications', link: '/factory-notifications' },
  ];

  logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/landing']),
    });
  }
}
