import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'ui-section-header',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
      <div>
        <h2 class="font-headline-sm text-headline-sm text-primary">
          {{ titleKey | translate }}
        </h2>
        @if (subtitleKey) {
          <p class="font-body-md text-body-md text-on-surface-variant mt-0.5">
            {{ subtitleKey | translate }}
          </p>
        }
      </div>
      <div class="flex items-center gap-2">
        <ng-content />
      </div>
    </div>
  `,
})
export class UiSectionHeaderComponent {
  @Input({ required: true }) titleKey!: string;
  @Input() subtitleKey = '';
}
