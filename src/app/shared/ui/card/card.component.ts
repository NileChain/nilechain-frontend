import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  template: `
    <section
      [attr.aria-label]="ariaLabel || null"
      class="ui-card p-md md:p-lg transition-colors"
      [class.hover:border-primary]="hoverable"
      [class.cursor-default]="hoverable"
    >
      <ng-content />
    </section>
  `,
})
export class UiCardComponent {
  @Input() hoverable = false;
  @Input() ariaLabel = '';
}
