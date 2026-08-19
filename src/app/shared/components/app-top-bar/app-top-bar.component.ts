import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { MobileNavService } from '../../../core/services/mobile-nav.service';
import { CommandPaletteService } from '../../../core/services/command-palette.service';
import { NotificationCenterService } from '../../../core/services/notification-center.service';
import { UiLanguageToggleComponent } from '../../ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../ui/theme-toggle/theme-toggle.component';
import { UiAvatarComponent } from '../../ui/avatar/avatar.component';

export type AppTopBarPortal = 'farm' | 'factory' | 'admin';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiAvatarComponent,
  ],
  templateUrl: './app-top-bar.component.html',
})
export class AppTopBarComponent {
  private readonly authService = inject(AuthService);
  private readonly commandPalette = inject(CommandPaletteService);
  readonly mobileNav = inject(MobileNavService);
  readonly notificationCenter = inject(NotificationCenterService);

  readonly currentUser = this.authService.currentUser;
  readonly scrolled = signal(false);

  /** Optional when useGreeting is true — greeting replaces the static title. */
  @Input() titleKey = '';
  @Input() subtitleKey = '';
  @Input() notificationsLink = '';
  @Input() showSearch = true;
  @Input() showUser = true;
  @Input() portal: AppTopBarPortal = 'farm';
  /** Time-based greeting + dynamic first name from AuthService. */
  @Input() useGreeting = false;

  @Output() searchClick = new EventEmitter<void>();

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrolled.set(window.scrollY > 4);
  }

  get roleLabelKey(): string {
    switch (this.portal) {
      case 'factory':
        return 'nav.enterprisePortal';
      case 'admin':
        return 'nav.adminRole';
      default:
        return 'nav.premiumFarmer';
    }
  }

  get userInitials(): string {
    const user = this.currentUser();
    const source = user?.displayName || user?.email || '?';
    const parts = source.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
    }
    return source.charAt(0).toUpperCase() || '?';
  }

  get accountAriaLabel(): string {
    const name =
      this.currentUser()?.displayName || this.currentUser()?.email || '';
    return name || 'Account';
  }

  /** Live unread from NotificationCenterService (API-backed); capped for badge UI. */
  get unreadBadgeLabel(): string {
    const n = this.notificationCenter.unreadCount();
    return n > 9 ? '9+' : String(n);
  }

  get greetingKey(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'farm.dashboard.greetingMorning';
    }
    if (hour < 17) {
      return 'farm.dashboard.greetingAfternoon';
    }
    return 'farm.dashboard.greetingEvening';
  }

  get greetingName(): string {
    const user = this.currentUser();
    const source = (user?.displayName || user?.email || '').trim();
    if (!source) {
      return '—';
    }
    if (source.includes('@')) {
      return source.split('@')[0] || source;
    }
    return source.split(/\s+/)[0] || source;
  }

  onSearch(): void {
    this.searchClick.emit();
    this.commandPalette.openPalette();
  }
}
