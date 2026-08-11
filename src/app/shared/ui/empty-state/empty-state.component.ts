import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiIconComponent } from '../icon/icon.component';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [TranslatePipe, UiIconComponent],
  template: `
    <div
      class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-5 text-center animate-fade-in"
      [class.py-12]="!compact"
      [class.py-8]="compact"
      [class.min-h-[240px]]="compact"
      [class.max-h-[280px]]="compact"
      role="status"
    >
      <ui-icon [name]="icon" [size]="compact ? 'lg' : 'xl'" class="text-outline" />
      <p
        class="text-on-surface"
        [class.font-title-md]="!compact"
        [class.text-title-md]="!compact"
        [class.text-sm]="compact"
        [class.font-semibold]="compact"
      >
        {{ titleKey | translate }}
      </p>
      @if (bodyKey) {
        <p
          class="text-on-surface-variant max-w-sm"
          [class.font-body-md]="!compact"
          [class.text-body-md]="!compact"
          [class.text-xs]="compact"
        >
          {{ bodyKey | translate }}
        </p>
      }
      <ng-content />
    </div>
  `,
})
export class UiEmptyStateComponent {
  @Input() titleKey = 'common.empty';
  @Input() bodyKey = '';
  @Input() icon = 'inbox';
  /** Compact empty block for dense list pages (~240–280px). */
  @Input() compact = false;
}
