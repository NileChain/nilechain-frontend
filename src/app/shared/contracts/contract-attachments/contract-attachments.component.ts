import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ContractAttachmentItem } from '../models/contract-document.model';

@Component({
  selector: 'app-contract-attachments',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section
      class="attachments"
      [attr.aria-label]="'contractDoc.attachments' | translate"
    >
      <h3 class="attachments__title">
        <span class="material-symbols-outlined" aria-hidden="true"
          >attach_file</span
        >
        {{ 'contractDoc.attachments' | translate }}
      </h3>
      <p class="attachments__hint">
        {{ 'contractDoc.attachmentsHint' | translate }}
      </p>
      <ul class="attachments__list">
        @for (file of items; track file.id) {
          <li class="file-card">
            <span class="file-card__icon" aria-hidden="true">
              <span class="material-symbols-outlined">{{
                file.icon || 'picture_as_pdf'
              }}</span>
            </span>
            <div class="min-w-0">
              <p class="file-card__name">{{ file.name }}</p>
              <p class="file-card__meta">
                {{ file.typeLabel }} · {{ file.sizeLabel }}
              </p>
            </div>
            <span class="file-card__badge">{{
              'contractDoc.placeholderFile' | translate
            }}</span>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      .attachments {
        border-radius: 0.75rem;
        border: 1px solid
          color-mix(in srgb, var(--color-outline-variant, #c4c8c0) 75%, transparent);
        background: var(--color-surface-container-lowest, #fff);
        padding: 0.9rem 0.95rem;
      }
      .attachments__title {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        margin: 0;
        font-size: 0.8125rem;
        font-weight: 700;
      }
      .attachments__title .material-symbols-outlined {
        font-size: 1.1rem;
        color: var(--color-on-surface-variant, #5f6b64);
      }
      .attachments__hint {
        margin: 0.3rem 0 0.75rem;
        font-size: 0.75rem;
        color: var(--color-on-surface-variant, #5f6b64);
      }
      .attachments__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .file-card {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.6rem 0.7rem;
        border-radius: 0.55rem;
        border: 1px dashed
          color-mix(in srgb, var(--color-outline-variant, #c4c8c0) 80%, transparent);
        background: var(--color-surface-container-low, #f3f5f0);
      }
      .file-card__icon {
        width: 2rem;
        height: 2rem;
        border-radius: 0.45rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--color-primary, #1b5e20) 10%, transparent);
        color: var(--color-primary, #1b5e20);
        flex-shrink: 0;
      }
      .file-card__icon .material-symbols-outlined {
        font-size: 1.05rem;
      }
      .file-card__name {
        margin: 0;
        font-weight: 600;
        font-size: 0.8125rem;
        color: var(--color-on-surface, #1a1c19);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .file-card__meta {
        margin: 0.1rem 0 0;
        font-size: 0.7rem;
        color: var(--color-on-surface-variant, #5f6b64);
      }
      .file-card__badge {
        margin-inline-start: auto;
        font-size: 0.625rem;
        font-weight: 650;
        padding: 0.18rem 0.45rem;
        border-radius: 999px;
        background: var(--color-surface-container-high, #e8ebe4);
        color: var(--color-on-surface-variant, #5f6b64);
        white-space: nowrap;
      }
    `,
  ],
})
export class ContractAttachmentsComponent {
  @Input() items: ContractAttachmentItem[] = [];
}
