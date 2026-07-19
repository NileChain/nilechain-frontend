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
      class="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full px-3 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
