import { Component } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [TranslatePipe, UiLanguageToggleComponent, UiThemeToggleComponent],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent {
  readonly users = [
    {
      id: 'FRM-1029',
      name: 'Al-Wadi Farms',
      initial: 'A',
      email: 'contact@alwadi-farms.com',
      role: 'farm',
      status: 'verified',
    },
    {
      id: 'FCT-4421',
      name: 'Nile Golden Factories',
      initial: 'N',
      email: 'info@nilegolden.com',
      role: 'factory',
      status: 'pending',
    },
    {
      id: 'ADM-001',
      name: 'Sara Ahmed',
      initial: 'S',
      email: 'sarah.a@nilechain.com',
      role: 'admin',
      status: 'verified',
    },
  ] as const;
}
