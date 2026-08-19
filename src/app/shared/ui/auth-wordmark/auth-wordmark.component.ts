import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiBrandMarkComponent } from '../brand-mark/brand-mark.component';

@Component({
  selector: 'ui-auth-wordmark',
  standalone: true,
  imports: [UiBrandMarkComponent, TranslatePipe],
  host: { class: 'auth-stage' },
  template: `
    <span class="auth-stage__mark">
      <ui-brand-mark [size]="markSize" [decorative]="true" />
    </span>
    <p class="auth-wordmark" [attr.aria-label]="'app.name' | translate">
      @for (ch of letters; track $index) {
        <span
          class="auth-wordmark__ch"
          [style.--i]="$index"
          aria-hidden="true"
          >{{ ch }}</span
        >
      }
    </p>
  `,
})
export class UiAuthWordmarkComponent {
  @Input() markSize = 80;
  readonly letters = [...'NileChain'];
}
