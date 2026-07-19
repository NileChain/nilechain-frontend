import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-sidebar-farm',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './sidebar-farm.component.html',
})
export class SidebarFarmComponent {
  /** Key of the currently active nav item (e.g. 'dashboard', 'profile'). */
  @Input() active = 'dashboard';

  readonly items = [
    { key: 'dashboard', icon: 'dashboard', labelKey: 'nav.dashboard', link: '/farm-dashboard' },
    { key: 'profile', icon: 'person', labelKey: 'nav.profile', link: null },
    { key: 'matches', icon: 'handshake', labelKey: 'nav.matches', link: null },
    { key: 'contracts', icon: 'description', labelKey: 'nav.contracts', link: null },
    { key: 'messages', icon: 'forum', labelKey: 'nav.messages', link: null },
    { key: 'notifications', icon: 'notifications', labelKey: 'nav.notifications', link: null },
  ] as const;
}
