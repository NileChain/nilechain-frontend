import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'ui-chip',
  standalone: true,
  imports: [NgClass],
  template: `
    <span
      [ngClass]="toneClass"
      class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide"
    >
      <ng-content />
    </span>
  `,
})
export class UiChipComponent {
  @Input() tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' =
    'neutral';

  get toneClass(): string {
    switch (this.tone) {
      case 'success':
        return 'bg-secondary-container text-on-secondary-container';
      case 'warning':
        return 'bg-warning-orange/15 text-warning-orange';
      case 'danger':
        return 'bg-error-container text-on-error-container';
      case 'info':
        return 'bg-tertiary-container text-on-tertiary-container';
      default:
        return 'bg-surface-container-highest text-on-surface-variant';
    }
  }
}
