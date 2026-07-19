import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-avatar',
  standalone: true,
  template: `
    <div
      class="inline-flex items-center justify-center rounded-full bg-primary-container text-on-primary-container font-bold shrink-0 overflow-hidden"
      [style.width.px]="size"
      [style.height.px]="size"
      [attr.aria-label]="alt || null"
      role="img"
    >
      @if (src) {
        <img [src]="src" [alt]="alt" class="w-full h-full object-cover" />
      } @else {
        <span [style.fontSize.px]="size * 0.35">{{ initials }}</span>
      }
    </div>
  `,
})
export class UiAvatarComponent {
  @Input() src = '';
  @Input() alt = '';
  @Input() initials = '?';
  @Input() size = 40;
}
