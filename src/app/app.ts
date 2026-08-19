import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LocaleService } from './core/services/locale.service';
import { ThemeService } from './core/services/theme.service';
import { UiNotificationCenterComponent } from './shared/ui/notification-center/notification-center.component';
import { UiConfirmDialogComponent } from './shared/ui/confirm-dialog/confirm-dialog.component';
import { UiSigningOtpDialogComponent } from './shared/ui/signing-otp-dialog/signing-otp-dialog.component';
import { UiCommandPaletteComponent } from './shared/ui/command-palette/command-palette.component';
import { UiAiAssistantDrawerComponent } from './shared/ui/ai-assistant-drawer/ai-assistant-drawer.component';
import { UiToastHostComponent } from './shared/ui/toast-host/toast-host.component';
import { UiBillingPaywallComponent } from './shared/ui/billing-paywall/billing-paywall.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    UiNotificationCenterComponent,
    UiConfirmDialogComponent,
    UiSigningOtpDialogComponent,
    UiCommandPaletteComponent,
    UiAiAssistantDrawerComponent,
    UiToastHostComponent,
    UiBillingPaywallComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  /** Eagerly initialize locale (dir/lang) and theme (dark class). */
  private readonly locale = inject(LocaleService);
  private readonly theme = inject(ThemeService);
}
