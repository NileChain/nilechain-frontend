import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ContractSummaryBullet } from '../contract-text.util';

@Component({
  selector: 'app-contract-summary',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section
      class="summary"
      [attr.aria-label]="'contractDoc.commercialTerms' | translate"
    >
      <ul class="summary__list">
        @for (b of bullets; track b.labelKey + b.value) {
          <li class="summary__item" [attr.data-tone]="b.tone || 'neutral'">
            <span class="material-symbols-outlined" aria-hidden="true">{{
              b.icon
            }}</span>
            <div class="min-w-0">
              <p class="summary__label">{{ b.labelKey | translate }}</p>
              <p class="summary__value">{{ b.value }}</p>
            </div>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      .summary {
        margin: 0;
      }
      .summary__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.5rem;
      }
      @media (min-width: 720px) {
        .summary__list {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      @media (min-width: 1100px) {
        .summary__list {
          grid-template-columns: repeat(6, minmax(0, 1fr));
        }
      }
      .summary__item {
        display: flex;
        gap: 0.45rem;
        align-items: flex-start;
        border-radius: 0.55rem;
        padding: 0.55rem 0.6rem;
        background: var(--color-surface-container-low, #f3f5f0);
        border: 1px solid
          color-mix(in srgb, var(--color-outline-variant, #c4c8c0) 55%, transparent);
        min-width: 0;
      }
      .summary__item .material-symbols-outlined {
        font-size: 1.05rem;
        color: var(--color-primary, #1b5e20);
        margin-top: 0.1rem;
      }
      .summary__item[data-tone='price'] .material-symbols-outlined {
        color: var(--color-warning, #e65100);
      }
      .summary__item[data-tone='risk-low'] .material-symbols-outlined {
        color: var(--color-success, #1b5e20);
      }
      .summary__item[data-tone='risk-mid'] .material-symbols-outlined {
        color: var(--color-warning, #e65100);
      }
      .summary__item[data-tone='risk-high'] .material-symbols-outlined {
        color: var(--color-danger, #c62828);
      }
      .summary__label {
        margin: 0;
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--color-on-surface-variant, #5f6b64);
      }
      .summary__value {
        margin: 0.15rem 0 0;
        font-size: 0.8125rem;
        font-weight: 650;
        line-height: 1.3;
        color: var(--color-on-surface, #1a1c19);
        word-break: break-word;
      }
    `,
  ],
})
export class ContractSummaryComponent {
  @Input() bullets: ContractSummaryBullet[] = [];
}
