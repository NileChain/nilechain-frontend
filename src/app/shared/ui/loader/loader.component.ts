import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'ui-loader',
  standalone: true,
  imports: [NgClass],
  template: `
    <div
      class="inline-flex items-center justify-center gap-2 text-primary"
      role="status"
      [attr.aria-label]="ariaLabel || 'Loading'"
    >
      <span
        class="material-symbols-outlined animate-spin"
        [ngClass]="sizeClass"
        aria-hidden="true"
        >progress_activity</span
      >
      @if (label) {
        <span class="font-label-md text-label-md text-on-surface-variant">{{ label }}</span>
      }
    </div>
  `,
})
export class UiLoaderComponent {
  @Input() label = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() ariaLabel = '';

  get sizeClass(): string {
    return { sm: 'text-[18px]', md: 'text-[28px]', lg: 'text-[40px]' }[this.size];
  }
}
