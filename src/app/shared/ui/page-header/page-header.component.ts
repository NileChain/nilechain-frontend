import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'ui-page-header',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <header
      class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h1 class="font-headline-md text-headline-md text-primary font-bold">
          {{ titleKey | translate }}
        </h1>
        @if (subtitleKey) {
          <p class="font-body-md text-body-md text-on-surface-variant mt-1">
            {{ subtitleKey | translate }}
          </p>
        }
      </div>
      <div class="flex items-center gap-2">
        <ng-content />
      </div>
    </header>
  `,
})
export class UiPageHeaderComponent {
  @Input({ required: true }) titleKey!: string;
  @Input() subtitleKey = '';
}
