import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'ui-icon',
  standalone: true,
  imports: [NgClass],
  template: `
    <span
      class="material-symbols-outlined"
      [class.icon-flip]="flipRtl"
      [class.fill]="fill"
      [ngClass]="sizeClass"
      [attr.aria-hidden]="ariaLabel ? null : true"
      [attr.aria-label]="ariaLabel || null"
      [attr.role]="ariaLabel ? 'img' : null"
    >
      {{ name }}
    </span>
  `,
})
export class UiIconComponent {
  @Input({ required: true }) name!: string;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() fill = false;
  @Input() flipRtl = false;
  @Input() ariaLabel = '';

  get sizeClass(): string {
    switch (this.size) {
      case 'sm':
        return 'text-[18px]';
      case 'lg':
        return 'text-[28px]';
      case 'xl':
        return 'text-[40px]';
      default:
        return 'text-[24px]';
    }
  }
}
