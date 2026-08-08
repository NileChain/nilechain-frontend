import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

/**
 * NileChain mark — transparent assets, theme swap:
 * light: primary-dark frame + green accents (readable on light UI)
 * dark: white frame + green accents
 * Assets: /brand/nilechain-mark-light.png | nilechain-mark-dark.png
 */
@Component({
  selector: 'ui-brand-mark',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <span
      class="ui-brand-mark"
      [style.width.px]="size"
      [style.height.px]="size"
    >
      <img
        src="/brand/nilechain-mark-light.png"
        class="ui-brand-mark__img ui-brand-mark__img--light"
        [attr.alt]="decorative ? null : ('app.name' | translate)"
        [attr.aria-hidden]="decorative ? true : null"
        [attr.width]="size"
        [attr.height]="size"
      />
      <img
        src="/brand/nilechain-mark-dark.png"
        class="ui-brand-mark__img ui-brand-mark__img--dark"
        alt=""
        aria-hidden="true"
        [attr.width]="size"
        [attr.height]="size"
      />
    </span>
  `,
})
export class UiBrandMarkComponent {
  /** Rendered CSS pixel size (width = height; object-fit contain). */
  @Input() size = 36;

  /** When true, both images are decorative (parent supplies accessible name). */
  @Input() decorative = false;
}
