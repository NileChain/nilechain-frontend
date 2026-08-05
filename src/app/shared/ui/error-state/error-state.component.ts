import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'ui-error-state',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div
      class="flex flex-col items-center justify-center gap-3 rounded-lg border border-error/30 bg-error-container/10 px-6 py-12 text-center animate-fade-in"
      role="alert"
    >
      <span
        class="material-symbols-outlined text-[40px] text-error"
        aria-hidden="true"
        >error_outline</span
      >
      <p class="font-title-md text-title-md text-on-surface">
        {{ 'common.errorTitle' | translate }}
      </p>
      @if (message) {
        <p class="font-body-md text-body-md text-on-surface-variant max-w-sm">
          {{ message }}
        </p>
      } @else {
        <p class="font-body-md text-body-md text-on-surface-variant max-w-sm">
          {{ 'common.errorBody' | translate }}
        </p>
      }
      @if (showRetry) {
        <button
          type="button"
          class="ui-btn-primary mt-2"
          (click)="retry.emit()"
        >
          <span class="material-symbols-outlined" aria-hidden="true"
            >refresh</span
          >
          {{ 'common.retry' | translate }}
        </button>
      }
    </div>
  `,
})
export class UiErrorStateComponent {
  @Input() message: string | null | undefined = '';
  @Input() showRetry = true;
  @Output() retry = new EventEmitter<void>();
}
