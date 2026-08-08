import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ContractMetadataComponent } from '../contract-metadata/contract-metadata.component';
import { UiEmptyStateComponent } from '../../ui/empty-state/empty-state.component';
import { ContractDocumentModel } from '../models/contract-document.model';
import {
  ContractBodySection,
  contractStatusLabelKey,
  displayText,
  highlightContractHtml,
  parseContractSections,
} from '../contract-text.util';

@Component({
  selector: 'app-contract-document',
  standalone: true,
  imports: [
    TranslatePipe,
    DatePipe,
    ContractMetadataComponent,
    UiEmptyStateComponent,
  ],
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contract'] && this.contract) {
      this.rebuildBody();
    }
  }

  get isFactorySigned(): boolean {
    const s = (this.contract?.status || '').toLowerCase();
    return s === 'pendingsignature' || s === 'signed' || s === 'active';
  }

  get isFarmSigned(): boolean {
    const s = (this.contract?.status || '').toLowerCase();
    return s === 'signed' || s === 'active';
  }

  statusTone(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'signed' || s === 'active' || s === 'completed') return 'success';
    if (s === 'cancelled' || s === 'rejected') return 'danger';
    if (s === 'pendingsignature' || s === 'draft') return 'warning';
    return 'neutral';
  }

  statusLabelKey(status: string): string {
    return contractStatusLabelKey(status);
  }

  locationOf(value: string | null | undefined): string {
    return displayText(value, '');
  }

  shortId(id: string): string {
    return id?.length > 8 ? `${id.slice(0, 8).toUpperCase()}…` : id;
  }

  initials(name: string): string {
    return (name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  htmlFor(sectionId: string, index: number): SafeHtml | null {
    return this.highlighted.get(sectionId)?.[index] ?? null;
  }

  private rebuildBody(): void {
    this.sections = parseContractSections(this.contract.generatedText);
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
