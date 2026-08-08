import { Component, inject } from '@angular/core';
import { LocaleService } from '../../../core/services/locale.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'ui-language-toggle',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="ui-icon-btn inline-flex items-center justify-center gap-1 px-3 font-label-md text-label-md"
      [attr.aria-label]="'common.language' | translate"
      (click)="onToggle()"
    >
      <span class="material-symbols-outlined text-[20px]" aria-hidden="true"
        >language</span
      >
      <span>{{ locale.locale() === 'ar' ? 'EN' : 'ع' }}</span>
    </button>
  `,
})
export class UiLanguageToggleComponent {
  readonly locale = inject(LocaleService);

  onToggle(): void {
    void this.locale.toggle();
  }
}
