import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'ui-theme-toggle',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="ui-icon-btn inline-flex"
      [attr.aria-label]="
        theme.isDark()
          ? ('common.themeLight' | translate)
          : ('common.themeDark' | translate)
      "
      (click)="theme.toggle()"
    >
      <span class="material-symbols-outlined" aria-hidden="true">
        {{ theme.isDark() ? 'light_mode' : 'dark_mode' }}
      </span>
    </button>
  `,
})
export class UiThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
