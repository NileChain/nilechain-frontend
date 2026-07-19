import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export type UiButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type UiButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      [attr.type]="type"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel || null"
      [ngClass]="classes"
      class="inline-flex items-center justify-center gap-2 font-label-md text-label-md transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
    >
      <ng-content />
    </button>
  `,
})
export class UiButtonComponent {
  @Input() variant: UiButtonVariant = 'primary';
  @Input() size: UiButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() ariaLabel = '';
  @Input() block = false;

  get classes(): Record<string, boolean> {
    return {
      'w-full': this.block,
      'rounded-lg bg-primary-container text-on-primary-container hover:opacity-90 active:scale-[0.98]':
        this.variant === 'primary',
      'rounded-lg border-2 border-primary text-primary hover:bg-surface-container-low active:scale-[0.98]':
        this.variant === 'secondary',
      'rounded-lg text-primary hover:bg-surface-container-low':
        this.variant === 'ghost',
      'rounded-lg bg-error text-on-error hover:opacity-90 active:scale-[0.98]':
        this.variant === 'danger',
      'px-3 py-1.5 text-label-sm': this.size === 'sm',
      'px-6 py-3': this.size === 'md',
      'px-8 py-4': this.size === 'lg',
    };
  }
}
