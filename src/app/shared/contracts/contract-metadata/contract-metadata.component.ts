import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ContractDocumentModel } from '../models/contract-document.model';
import { displayText } from '../contract-text.util';

@Component({
  selector: 'app-contract-metadata',
  standalone: true,
  imports: [TranslatePipe, DatePipe, DecimalPipe],
  template: `
    <section
      class="contract-meta"
      [attr.aria-label]="'contractDoc.contractInfo' | translate"
    >
      <h3 class="contract-meta__title">
        {{ 'contractDoc.contractInfo' | translate }}
      </h3>
      <dl class="contract-meta__grid">
        <div>
          <dt>{{ 'contractDoc.cropType' | translate }}</dt>
          <dd>{{ display(contract.cropName) }}</dd>
        </div>
        <div>
          <dt>{{ 'contractDoc.quantity' | translate }}</dt>
          <dd class="ui-data-sm">
            {{ contract.quantityTons | number: '1.0-2' }}
            {{ 'common.ton' | translate }}
          </dd>
        </div>
        <div>
          <dt>{{ 'contractDoc.price' | translate }}</dt>
          <dd class="ui-data-sm">
            @if (contract.pricePerTon != null) {
              {{ contract.pricePerTon | number: '1.0-0' }}
              {{ 'common.egp' | translate }}/{{ 'common.ton' | translate }}
            } @else {
              —
            }
          </dd>
        </div>
        <div>
          <dt>{{ 'contractDoc.deliveryDate' | translate }}</dt>
          <dd>
            {{
              contract.deliveryDate
                ? (contract.deliveryDate | date: 'mediumDate')
                : '—'
            }}
          </dd>
        </div>
        <div>
          <dt>{{ 'contractDoc.paymentTerms' | translate }}</dt>
          <dd>{{ 'contractDoc.summaryPaymentAfter' | translate }}</dd>
        </div>
        <div class="contract-meta__wide">
          <dt>{{ 'contractDoc.deliveryLocation' | translate }}</dt>
          <dd>
            {{
              display(contract.deliveryLocation) !== '—'
                ? display(contract.deliveryLocation)
                : display(contract.factoryLocation)
            }}
          </dd>
        </div>
      </dl>
    </section>
  `,
  styles: [
    `
      .contract-meta {
        margin-block: 1.35rem;
        padding: 0;
        border: 0;
        background: transparent;
      }
      .contract-meta__title {
        margin: 0 0 0.75rem;
        font-size: 0.72rem;
        font-weight: 750;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #5f6b64;
      }
      .contract-meta__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem 1rem;
        margin: 0;
        padding: 0.85rem 0.95rem;
        border-radius: 0.55rem;
        border: 1px solid rgb(16 24 40 / 8%);
        background: #fafbf8;
      }
      :host-context(html.dark) .contract-meta__grid {
        background: color-mix(in srgb, var(--color-surface-container) 80%, transparent);
        border-color: rgb(255 255 255 / 8%);
      }
      @media (min-width: 768px) {
        .contract-meta__grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .contract-meta__wide {
          grid-column: span 3;
        }
      }
      dt {
        margin: 0;
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #5f6b64;
      }
      dd {
        margin: 0.2rem 0 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: inherit;
      }
    `,
  ],
})
export class ContractMetadataComponent {
  @Input({ required: true }) contract!: ContractDocumentModel;

  display(value: string | null | undefined): string {
    return displayText(value);
  }
}
