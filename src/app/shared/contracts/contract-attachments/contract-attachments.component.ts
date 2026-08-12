import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ContractAttachmentItem } from '../models/contract-document.model';

const KIND_OPTIONS = ['Certificate', 'Delivery', 'Quality', 'Weighbridge', 'GateRejectEvidence', 'Other'] as const;

@Component({
  selector: 'app-contract-attachments',
  standalone: true,
  imports: [TranslatePipe, FormsModule],
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

      @if (canUpload) {
        <div class="attachments__upload">
          <label class="attachments__kind-label" for="attachment-kind">
            {{ 'contractDoc.attachmentKind' | translate }}
          </label>
          <select
            id="attachment-kind"
            class="ui-input attachments__kind"
            [(ngModel)]="selectedKind"
            name="attachmentKind"
            [disabled]="uploading"
          >
            @for (k of kindOptions; track k) {
              <option [value]="k">{{ k }}</option>
            }
          </select>
          <label class="ui-btn-secondary attachments__file-btn">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
              >upload_file</span
            >
            {{
              uploading
                ? ('common.saving' | translate)
                : ('contractDoc.uploadAttachment' | translate)
            }}
            <input
              type="file"
              class="sr-only"
              [disabled]="uploading"
              (change)="onFileSelected($event)"
            />
          </label>
        </div>
      }

      @if (items.length === 0) {
        <p class="attachments__empty">
          {{ 'contractDoc.noAttachments' | translate }}
        </p>
      } @else {
        <ul class="attachments__list">
          @for (file of items; track file.id) {
            <li class="file-card">
              <span class="file-card__icon" aria-hidden="true">
                <span class="material-symbols-outlined">{{
                  file.icon || 'picture_as_pdf'
                }}</span>
              </span>
              <div class="min-w-0 flex-1">
                @if (file.url) {
                  <a
                    class="file-card__name file-card__link"
                    [href]="file.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ file.name }}
                  </a>
                } @else {
                  <p class="file-card__name">{{ file.name }}</p>
                }
                <p class="file-card__meta">
                  @if (file.kind) {
                    <span>{{ file.kind }}</span>
                    <span aria-hidden="true"> · </span>
                  }
                  <span>{{ file.typeLabel }}</span>
                  @if (file.sizeLabel) {
                    <span aria-hidden="true"> · </span>
                    <span>{{ file.sizeLabel }}</span>
                  }
                </p>
              </div>
              @if (file.canDelete) {
                <button
                  type="button"
                  class="file-card__delete"
                  [attr.aria-label]="'contractDoc.deleteAttachment' | translate"
                  (click)="remove.emit(file.id)"
                >
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
                    >delete</span
                  >
                  {{ 'contractDoc.deleteAttachment' | translate }}
                </button>
              }
            </li>
          }
        </ul>
      }
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
      .attachments__upload {
        display: flex;
        flex-wrap: wrap;
        align-items: end;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }
      .attachments__kind-label {
        width: 100%;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--color-on-surface-variant, #5f6b64);
      }
      .attachments__kind {
        max-width: 11rem;
        padding: 0.4rem 0.55rem;
        font-size: 0.75rem;
      }
      .attachments__file-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        cursor: pointer;
        margin: 0;
      }
      .attachments__empty {
        margin: 0;
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
      .file-card__link {
        display: block;
        text-decoration: underline;
        text-underline-offset: 2px;
        color: var(--color-primary, #1b5e20);
      }
      .file-card__meta {
        margin: 0.1rem 0 0;
        font-size: 0.7rem;
        color: var(--color-on-surface-variant, #5f6b64);
      }
      .file-card__delete {
        margin-inline-start: auto;
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        border: none;
        background: transparent;
        color: var(--color-on-surface-variant, #5f6b64);
        font-size: 0.7rem;
        font-weight: 600;
        cursor: pointer;
        padding: 0.25rem 0.35rem;
        border-radius: 0.4rem;
        white-space: nowrap;
      }
      .file-card__delete:hover {
        color: var(--color-error, #b3261e);
        background: color-mix(in srgb, var(--color-error, #b3261e) 8%, transparent);
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `,
  ],
})
export class ContractAttachmentsComponent {
  @Input() items: ContractAttachmentItem[] = [];
  @Input() canUpload = false;
  @Input() uploading = false;
  @Output() upload = new EventEmitter<{ file: File; kind: string }>();
  @Output() remove = new EventEmitter<string>();

  readonly kindOptions = KIND_OPTIONS;
  selectedKind: string = 'Other';

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.upload.emit({ file, kind: this.selectedKind || 'Other' });
    input.value = '';
  }
}
