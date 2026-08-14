import { DatePipe } from '@angular/common';
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
  imports: [TranslatePipe, DatePipe],
  template: `
    @if (diffs.length) {
      <section
        class="rounded-lg border border-outline-variant bg-surface-container-low p-4 space-y-3 print:hidden"
        [attr.aria-label]="'negotiation.diffTitle' | translate"
      >
        <div class="space-y-1">
          <p class="font-body-md font-semibold text-on-surface">
            {{
              (fromOther
                ? 'negotiation.diffFromOther'
                : 'negotiation.diffFromYou'
              ) | translate
            }}
          </p>
          <p class="font-label-sm text-on-surface-variant">
            {{ partyLabelKey | translate }}
            · {{ revision.createdAt | date: 'medium' }}
          </p>
          @if (revision.instructions.trim()) {
            <p class="font-body-md text-on-surface">
              <span class="text-on-surface-variant">{{
                'negotiation.diffInstructions' | translate
              }}</span>
              {{ revision.instructions }}
            </p>
          }
        </div>

        <ul class="space-y-4" role="list">
          @for (hunk of diffs; track $index) {
            <li class="space-y-2">
              <p class="font-label-sm font-semibold text-on-surface">
                {{ kindKey(hunk.kind) | translate }}
                —
                {{
                  hunk.title.trim()
                    ? hunk.title
                    : ('negotiation.diffIntro' | translate)
                }}
              </p>
              @for (para of hunk.paragraphs; track $index) {
                <p class="font-body-md text-on-surface leading-relaxed">
                  @for (op of displayOps(para); track $index) {
                    @if (op.kind === 'delete') {
                      <span
                        class="text-on-surface-variant line-through decoration-error/70"
                        >{{ op.text }}</span
                      >
                    } @else if (op.kind === 'insert') {
                      <mark
                        class="rounded-sm bg-primary/20 text-on-surface px-0.5"
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
