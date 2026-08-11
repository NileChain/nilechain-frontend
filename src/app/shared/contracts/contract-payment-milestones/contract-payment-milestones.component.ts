import { DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import {
  PaymentMilestone,
  PaymentMilestoneSchedule,
} from '../../../core/models/payment/payment-milestone.model';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { UiLoaderComponent } from '../../ui/loader/loader.component';

export type PaymentPortal = 'farm' | 'factory';

@Component({
  selector: 'app-contract-payment-milestones',
  standalone: true,
  imports: [TranslatePipe, DatePipe, DecimalPipe, UiLoaderComponent],
  templateUrl: './contract-payment-milestones.component.html',
  styleUrl: './contract-payment-milestones.component.scss',
})
export class ContractPaymentMilestonesComponent implements OnChanges {
  private readonly farmApi = inject(FarmService);
  private readonly factoryApi = inject(FactoryService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  @Input({ required: true }) portal!: PaymentPortal;
  @Input({ required: true }) contractId!: string;

  readonly loading = signal(false);
  readonly acting = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly schedule = signal<PaymentMilestoneSchedule | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contractId'] || changes['portal']) {
      if (this.contractId) {
        this.load();
      }
    }
  }

  load(): void {
    if (!this.contractId) {
      return;
    }
    this.loading.set(true);
    this.loadError.set(null);
    const req =
      this.portal === 'farm'
        ? this.farmApi.getPaymentMilestones(this.contractId)
        : this.factoryApi.getPaymentMilestones(this.contractId);

    req.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (s) => this.schedule.set(s),
      error: (err: HttpErrorResponse) => {
        this.schedule.set(null);
        this.loadError.set(
          err?.error?.message ||
            this.i18n.instant('paymentMilestones.loadFailed')
        );
      },
    });
  }

  canMarkPaid(m: PaymentMilestone): boolean {
    return this.portal === 'factory' && this.normalize(m.status) === 'Pending';
  }

  canConfirmReceived(m: PaymentMilestone): boolean {
    return this.portal === 'farm' && this.normalize(m.status) === 'MarkedPaid';
  }

  statusKey(status: string): string {
    return `paymentMilestones.status.${this.normalize(status)}`;
  }

  async markPaid(m: PaymentMilestone): Promise<void> {
    const ok = await this.confirm.confirm({
      titleKey: 'paymentMilestones.markPaidTitle',
      bodyKey: 'paymentMilestones.markPaidBody',
      confirmKey: 'paymentMilestones.markPaid',
      cancelKey: 'common.cancel',
    });
    if (!ok) {
      return;
    }
    this.acting.set(true);
    this.factoryApi
      .markPaymentMilestonePaid(this.contractId, m.transactionId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (s) => {
          this.schedule.set(s);
          this.toast.info(this.i18n.instant('paymentMilestones.markPaidToast'));
        },
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message ||
              this.i18n.instant('paymentMilestones.actionFailed')
          ),
      });
  }

  async confirmReceived(m: PaymentMilestone): Promise<void> {
    const ok = await this.confirm.confirm({
      titleKey: 'paymentMilestones.confirmReceivedTitle',
      bodyKey: 'paymentMilestones.confirmReceivedBody',
      confirmKey: 'paymentMilestones.confirmReceived',
      cancelKey: 'common.cancel',
    });
    if (!ok) {
      return;
    }
    this.acting.set(true);
    this.farmApi
      .confirmPaymentMilestoneReceived(this.contractId, m.transactionId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (s) => {
          this.schedule.set(s);
          this.toast.info(
            this.i18n.instant('paymentMilestones.confirmReceivedToast')
          );
        },
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message ||
              this.i18n.instant('paymentMilestones.actionFailed')
          ),
      });
  }

  private normalize(status: string | null | undefined): string {
    return (status || '').trim();
  }
}
