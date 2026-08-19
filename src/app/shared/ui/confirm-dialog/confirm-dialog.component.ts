import {
  Component,
  ElementRef,
  HostListener,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import {
  captureFocus,
  restoreFocus,
  trapTabKey,
} from '../../a11y/focus-trap';

@Component({
  selector: 'ui-confirm-dialog',
  standalone: true,
  imports: [TranslatePipe, FormsModule],
  template: `
    @if (dialog.open() && dialog.options(); as opts) {
      <div
        class="fixed inset-0 z-[90] flex items-center justify-center p-4"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="bodyId"
      >
        <button
          type="button"
          class="absolute inset-0 bg-on-surface/40 animate-backdrop-in"
          (click)="cancel()"
          [attr.aria-label]="'common.close' | translate"
        ></button>

        <div
          #panel
          tabindex="-1"
          class="relative w-full max-w-md rounded-xl bg-surface border border-outline-variant shadow-xl p-6 space-y-4 animate-scale-in outline-none"
        >
          <h2
            [id]="titleId"
            class="font-title-lg text-title-lg text-on-surface font-bold"
          >
            {{ opts.titleKey | translate }}
          </h2>
          <p
            [id]="bodyId"
            class="font-body-md text-body-md text-on-surface-variant"
          >
            {{ opts.bodyKey | translate }}
          </p>

          @if (opts.promptKey) {
            <label class="block space-y-1" [attr.for]="promptId">
              <span class="font-label-md text-on-surface">{{
                opts.promptKey | translate
              }}</span>
              <textarea
                #promptInput
                class="ui-input min-h-[5rem] w-full"
                [id]="promptId"
                name="confirmPrompt"
                rows="4"
                [(ngModel)]="promptModel"
              ></textarea>
            </label>
            @if (dialog.promptError()) {
              <p class="font-label-sm text-error">
                {{ 'admin.users.reasonRequired' | translate }}
              </p>
            }
          }

          <div class="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              class="ui-btn-secondary"
              (click)="cancel()"
            >
              {{ (opts.cancelKey || 'common.cancel') | translate }}
            </button>
            <button
              #confirmBtn
              type="button"
              [class]="
                (opts.danger ? 'ui-btn-danger' : 'ui-btn-primary') +
                ' hover:shadow-lg hover:brightness-105 transition-all duration-200'
              "
              (click)="confirm()"
            >
              {{ (opts.confirmKey || 'common.confirm') | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class UiConfirmDialogComponent {
  readonly dialog = inject(ConfirmDialogService);

  readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  readonly confirmBtn = viewChild<ElementRef<HTMLButtonElement>>('confirmBtn');
  readonly promptInput = viewChild<ElementRef<HTMLTextAreaElement>>('promptInput');

  readonly titleId = 'ui-confirm-title';
  readonly bodyId = 'ui-confirm-body';
  readonly promptId = 'ui-confirm-prompt';

  private previousFocus: HTMLElement | null = null;
  private wasOpen = false;

  constructor() {
    effect(() => {
      const isOpen = this.dialog.open();
      if (isOpen && !this.wasOpen) {
        this.previousFocus = captureFocus();
        queueMicrotask(() => {
          const promptEl = this.promptInput()?.nativeElement;
          if (promptEl) {
            promptEl.focus();
          } else {
            this.confirmBtn()?.nativeElement.focus();
          }
        });
      } else if (!isOpen && this.wasOpen) {
        restoreFocus(this.previousFocus);
        this.previousFocus = null;
      }
      this.wasOpen = isOpen;
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialog.open()) {
      this.cancel();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.dialog.open()) {
      return;
    }
    const panelEl = this.panel()?.nativeElement;
    if (!panelEl) {
      return;
    }
    trapTabKey(event, panelEl);
  }

  get promptModel(): string {
    return this.dialog.promptText();
  }

  set promptModel(value: string) {
    this.dialog.promptText.set(value ?? '');
    if ((value ?? '').trim()) {
      this.dialog.promptError.set(false);
    }
  }

  confirm(): void {
    const typed = this.promptInput()?.nativeElement.value ?? this.dialog.promptText();
    this.dialog.promptText.set(typed);
    this.dialog.resolve(true);
  }

  cancel(): void {
    this.dialog.resolve(false);
  }
}
