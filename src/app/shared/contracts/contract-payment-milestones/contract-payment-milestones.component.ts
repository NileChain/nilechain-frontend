import { DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import {
  MockEscrowSession,
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
  imports: [TranslatePipe, DatePipe, DecimalPipe, UiLoaderComponent, RouterLink],
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
  readonly receiptByMilestone = signal<Record<string, File | null>>({});
  readonly checkoutSession = signal<MockEscrowSession | null>(null);

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
    return (
      this.portal === 'factory' &&
      !this.schedule()?.mockGatewayEnabled &&
      this.normalize(m.status) === 'Pending' &&
      !this.schedule()?.paymentsFrozenByDispute
    );
  }

  canMockPay(m: PaymentMilestone): boolean {
    return (
      this.portal === 'factory' &&
      !!this.schedule()?.mockGatewayEnabled &&
      this.normalize(m.status) === 'Pending' &&
      !this.schedule()?.paymentsFrozenByDispute
    );
  }

  canReleaseEscrow(m: PaymentMilestone): boolean {
    return (
      this.portal === 'factory' &&
      !!this.schedule()?.mockGatewayEnabled &&
      this.normalize(m.status) === 'EscrowHeld' &&
      !!m.activeEscrowTransactionId &&
      !this.schedule()?.paymentsFrozenByDispute
    );
  }

  canConfirmReceived(m: PaymentMilestone): boolean {
    return (
      this.portal === 'farm' &&
      this.normalize(m.status) === 'MarkedPaid' &&
      !this.schedule()?.paymentsFrozenByDispute
    );
  }

  statusKey(status: string): string {
    return `paymentMilestones.status.${this.normalize(status)}`;
  }

  closeCheckout(): void {
    this.checkoutSession.set(null);
  }

  async openMockPay(m: PaymentMilestone): Promise<void> {
    this.acting.set(true);
    this.factoryApi
      .createMockPaymentSession(this.contractId, m.transactionId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (session) => this.checkoutSession.set(session),
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message ||
              this.i18n.instant('paymentMilestones.actionFailed')
          ),
      });
  }

  async confirmMockPay(): Promise<void> {
    const session = this.checkoutSession();
    if (!session) {
      return;
    }
    const ok = await this.confirm.confirm({
      titleKey: 'paymentMilestones.mockPayTitle',
      bodyKey: 'paymentMilestones.mockPayBody',
      confirmKey: 'paymentMilestones.mockPayConfirm',
      cancelKey: 'common.cancel',
    });
    if (!ok) {
      return;
    }
    this.acting.set(true);
    this.factoryApi
      .confirmMockPayment(this.contractId, session.escrowTransactionId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (s) => {
          this.schedule.set(s);
          this.checkoutSession.set(null);
          this.toast.info(this.i18n.instant('paymentMilestones.mockPayToast'));
        },
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message ||
              this.i18n.instant('paymentMilestones.actionFailed')
          ),
      });
  }

  async releaseEscrow(m: PaymentMilestone): Promise<void> {
    const escrowId = m.activeEscrowTransactionId;
    if (!escrowId) {
      return;
    }
    const ok = await this.confirm.confirm({
      titleKey: 'paymentMilestones.releaseTitle',
      bodyKey: 'paymentMilestones.releaseBody',
      confirmKey: 'paymentMilestones.release',
      cancelKey: 'common.cancel',
    });
    if (!ok) {
      return;
    }
    this.acting.set(true);
    this.factoryApi
      .confirmEscrowRelease(this.contractId, escrowId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (s) => {
          this.schedule.set(s);
          this.toast.info(this.i18n.instant('paymentMilestones.releaseToast'));
        },
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message ||
              this.i18n.instant('paymentMilestones.actionFailed')
          ),
      });
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
    const receipt = this.receiptByMilestone()[m.transactionId] ?? undefined;
    this.acting.set(true);
    this.factoryApi
      .markPaymentMilestonePaid(this.contractId, m.transactionId, receipt)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (s) => {
          this.schedule.set(s);
          this.receiptByMilestone.update((map) => ({
            ...map,
            [m.transactionId]: null,
          }));
          this.toast.info(this.i18n.instant('paymentMilestones.markPaidToast'));
        },
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message ||
              this.i18n.instant('paymentMilestones.actionFailed')
          ),
      });
  }

  onReceiptSelected(m: PaymentMilestone, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.receiptByMilestone.update((map) => ({
      ...map,
      [m.transactionId]: file,
    }));
  }

  receiptLabel(m: PaymentMilestone): string {
    const file = this.receiptByMilestone()[m.transactionId];
    return file?.name ?? this.i18n.instant('paymentMilestones.receiptChoose');
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
