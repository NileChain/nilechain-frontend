import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-sidebar-admin',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './sidebar-admin.component.html',
})
export class SidebarAdminComponent {
  /** Key of the currently active nav item. */
  @Input() active = 'dashboard';

  readonly items = [
    { key: 'dashboard', icon: 'monitoring', labelKey: 'nav.dashboard' },
    { key: 'users', icon: 'group', labelKey: 'nav.users' },
    { key: 'contracts', icon: 'description', labelKey: 'nav.contracts' },
    { key: 'knowledgeBase', icon: 'auto_stories', labelKey: 'nav.knowledgeBase' },
  ] as const;
}
