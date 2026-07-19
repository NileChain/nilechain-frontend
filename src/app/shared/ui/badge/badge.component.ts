import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'ui-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span
      [ngClass]="toneClass"
      class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-label-sm text-label-sm"
    >
      <ng-content />
    </span>
  `,
})
export class UiBadgeComponent {
  @Input() tone: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' =
    'primary';

  get toneClass(): string {
    switch (this.tone) {
      case 'success':
        return 'bg-secondary-container text-on-secondary-container';
      case 'warning':
        return 'bg-warning-orange/15 text-warning-orange';
      case 'danger':
        return 'bg-error-container text-on-error-container';
      case 'neutral':
        return 'bg-surface-container-high text-on-surface-variant';
      default:
        return 'bg-primary-container/15 text-primary';
    }
  }
}
