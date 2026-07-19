import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiIconComponent } from '../icon/icon.component';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [TranslatePipe, UiIconComponent],
  template: `
    <div
      class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-6 py-12 text-center animate-fade-in"
      role="status"
    >
      <ui-icon [name]="icon" size="xl" class="text-outline" />
      <p class="font-title-md text-title-md text-on-surface">
        {{ titleKey | translate }}
      </p>
      @if (bodyKey) {
        <p class="font-body-md text-body-md text-on-surface-variant max-w-sm">
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
}
