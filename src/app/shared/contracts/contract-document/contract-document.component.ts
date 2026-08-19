import { UiDatePipe } from '../../../core/pipes/ui-date.pipe';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiBrandMarkComponent } from '../../ui/brand-mark/brand-mark.component';
import { UiEmptyStateComponent } from '../../ui/empty-state/empty-state.component';
import { formatContractNumber } from '../contract-document.mapper';
import { ContractDocumentModel } from '../models/contract-document.model';
import {
  ContractBodySection,
  displayText,
  extractBismillah,
  parseContractSections,
} from '../contract-text.util';
import {
  DiffOp,
  changedParagraphKeys,
  changedSectionTitleKeys,
  diffContractDraft,
  opsAreFullInsert,
  paraHighlightKey,
  paragraphOpsMap,
  sectionTitleKey,
} from '../contract-diff.util';

/**
 * Structured agricultural supply agreement paper.
 * Presentation template — legal wording comes from generated/approved text only.
 * Requires legal/business-owner review before production use.
 */
@Component({
  selector: 'app-contract-document',
  standalone: true,
  imports: [
    UiDatePipe, TranslatePipe,
    DecimalPipe,
    UiEmptyStateComponent,
    UiBrandMarkComponent,
  ],
  templateUrl: './contract-document.component.html',
  styleUrl: './contract-document.component.scss',
})
export class ContractDocumentComponent implements OnChanges {
  @Input({ required: true }) contract!: ContractDocumentModel;
  @Input() showSignedBanner = false;
  @Input() showWatermark = false;
  @Input() documentDir: 'rtl' | 'ltr' = 'ltr';
  /** Previous draft body — highlights clauses the other party just changed. */
  @Input() previousText: string | null = null;

  sections: ContractBodySection[] = [];
  introParagraphs: string[] = [];
  bismillah: string | null = null;
  contractNumber = '';
  private changedTitles = new Set<string>();
  private changedParas = new Set<string>();
  private paraOps = new Map<string, DiffOp[]>();

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['contract'] || changes['previousText']) &&
      this.contract
    ) {
      this.rebuildBody();
    }
  }

  get isFactorySigned(): boolean {
    return !!this.contract?.factorySigned;
  }

  get isFarmSigned(): boolean {
    return !!this.contract?.farmSigned;
  }

  get isFullySigned(): boolean {
    return this.isFactorySigned && this.isFarmSigned;
  }

  get hasGeneratedText(): boolean {
    return !!this.contract?.generatedText?.trim();
  }

  locationOf(value: string | null | undefined): string {
    return displayText(value, '');
  }

  displayText(value: string | null | undefined): string {
    return displayText(value);
  }

  isChangedIntro(): boolean {
    return this.changedTitles.has('');
  }

  isChangedIntroPara(index: number): boolean {
    return this.changedParas.has(paraHighlightKey('', index));
  }

  introOps(index: number): DiffOp[] | null {
    return this.opsAt('', index);
  }

  isChangedSection(section: ContractBodySection): boolean {
    return this.changedTitles.has(sectionTitleKey(section));
  }

  isChangedParagraph(section: ContractBodySection, index: number): boolean {
    return this.changedParas.has(
      paraHighlightKey(sectionTitleKey(section), index)
    );
  }

  paragraphOps(
    section: ContractBodySection,
    index: number
  ): DiffOp[] | null {
    return this.opsAt(sectionTitleKey(section), index);
  }

  isNewParagraph(ops: DiffOp[]): boolean {
    return opsAreFullInsert(ops);
  }

  isAddedSection(section: ContractBodySection): boolean {
    if (!section.paragraphs.length) {
      return false;
    }
    return section.paragraphs.every((_, index) => {
      const ops = this.paragraphOps(section, index);
      return !!ops && this.isNewParagraph(ops);
    });
  }

  private rebuildBody(): void {
    const raw = this.contract.generatedText;
    this.bismillah = extractBismillah(raw);
    this.contractNumber = formatContractNumber(
      this.contract.contractId,
      this.contract.createdAt
    );
    this.sections = parseContractSections(raw);
    this.introParagraphs = [];
    if (this.sections.length && !this.sections[0].title.trim()) {
      this.introParagraphs = this.sections[0].paragraphs
        .map((p) => p.trim())
        .filter(Boolean);
      this.sections = this.sections.slice(1);
    }

    if (this.bismillah) {
      this.introParagraphs = this.introParagraphs.filter(
        (p) => p !== this.bismillah
      );
    }

    if (this.bismillah && this.sections.length) {
      const first = this.sections[0];
      first.paragraphs = first.paragraphs.filter(
        (p) => p.trim() !== this.bismillah
      );
      if (!first.title.trim() && /^بسم\s+الله/.test(first.title)) {
        first.title = '';
      }
      if (
        first.title &&
        /^بسم\s+الله/.test(first.title) &&
        first.paragraphs.length === 0
      ) {
        this.sections = this.sections.slice(1);
      } else if (first.title && /^بسم\s+الله/.test(first.title)) {
        first.title = '';
      }
    }

    this.changedTitles = new Set();
    this.changedParas = new Set();
    this.paraOps = new Map();
    if (!this.previousText?.trim()) {
      return;
    }

    const diffs = diffContractDraft(this.previousText, raw);
    this.changedTitles = changedSectionTitleKeys(diffs);
    this.changedParas = changedParagraphKeys(diffs);
    this.paraOps = paragraphOpsMap(diffs);
  }

  private opsAt(title: string, index: number): DiffOp[] | null {
    const ops = this.paraOps.get(paraHighlightKey(title, index));
    return ops?.length ? ops : null;
  }
}
