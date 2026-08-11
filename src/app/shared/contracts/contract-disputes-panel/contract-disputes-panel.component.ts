import { DatePipe } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import {
  Dispute,
  DisputeType,
} from '../../../core/models/dispute/dispute.model';
import { FarmService } from '../../../core/services/farm/farm.service';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { UiLoaderComponent } from '../../ui/loader/loader.component';

export type DisputePortal = 'farm' | 'factory';

@Component({
  selector: 'app-contract-disputes-panel',
  standalone: true,
  imports: [TranslatePipe, DatePipe, FormsModule, UiLoaderComponent],
  templateUrl: './contract-disputes-panel.component.html',
})
export class ContractDisputesPanelComponent implements OnChanges {
  private readonly farmApi = inject(FarmService);
  private readonly factoryApi = inject(FactoryService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  @Input({ required: true }) portal!: DisputePortal;
  @Input({ required: true }) contractId!: string;
  @Input() canOpen = false;

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly disputes = signal<Dispute[]>([]);
  readonly showForm = signal(false);

  type: DisputeType = 'QualityShortfall';
  description = '';
  evidenceFiles: File[] = [];

  readonly types: DisputeType[] = [
    'QualityShortfall',
    'LateDelivery',
    'QuantityDispute',
    'Other',
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contractId'] || changes['portal']) {
      if (this.contractId) {
        this.load();
      }
    }
  }

  get hasActive(): boolean {
    return this.disputes().some(
      (d) => d.status === 'Open' || d.status === 'UnderReview'
    );
  }

  load(): void {
    if (!this.contractId) {
      return;
    }
    this.loading.set(true);
    this.loadError.set(null);
    const req =
      this.portal === 'farm'
        ? this.farmApi.listDisputes(this.contractId)
        : this.factoryApi.listDisputes(this.contractId);

    req.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (items) => this.disputes.set(items ?? []),
      error: (err: HttpErrorResponse) => {
        this.disputes.set([]);
        this.loadError.set(
          err?.error?.message ?? this.i18n.instant('dispute.loadFailed')
        );
      },
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.evidenceFiles = Array.from(input.files ?? []).slice(0, 5);
  }

  submit(): void {
    const desc = this.description.trim();
    if (!desc) {
      this.toast.error(this.i18n.instant('dispute.descriptionRequired'));
      return;
    }
    if (this.submitting() || this.hasActive) {
      return;
    }

    this.submitting.set(true);
    const req =
      this.portal === 'farm'
        ? this.farmApi.openDispute(
            this.contractId,
            this.type,
            desc,
            this.evidenceFiles
          )
        : this.factoryApi.openDispute(
            this.contractId,
            this.type,
            desc,
            this.evidenceFiles
          );

    req.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => {
        this.toast.success(this.i18n.instant('dispute.opened'));
        this.description = '';
        this.evidenceFiles = [];
        this.showForm.set(false);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.toast.error(
          err?.error?.message ?? this.i18n.instant('dispute.openFailed')
        );
      },
    });
  }

  typeKey(type: string): string {
    return `dispute.type.${type}`;
  }

  statusKey(status: string): string {
    return `dispute.status.${status}`;
  }

  outcomeNote(d: Dispute): string | null {
    if (d.status === 'Resolved' && d.adminNote) {
      return this.i18n.instant('dispute.resolvedFavor', {
        party: d.outcomeFavor,
        note: d.adminNote,
      });
    }
    if (d.status === 'Rejected' && d.adminNote) {
      return this.i18n.instant('dispute.rejectedNote', { note: d.adminNote });
    }
    return d.adminNote;
  }
}
