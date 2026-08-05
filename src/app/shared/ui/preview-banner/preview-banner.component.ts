import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiIconComponent } from '../icon/icon.component';

@Component({
  selector: 'ui-preview-banner',
  standalone: true,
  imports: [TranslatePipe, UiIconComponent],
  template: `
    <div
      class="flex items-start gap-3 rounded-lg border border-dashed border-primary/50 bg-primary-container/15 px-4 py-3 animate-fade-in"
      role="status"
    >
      <ui-icon name="construction" class="text-primary shrink-0" />
      <div class="min-w-0 space-y-0.5">
        <p class="font-label-lg text-label-lg text-primary">
          {{ titleKey | translate }}
        </p>
        @if (bodyKey) {
          <p class="font-body-sm text-body-sm text-on-surface-variant">
            {{ bodyKey | translate }}
          </p>
        }
      </div>
    </div>
  `,
})
export class UiPreviewBannerComponent {
  @Input() titleKey = 'common.previewTitle';
  @Input() bodyKey = 'common.previewBody';
}
