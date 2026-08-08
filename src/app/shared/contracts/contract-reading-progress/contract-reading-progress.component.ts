import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-contract-reading-progress',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div
      class="progress"
      role="progressbar"
      [attr.aria-valuenow]="percent"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-label]="'contractDoc.readingProgress' | translate"
    >
      <div class="progress__meta">
        <span class="progress__label">{{ 'contractDoc.readingContract' | translate }}</span>
        <span class="progress__pct tabular-nums">{{ percent }}%</span>
      </div>
      <div class="progress__track">
        <div
          class="progress__fill"
          [style.transform]="'scaleX(' + percent / 100 + ')'"
        ></div>
      </div>
    </div>
  `,
  styles: [
    `
      .progress {
        border-radius: 14px;
        padding: 0.65rem 0.85rem;
        background: color-mix(in srgb, var(--color-surface-container-lowest, #fff) 88%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-outline-variant, #c4c8c0) 65%, transparent);
        box-shadow: 0 6px 18px rgb(16 24 40 / 5%);
        backdrop-filter: blur(10px);
      }
      .progress__meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.4rem;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--color-on-surface-variant, #5f6b64);
      }
      .progress__pct {
        color: var(--color-primary, #1b5e20);
      }
      .progress__track {
        height: 6px;
        border-radius: 999px;
        background: var(--color-surface-container-high, #e8ebe4);
        overflow: hidden;
      }
      .progress__fill {
        height: 100%;
        width: 100%;
        border-radius: inherit;
        background: linear-gradient(
          90deg,
          var(--color-primary, #1b5e20),
          var(--color-primary-fixed-dim, #91d78a)
        );
        transform: scaleX(0);
        transform-origin: inline-start center;
        transition: transform 0.12s linear;
      }
      @media (prefers-reduced-motion: reduce) {
        .progress__fill {
          transition: none;
        }
      }
    `,
  ],
})
export class ContractReadingProgressComponent {
  @Input() percent = 0;
}
