import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-progress-bar',
  standalone: true,
  template: `
    <div class="w-full">
      @if (label) {
        <div class="flex justify-between items-center mb-2 gap-2">
          <span class="font-label-md text-on-surface">{{ label }}</span>
          @if (showValue) {
            <span class="font-bold text-success-green">{{ value }}%</span>
          }
        </div>
      }
      <div
        class="w-full h-2 bg-surface-container-high rounded-full overflow-hidden"
        role="progressbar"
        [attr.aria-valuenow]="value"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-label]="label || null"
      >
        <div
          class="bg-success-green h-full rounded-full transition-all duration-500"
          [style.width.%]="clamped"
        ></div>
      </div>
    </div>
  `,
})
export class UiProgressBarComponent {
  @Input() value = 0;
  @Input() label = '';
  @Input() showValue = true;

  get clamped(): number {
    return Math.max(0, Math.min(100, this.value));
  }
}
