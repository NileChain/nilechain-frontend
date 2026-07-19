import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-sidebar-factory',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './sidebar-factory.component.html',
})
export class SidebarFactoryComponent {
  /** Key of the currently active nav item. */
  @Input() active = 'dashboard';

  readonly items = [
    { key: 'dashboard', icon: 'dashboard', labelKey: 'nav.dashboard', link: '/factory-dashboard' },
    { key: 'profile', icon: 'factory', labelKey: 'nav.profile', link: null },
    { key: 'supplyRequest', icon: 'add_box', labelKey: 'nav.supplyRequest', link: null },
    { key: 'matches', icon: 'handshake', labelKey: 'nav.matches', link: null },
    { key: 'contracts', icon: 'description', labelKey: 'nav.contracts', link: null },
    { key: 'messages', icon: 'forum', labelKey: 'nav.messages', link: null },
    { key: 'notifications', icon: 'notifications', labelKey: 'nav.notifications', link: null },
  ] as const;
}
