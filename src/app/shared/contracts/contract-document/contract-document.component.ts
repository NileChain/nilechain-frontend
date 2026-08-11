import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiEmptyStateComponent } from '../../ui/empty-state/empty-state.component';
import { ContractDocumentModel } from '../models/contract-document.model';
import {
  ContractBodySection,
  computeTotalValue,
  contractStatusLabelKey,
  displayText,
  extractBismillah,
  highlightContractHtml,
  parseContractSections,
} from '../contract-text.util';

@Component({
  selector: 'app-contract-document',
  standalone: true,
  imports: [TranslatePipe, DatePipe, DecimalPipe, UiEmptyStateComponent],
  templateUrl: './contract-document.component.html',
  styleUrl: './contract-document.component.scss',
})
export class ContractDocumentComponent implements OnChanges {
  private readonly sanitizer = inject(DomSanitizer);

  @Input({ required: true }) contract!: ContractDocumentModel;
  @Input() showSignedBanner = false;
  @Input() showWatermark = false;
  @Input() documentDir: 'rtl' | 'ltr' = 'ltr';

  sections: ContractBodySection[] = [];
  highlighted = new Map<string, SafeHtml[]>();
  bismillah: string | null = null;
  totalValue: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contract'] && this.contract) {
      this.rebuildBody();
    }
  }

  get isFactorySigned(): boolean {
    if (this.contract?.factorySigned != null) {
      return !!this.contract.factorySigned;
    }
    const s = (this.contract?.status || '').toLowerCase();
    return (
      s === 'pendingfarmsignature' ||
      s === 'signed' ||
      s === 'active'
    );
  }

  get isFarmSigned(): boolean {
    if (this.contract?.farmSigned != null) {
      return !!this.contract.farmSigned;
    }
    const s = (this.contract?.status || '').toLowerCase();
    return (
      s === 'pendingfactorysignature' ||
      s === 'signed' ||
      s === 'active'
    );
  }

  get isFullySigned(): boolean {
    return this.isFactorySigned && this.isFarmSigned;
  }

  get hasGeneratedText(): boolean {
    return !!this.contract?.generatedText?.trim();
  }

  statusTone(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'signed' || s === 'active' || s === 'completed') return 'success';
    if (s === 'cancelled' || s === 'rejected') return 'danger';
    if (
      s === 'pendingsignature' ||
      s === 'pendingfarmsignature' ||
      s === 'pendingfactorysignature' ||
      s === 'draft'
    ) {
      return 'warning';
    }
    return 'neutral';
  }

  statusLabelKey(status: string): string {
    return contractStatusLabelKey(status);
  }

  locationOf(value: string | null | undefined): string {
    return displayText(value, '');
  }

  displayText(value: string | null | undefined): string {
    return displayText(value);
  }

  shortId(id: string): string {
    return id?.length > 8 ? `${id.slice(0, 8).toUpperCase()}…` : id;
  }

  fullId(id: string): string {
    return (id || '').toUpperCase();
  }

  htmlFor(sectionId: string, index: number): SafeHtml | null {
    return this.highlighted.get(sectionId)?.[index] ?? null;
  }

  private rebuildBody(): void {
    const raw = this.contract.generatedText;
    this.bismillah = extractBismillah(raw);
    this.totalValue = computeTotalValue(
      this.contract.quantityTons,
      this.contract.pricePerTon
    );
    this.sections = parseContractSections(raw);
    // Avoid repeating the bismillah line inside the first section body.
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

    this.highlighted = new Map();
    for (const section of this.sections) {
      const htmls = section.paragraphs.map((p) =>
        this.sanitizer.bypassSecurityTrustHtml(
          highlightContractHtml(p, this.contract)
        )
      );
      this.highlighted.set(section.id, htmls);
    }
  }
}
