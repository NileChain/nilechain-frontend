import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-stat-card',
  standalone: true,
  template: `
    <article
      class="glass-card rounded-lg p-md flex flex-col justify-between h-full transition-colors hover:border-primary"
    >
      <div class="flex justify-between items-start gap-3">
        <div class="min-w-0">
          <p
            class="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider"
          >
            {{ label }}
          </p>
          <h3
            class="font-headline-md text-headline-md text-primary mt-1 truncate"
          >
            {{ value }}
          </h3>
        </div>
        <div
          class="w-10 h-10 shrink-0 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm"
        >
          <span class="material-symbols-outlined" aria-hidden="true">{{
            icon
          }}</span>
        </div>
      </div>
      @if (hint) {
        <p class="mt-4 text-label-sm text-on-surface-variant">{{ hint }}</p>
      }
      <ng-content />
    </article>
  `,
})
export class UiStatCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string;
  @Input() icon = 'analytics';
  @Input() hint = '';
}
