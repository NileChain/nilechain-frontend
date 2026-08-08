import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-contract-action-bar',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div
      class="action-bar"
      [class.action-bar--floating]="floating"
      [class.action-bar--sticky]="sticky && !floating"
      role="toolbar"
      [attr.aria-label]="'contractDoc.actions' | translate"
    >
      <div class="action-bar__secondary">
        @if (showDownload) {
          <button
            type="button"
            class="ui-btn-secondary action-btn"
            (click)="download.emit()"
            [disabled]="busy"
          >
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
              >download</span
            >
            <span class="btn-label">{{ 'contractDoc.downloadPdf' | translate }}</span>
          </button>
        }
        @if (showPrint) {
          <button
            type="button"
            class="ui-btn-ghost action-btn"
            (click)="print.emit()"
            [disabled]="busy"
          >
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
              >print</span
            >
            <span class="btn-label">{{ 'contractDoc.print' | translate }}</span>
          </button>
        }
        @if (showShare) {
          <button
            type="button"
            class="ui-btn-ghost action-btn"
            (click)="share.emit()"
            [disabled]="busy"
          >
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
              >share</span
            >
            <span class="btn-label">{{ 'contractDoc.share' | translate }}</span>
          </button>
        }
      </div>

      @if (canDecide) {
        <div class="action-bar__primary">
          @if (reviewHintKey && !acceptEnabled) {
            <p class="review-hint" role="status">{{ reviewHintKey | translate }}</p>
          }
          <button
            type="button"
            class="ui-btn-ghost text-error action-btn"
            (click)="reject.emit()"
            [disabled]="busy"
          >
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
              >cancel</span
            >
            <span class="btn-label">{{ rejectLabelKey | translate }}</span>
          </button>
          <button
            type="button"
            class="ui-btn-primary action-btn action-btn--approve"
            (click)="approve.emit()"
            [disabled]="busy || !acceptEnabled"
            [attr.aria-disabled]="busy || !acceptEnabled"
          >
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
              >verified</span
            >
            <span class="btn-label">{{ acceptLabelKey | translate }}</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .action-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.75rem 0.9rem;
        border-radius: 0.85rem;
        border: 1px solid
          color-mix(in srgb, var(--color-outline-variant, #c4c8c0) 75%, transparent);
        background: color-mix(
          in srgb,
          var(--color-surface-container-lowest, #fff) 94%,
          transparent
        );
        box-shadow: var(--shadow-md, 0 8px 24px rgb(16 24 40 / 10%));
        backdrop-filter: blur(12px);
      }
      .action-bar--sticky {
        position: relative;
        z-index: 30;
      }
      .action-bar--floating {
        position: fixed;
        z-index: 40;
        inset-inline-end: 1.25rem;
        bottom: 1.25rem;
        width: min(420px, calc(100vw - 2rem));
      }
      @media (max-width: 900px) {
        .action-bar--floating {
          inset-inline: 0.75rem;
          bottom: 0.75rem;
          width: auto;
          border-radius: 16px 16px 12px 12px;
        }
      }
      .action-bar__secondary,
      .action-bar__primary {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        align-items: center;
        justify-content: flex-end;
      }
      .review-hint {
        width: 100%;
        margin: 0;
        font-size: 0.78rem;
        font-weight: 650;
        color: var(--color-warning, #e65100);
        text-align: end;
      }
      .action-btn {
        position: relative;
        overflow: hidden;
        transition: transform 0.12s ease;
      }
      .action-btn:active:not(:disabled) {
        transform: scale(0.97);
      }
      .action-btn--approve::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgb(255 255 255 / 28%), transparent 45%);
        opacity: 0;
        transition: opacity 0.35s ease;
        pointer-events: none;
      }
      .action-btn--approve:active::after {
        opacity: 1;
      }
      @media (max-width: 640px) {
        .btn-label-hide-sm .btn-label {
          display: none;
        }
        .action-bar {
          flex-direction: column-reverse;
          align-items: stretch;
        }
        .action-bar__primary,
        .action-bar__secondary {
          width: 100%;
        }
        .action-bar__primary .action-btn,
        .action-bar__secondary .action-btn {
          flex: 1;
          justify-content: center;
        }
      }
      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
    `,
  ],
})
export class ContractActionBarComponent {
  @Input() canDecide = false;
  @Input() acceptEnabled = true;
  @Input() showDownload = true;
  @Input() showPrint = true;
  @Input() showShare = true;
  @Input() sticky = true;
  @Input() floating = false;
  @Input() busy = false;
  @Input() acceptLabelKey = 'contractDoc.approve';
  @Input() rejectLabelKey = 'contractDoc.reject';
  @Input() reviewHintKey = '';

  @Output() readonly approve = new EventEmitter<void>();
  @Output() readonly reject = new EventEmitter<void>();
  @Output() readonly download = new EventEmitter<void>();
  @Output() readonly print = new EventEmitter<void>();
  @Output() readonly share = new EventEmitter<void>();
}
