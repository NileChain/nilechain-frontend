import { Component } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SidebarFarmComponent } from '../../../shared/components/sidebar-farm/sidebar-farm.component';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-farm-messages',
  standalone: true,
  imports: [TranslatePipe, SidebarFarmComponent, UiLanguageToggleComponent, UiThemeToggleComponent],
  templateUrl: './farm-messages.component.html',
})
export class FarmMessagesComponent {
  readonly conversations = [
    {
      id: 'c1',
      name: 'Modern Valley Farms',
      previewKey: 'messages.preview1',
      timeKey: 'messages.now',
      active: true,
      online: true,
      avatarType: 'initial' as const,
      initial: 'M',
      imageUrl: '',
    },
    {
      id: 'c2',
      name: 'Nile Export Co.',
      previewKey: 'messages.preview2',
      timeKey: 'messages.timeMorning',
      active: false,
      online: false,
      avatarType: 'image' as const,
      initial: '',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAM5dU2rz0_IKwFiHkSl0ynP5A0BXQUehASz-Go580-eL7FXwwrIb62pwo7a9UXJTI5Q3IpVVFuibaQelPe4gCRZdq8M34RrER57stigAkyK8jiYHKQSGwmB-Nv56_SRnaQC9lbcAo_PRRER1w2g-9804klXd1HgorDjNfghX_rQ2mBEQ75FI3WxSLUSRsuWmznaShIJDOlUq7VIIeVyOF-CpGBykRhjt8tBEeBJxa6wwORJ1Y97LC4oUWx4MTzXoC616RypaDaEfw',
    },
    {
      id: 'c3',
      name: 'Delta Silos',
      previewKey: 'messages.preview3',
      timeKey: 'messages.yesterday',
      active: false,
      online: false,
      avatarType: 'initial' as const,
      initial: 'D',
      imageUrl: '',
    },
  ] as const;

  readonly chatMessages = [
    {
      id: 'm1',
      kind: 'incoming' as const,
      bodyKey: 'messages.msg1',
      time: '09:45 AM',
      hasAttachment: false,
    },
    {
      id: 'm2',
      kind: 'incoming' as const,
      bodyKey: 'messages.msg2',
      time: '09:47 AM',
      hasAttachment: true,
    },
    {
      id: 'm3',
      kind: 'outgoing' as const,
      bodyKey: 'messages.msg3',
      time: '09:55 AM',
      hasAttachment: false,
    },
  ] as const;
}
