import {
  Component,
  ElementRef,
  HostListener,
  Input,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AiAssistantService } from '../../../core/services/ai-assistant.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  captureFocus,
  restoreFocus,
  trapTabKey,
} from '../../a11y/focus-trap';

@Component({
  selector: 'ui-ai-assistant-drawer',
  standalone: true,
  imports: [TranslatePipe, FormsModule],
  template: `
    @if (showFab && canUseAssistant()) {
      <button
        type="button"
        class="fixed bottom-24 end-6 z-[70] h-14 w-14 rounded-full bg-primary-container text-on-primary-container shadow-lg hover:opacity-90 active:scale-95 flex items-center justify-center"
        (click)="ai.toggle()"
        [attr.aria-label]="'common.aiAssistant' | translate"
      >
        <span class="material-symbols-outlined" aria-hidden="true">smart_toy</span>
      </button>
    }

    @if (ai.open()) {
      <div
        class="fixed inset-0 z-[80]"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/40"
          (click)="ai.closeDrawer()"
          [attr.aria-label]="'common.close' | translate"
          tabindex="-1"
        ></button>

        <aside
          #panel
          tabindex="-1"
          class="absolute inset-y-0 end-0 w-full max-w-md bg-surface shadow-xl border-s border-outline-variant flex flex-col outline-none"
        >
          <header
            class="h-auto min-h-16 px-4 py-3 flex items-start justify-between gap-3 border-b border-outline-variant shrink-0"
          >
            <div class="min-w-0 space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h2
                  [id]="titleId"
                  class="font-title-md text-title-md text-on-surface font-bold"
                >
                  {{ 'common.aiDrawerTitle' | translate }}
                </h2>
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 font-label-sm text-label-sm bg-primary-container text-on-primary-container"
                >
                  {{ 'common.aiDrawerLiveBadge' | translate }}
                </span>
              </div>
              <p class="text-label-sm text-on-surface-variant">
                {{ 'common.aiDrawerHint' | translate }}
              </p>
            </div>
            <button
              #closeBtn
              type="button"
              class="ui-icon-btn shrink-0"
              (click)="ai.closeDrawer()"
              [attr.aria-label]="'common.close' | translate"
            >
              <span class="material-symbols-outlined" aria-hidden="true"
                >close</span
              >
            </button>
          </header>

          <div class="px-4 py-3 border-b border-outline-variant space-y-2">
            <p class="text-label-sm text-on-surface-variant">
              {{ 'common.quickActions' | translate }}
            </p>
            <div class="flex flex-wrap gap-2">
              @for (prompt of ai.suggestedPrompts; track prompt.id) {
                <button
                  type="button"
                  class="rounded-lg border border-outline-variant px-3 py-1.5 text-label-sm text-on-surface hover:bg-surface-container-low"
                  (click)="ai.sendPrompt(prompt.prompt, prompt.id)"
                >
                  {{ prompt.labelKey | translate }}
                </button>
              }
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            @if (ai.messages().length === 0 && !ai.thinking()) {
              <p
                class="font-body-md text-body-md text-on-surface-variant text-center py-8"
              >
                {{ 'common.aiDrawerEmpty' | translate }}
              </p>
            }
            @for (msg of ai.messages(); track msg.id) {
              <div
                class="rounded-lg px-3 py-2 max-w-[90%] whitespace-pre-wrap font-body-sm text-body-sm"
                [class.ms-auto]="msg.role === 'user'"
                [class.bg-primary-container]="msg.role === 'user'"
                [class.text-on-primary-container]="msg.role === 'user'"
                [class.bg-surface-container-low]="msg.role === 'assistant'"
                [class.text-on-surface]="msg.role === 'assistant'"
              >
                {{ msg.text }}
              </div>
            }
            @if (ai.thinking()) {
              <p class="text-label-sm text-on-surface-variant">
                {{ 'common.aiDrawerThinking' | translate }}…
              </p>
            }
          </div>

          <footer
            class="p-4 border-t border-outline-variant shrink-0 flex gap-2"
          >
            <input
              #draftInput
              type="text"
              class="ui-input flex-1"
              [(ngModel)]="draft"
              [placeholder]="'common.searchPlaceholder' | translate"
              (keydown.enter)="sendDraft()"
            />
            <button
              type="button"
              class="ui-btn-primary !px-4"
              (click)="sendDraft()"
              [disabled]="!draft.trim() || ai.thinking()"
            >
              <span class="material-symbols-outlined" aria-hidden="true"
                >send</span
              >
            </button>
          </footer>
        </aside>
      </div>
    }
  `,
})
export class UiAiAssistantDrawerComponent {
  readonly ai = inject(AiAssistantService);
  private readonly auth = inject(AuthService);

  @Input() showFab = true;

  readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');
  readonly draftInput = viewChild<ElementRef<HTMLInputElement>>('draftInput');

  readonly titleId = 'ui-ai-drawer-title';

  readonly canUseAssistant = computed(
    () =>
      this.auth.isAuthenticated() &&
      this.auth.hasAnyRole(['Factory', 'Farm', 'Admin', 'SuperAdmin'])
  );

  draft = '';

  private previousFocus: HTMLElement | null = null;
  private wasOpen = false;

  constructor() {
    effect(() => {
      const isOpen = this.ai.open();
      if (isOpen && !this.wasOpen) {
        this.previousFocus = captureFocus();
        queueMicrotask(() => {
          const input = this.draftInput()?.nativeElement;
          if (input) {
            input.focus();
          } else {
            this.closeBtn()?.nativeElement.focus();
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
    if (this.ai.open()) {
      this.ai.closeDrawer();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.ai.open()) {
      return;
    }
    const panelEl = this.panel()?.nativeElement;
    if (!panelEl) {
      return;
    }
    trapTabKey(event, panelEl);
  }

  sendDraft(): void {
    const text = this.draft.trim();
    if (!text || this.ai.thinking()) {
      return;
    }
    this.ai.sendPrompt(text);
    this.draft = '';
  }
}
