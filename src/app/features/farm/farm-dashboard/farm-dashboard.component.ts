import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { SidebarFarmComponent } from '../../../shared/components/sidebar-farm/sidebar-farm.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-farm-dashboard',
  imports: [TranslatePipe, UiLanguageToggleComponent, UiThemeToggleComponent, SidebarFarmComponent],
  templateUrl: './farm-dashboard.component.html',
  styleUrl: './farm-dashboard.component.scss',
})
export class FarmDashboardComponent {
  private readonly authService = inject(AuthService);
  readonly currentUser = this.authService.currentUser;

  constructor(title: Title) {
    title.setTitle('NileChain - Farm Dashboard');
  }
}
