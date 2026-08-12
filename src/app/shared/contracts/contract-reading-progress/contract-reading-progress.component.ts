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
        border-radius: 0;
        padding: 0.35rem 0.15rem 0.45rem;
        background: transparent;
        border: 0;
        border-block-end: 1px solid
          color-mix(in srgb, var(--color-outline-variant, #c4c8c0) 50%, transparent);
        box-shadow: none;
        backdrop-filter: none;
      }
      .progress__meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.3rem;
        font-size: 0.72rem;
        font-weight: 650;
        color: var(--color-on-surface-variant, #5f6b64);
      }
      .progress__pct {
        color: var(--color-primary, #1b5e20);
      }
      .progress__track {
        height: 3px;
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
