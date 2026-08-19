import { UiDatePipe } from '../../../core/pipes/ui-date.pipe';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import {
  ContractDiffKind,
  ContractParagraphDiff,
  ContractRevisionView,
  ContractSectionDiff,
  DiffOp,
  collapseUnchanged,
  diffContractDraft,
} from '../contract-diff.util';

@Component({
  selector: 'app-contract-negotiation-diff',
  standalone: true,
  imports: [
    UiDatePipe, TranslatePipe],
  template: `
    @if (diffs.length) {
      <section
        class="rounded-xl border border-primary/25 bg-surface-container-lowest p-5 space-y-4 shadow-sm print:hidden"
        [attr.aria-label]="'negotiation.diffTitle' | translate"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/60 pb-3">
          <div>
            <p class="font-title-sm font-bold text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[18px]" aria-hidden="true">
                published_with_changes
              </span>
              {{
                (fromOther
                  ? 'negotiation.diffFromOther'
                  : 'negotiation.diffFromYou'
                ) | translate
              }}
            </p>
            <p class="font-label-sm text-on-surface-variant mt-0.5">
              {{ partyLabelKey | translate }}
              · {{ revision.createdAt | uiDate: 'medium' }}
            </p>
          </div>
          @if (revision.instructions.trim()) {
            <div class="w-full bg-primary-container/40 p-2.5 rounded-lg border border-primary/15 font-body-sm text-on-surface">
              <span class="font-semibold text-primary">{{
                'negotiation.diffInstructions' | translate
              }}: </span>
              {{ revision.instructions }}
            </div>
          }
        </div>

        <ul class="space-y-3 divide-y divide-outline-variant/40" role="list">
          @for (hunk of diffs; track $index) {
            <li class="pt-3 first:pt-0 space-y-1.5">
              <p class="font-label-sm font-bold text-on-surface flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                {{ kindKey(hunk.kind) | translate }}
                —
                {{
                  hunk.title.trim()
                    ? hunk.title
                    : ('negotiation.diffIntro' | translate)
                }}
              </p>
              @for (para of hunk.paragraphs; track $index) {
                <p class="font-body-md text-on-surface leading-relaxed p-2 rounded bg-surface-container-low/50">
                  @for (op of displayOps(para); track $index) {
                    @if (op.kind === 'delete') {
                      <span
                        class="text-error line-through bg-error/10 px-1 rounded mx-0.5 font-medium"
                        >{{ op.text }}</span
                      >
                    } @else if (op.kind === 'insert') {
                      <mark
                        class="rounded bg-primary/15 text-primary font-semibold px-1 py-0.5 mx-0.5 border-b border-primary/40"
                        >{{ op.text }}</mark
                      >
                    } @else {
                      <span>{{ op.text }}</span>
                    }
                  }
                </p>
              }
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class ContractNegotiationDiffComponent implements OnChanges {
  @Input({ required: true }) revision!: ContractRevisionView;
  @Input() viewerParty: 'Factory' | 'Farm' = 'Factory';

  diffs: ContractSectionDiff[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['revision'] && this.revision) {
      this.diffs = diffContractDraft(
        this.revision.previousText,
        this.revision.newText
      );
    }
  }

  get fromOther(): boolean {
    return (
      (this.revision?.revisedByParty || '').toLowerCase() !==
      this.viewerParty.toLowerCase()
    );
  }

  get partyLabelKey(): string {
    const party = (this.revision?.revisedByParty || '').toLowerCase();
    return party === 'farm'
      ? 'negotiation.diffPartyFarm'
      : 'negotiation.diffPartyFactory';
  }

  kindKey(kind: ContractDiffKind): string {
    return `negotiation.diffKind.${kind}`;
  }

  displayOps(para: ContractParagraphDiff): DiffOp[] {
    return collapseUnchanged(para.ops);
  }
}
