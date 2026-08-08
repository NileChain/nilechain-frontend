import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'ui-toast-host',
  standalone: true,
  imports: [NgClass, TranslatePipe],
  template: `
    <div
      class="fixed bottom-4 end-4 z-[100] flex flex-col gap-2 w-[min(100%-2rem,24rem)] pointer-events-none"
      aria-live="polite"
      aria-relevant="additions"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg bg-surface animate-fade-in transition duration-150"
          [class.opacity-0]="toast.exiting"
          [class.translate-y-2]="toast.exiting"
          [ngClass]="{
            'border-primary/40': toast.type === 'info',
            'border-tertiary/50': toast.type === 'success',
            'border-error/50': toast.type === 'error',
          }"
          role="status"
        >
          <span
            class="material-symbols-outlined shrink-0"
            [ngClass]="{
              'text-primary': toast.type === 'info',
              'text-tertiary': toast.type === 'success',
              'text-error': toast.type === 'error',
            }"
            aria-hidden="true"
          >
            {{
              toast.type === 'success'
                ? 'check_circle'
                : toast.type === 'error'
                  ? 'error'
                  : 'info'
            }}
          </span>
          <p class="flex-1 font-body-sm text-body-sm text-on-surface">
            {{ toast.message }}
          </p>
          <button
            type="button"
            class="p-1 rounded-full hover:bg-surface-container-low text-on-surface-variant shrink-0"
            (click)="toastService.dismiss(toast.id)"
            [attr.aria-label]="'common.close' | translate"
          >
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
              >close</span
            >
          </button>
        </div>
      }
    </div>
  `,
})
export class UiToastHostComponent {
  readonly toastService = inject(ToastService);
}
