import { Component, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ContractTocItem } from '../contract-text.util';

@Component({
  selector: 'app-contract-toc',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <nav class="toc" [attr.aria-label]="'contractDoc.tocTitle' | translate">
      <div class="toc__head">
        <h3 class="toc__title">
          <span class="material-symbols-outlined" aria-hidden="true">list_alt</span>
          {{ 'contractDoc.tocTitle' | translate }}
        </h3>
        @if (collapsible) {
          <button
            type="button"
            class="toc__toggle lg:hidden"
            (click)="expanded.set(!expanded())"
            [attr.aria-expanded]="expanded()"
            [attr.aria-label]="'contractDoc.tocTitle' | translate"
          >
            <span class="material-symbols-outlined" aria-hidden="true">{{
              expanded() ? 'expand_less' : 'expand_more'
            }}</span>
          </button>
        }
      </div>

      @if (!collapsible || expanded() || isWide()) {
        @if (!items.length) {
          <p class="toc__empty">{{ 'contractDoc.tocEmpty' | translate }}</p>
        } @else {
          <ol class="toc__list">
            @for (item of items; track item.id) {
              <li>
                <button
                  type="button"
                  class="toc__link"
                  [class.is-active]="item.id === activeId"
                  [attr.aria-current]="item.id === activeId ? 'true' : null"
                  (click)="navigate.emit(item.id)"
                >
                  <span class="toc__index">{{ item.index }}</span>
                  <span class="toc__label">{{ item.title }}</span>
                </button>
              </li>
            }
          </ol>
        }
      }
    </nav>
  `,
  styles: [
    `
      .toc {
        border-radius: 0;
        border: 0;
        border-inline-start: 1px solid
          color-mix(in srgb, var(--color-outline-variant, #c4c8c0) 55%, transparent);
        background: transparent;
        box-shadow: none;
        padding-block: 0.15rem;
        padding-inline: 0.65rem 0;
      }
      .toc__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .toc__title {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        margin: 0;
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--color-on-surface, #1a1c19);
      }
      .toc__title .material-symbols-outlined {
        font-size: 1.1rem;
        color: var(--color-on-surface-variant, #5f6b64);
      }
      .toc__toggle {
        border: 0;
        background: transparent;
        color: var(--color-on-surface-variant, #5f6b64);
        padding: 0.2rem;
        border-radius: 0.4rem;
        cursor: pointer;
      }
      .toc__toggle:focus-visible {
        outline: 2px solid var(--color-primary, #1b5e20);
      }
      .toc__empty {
        margin: 0.65rem 0 0.2rem;
        font-size: 0.78rem;
        color: var(--color-on-surface-variant, #5f6b64);
      }
      .toc__list {
        list-style: none;
        margin: 0.55rem 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        max-height: min(58vh, 520px);
        overflow: auto;
      }
      .toc__link {
        width: 100%;
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        text-align: start;
        border: 0;
        background: transparent;
        border-radius: 0.5rem;
        padding: 0.45rem 0.4rem;
        cursor: pointer;
        color: var(--color-on-surface, #1a1c19);
        border-inline-start: 2px solid transparent;
        transition:
          background 0.15s ease,
          border-color 0.15s ease;
      }
      .toc__link:hover {
        background: var(--color-surface-container-low, #f3f5f0);
      }
      .toc__link:focus-visible {
        outline: 2px solid var(--color-primary, #1b5e20);
        outline-offset: 1px;
      }
      .toc__link.is-active {
        background: color-mix(in srgb, var(--color-primary, #1b5e20) 10%, transparent);
        border-inline-start-color: var(--color-primary, #1b5e20);
      }
      .toc__index {
        flex-shrink: 0;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.65rem;
        font-weight: 700;
        background: var(--color-surface-container-high, #e8ebe4);
        color: var(--color-on-surface-variant, #5f6b64);
      }
      .toc__link.is-active .toc__index {
        background: var(--color-primary, #1b5e20);
        color: #fff;
      }
      .toc__label {
        font-size: 0.78rem;
        font-weight: 600;
        line-height: 1.35;
      }
    `,
  ],
})
export class ContractTocComponent {
  @Input() items: ContractTocItem[] = [];
  @Input() activeId: string | null = null;
  @Input() collapsible = false;
  @Output() readonly navigate = new EventEmitter<string>();

  readonly expanded = signal(false);
  private wide = typeof window !== 'undefined' ? window.innerWidth >= 1100 : true;

  @HostListener('window:resize')
  onResize(): void {
    this.wide = window.innerWidth >= 1100;
  }

  isWide(): boolean {
    return this.wide;
  }
}
