import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  imports: [NgClass],
  template: `
    <div
      class="animate-pulse rounded-lg bg-surface-container-high"
      [ngClass]="shapeClass"
      [style.width]="width"
      [style.height]="height"
      aria-hidden="true"
    ></div>
  `,
})
export class UiSkeletonComponent {
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() rounded: 'sm' | 'md' | 'lg' | 'full' = 'md';

  get shapeClass(): string {
    return {
      sm: 'rounded-sm',
      md: 'rounded-lg',
      lg: 'rounded-xl',
      full: 'rounded-full',
    }[this.rounded];
  }
}
