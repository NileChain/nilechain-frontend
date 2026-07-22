import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-sidebar-admin',
  standalone: true,
  imports: [],
  templateUrl: './sidebar-admin.component.html',
})
export class SidebarAdminComponent {
  @Input() active = 'dashboard';

  readonly items = [
    { key: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { key: 'profile', icon: 'person', label: 'Profile' },
    { key: 'matches', icon: 'handshake', label: 'Matches' },
    { key: 'contracts', icon: 'description', label: 'Contracts' },
    { key: 'messages', icon: 'forum', label: 'Messages' },
    { key: 'notifications', icon: 'notifications', label: 'Notifications' },
  ] as const;

  isActive(key: (typeof this.items)[number]['key']): boolean {
    if (this.active === key) {
      return true;
    }

    // Keep compatibility with existing admin pages that pass old keys.
    if (this.active === 'users' && key === 'profile') {
      return true;
    }

    if (this.active === 'knowledgeBase' && key === 'matches') {
      return true;
    }

    return false;
  }
}
