import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar-admin',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './sidebar-admin.component.html',
})
export class SidebarAdminComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /** Key of the currently active nav item. */
  @Input() active = 'dashboard';

  readonly items: Array<{ key: string; icon: string; labelKey: string; link: string }> = [
    { key: 'dashboard', icon: 'monitoring', labelKey: 'nav.dashboard', link: '/admin-dashboard' },
    { key: 'users', icon: 'group', labelKey: 'nav.users', link: '/admin-users' },
    { key: 'contracts', icon: 'description', labelKey: 'nav.contracts', link: '/admin-contracts' },
    { key: 'knowledgeBase', icon: 'auto_stories', labelKey: 'nav.knowledgeBase', link: '/knowledge-base' },
  ];

  isActive(key: string): boolean {
    return this.active === key;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/landing']),
    });
  }
}
