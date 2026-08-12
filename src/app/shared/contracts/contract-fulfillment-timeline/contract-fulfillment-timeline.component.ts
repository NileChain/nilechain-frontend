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
  Fulfillment,
  FulfillmentStatus,
} from '../../../core/models/fulfillment/fulfillment.model';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { UiLoaderComponent } from '../../ui/loader/loader.component';

export type FulfillmentPortal = 'farm' | 'factory';

type StepState = 'done' | 'current' | 'upcoming' | 'skipped';

interface FulfillmentStep {
  id: FulfillmentStatus;
  labelKey: string;
  icon: string;
  state: StepState;
  at: string | null;
  optional?: boolean;
}

const FLOW: FulfillmentStatus[] = [
  'Planned',
  'Shipped',
  'Received',
  'QualityChecked',
  'Fulfilled',
];

@Component({
  selector: 'app-contract-fulfillment-timeline',
  standalone: true,
  imports: [TranslatePipe, DatePipe, FormsModule, UiLoaderComponent],
  templateUrl: './contract-fulfillment-timeline.component.html',
  styleUrl: './contract-fulfillment-timeline.component.scss',
})
export class ContractFulfillmentTimelineComponent implements OnChanges {
  private readonly farmApi = inject(FarmService);
  private readonly factoryApi = inject(FactoryService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  @Input({ required: true }) portal!: FulfillmentPortal;
  @Input({ required: true }) contractId!: string;

  readonly loading = signal(false);
  readonly acting = signal(false);
  readonly notFound = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly fulfillment = signal<Fulfillment | null>(null);
  readonly steps = signal<FulfillmentStep[]>([]);
  qualityNotes = '';
  specsMetChoice: '' | 'yes' | 'no' = '';
  specsOutcomeNotes = '';
  shipCarrier = '';
  shipTracking = '';
  shipNotes = '';
  acceptedQuantityTons: number | null = null;
  discountPercent = 0;
  weighedQuantityTons: number | null = null;
  weighbridgeTicketUrl = '';
  rejectReason = 'QualityFail';
  rejectNotes = '';

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
    this.notFound.set(false);
    this.loadError.set(null);
    const req =
      this.portal === 'farm'
        ? this.farmApi.getFulfillment(this.contractId)
        : this.factoryApi.getFulfillment(this.contractId);

    req.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (f) => {
        this.apply(f);
      },
      error: (err: HttpErrorResponse) => {
        this.fulfillment.set(null);
        this.steps.set([]);
        if (err?.status === 404) {
          this.notFound.set(true);
          return;
        }
        this.loadError.set(
          err?.error?.message ||
            this.i18n.instant('fulfillment.loadFailed')
        );
      },
    });
  }

  isVoided(): boolean {
    return this.normalizeStatus(this.fulfillment()?.status) === 'Voided';
  }

  isRejectedAtGate(): boolean {
    return this.normalizeStatus(this.fulfillment()?.status) === 'RejectedAtGate';
  }

  canShip(): boolean {
    return (
      this.portal === 'farm' &&
      this.normalizeStatus(this.fulfillment()?.status) === 'Planned'
    );
  }

  canReceive(): boolean {
    return (
      this.portal === 'factory' &&
      this.normalizeStatus(this.fulfillment()?.status) === 'Shipped'
    );
  }

  canRejectAtGate(): boolean {
    return this.canReceive();
  }

  rejectReasonKey(reason: string): string {
    return `fulfillment.reason${reason}`;
  }

  partyKey(party: string | null | undefined): string {
    return party === 'Factory' ? 'fulfillment.partyFactory' : 'fulfillment.partyFarm';
  }

  canQualityCheck(): boolean {
    return (
      this.portal === 'factory' &&
      this.normalizeStatus(this.fulfillment()?.status) === 'Received'
    );
  }

  canFulfill(): boolean {
    if (this.portal !== 'factory') {
      return false;
    }
    const s = this.normalizeStatus(this.fulfillment()?.status);
    return s === 'Received' || s === 'QualityChecked';
  }

  async ship(): Promise<void> {
    if (!this.canShip() || !this.contractId) {
      return;
    }
    const ok = await this.confirm.confirm({
      titleKey: 'fulfillment.confirmShipTitle',
      bodyKey: 'fulfillment.confirmShipBody',
      confirmKey: 'fulfillment.ship',
      cancelKey: 'common.cancel',
    });
    if (!ok) {
      return;
    }
    this.acting.set(true);
    this.farmApi
      .shipFulfillment(this.contractId, {
        carrier: this.shipCarrier.trim() || undefined,
        trackingNumber: this.shipTracking.trim() || undefined,
        notes: this.shipNotes.trim() || undefined,
      })
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (f) => {
          this.apply(f);
          this.shipCarrier = '';
          this.shipTracking = '';
          this.shipNotes = '';
          this.toast.success(this.i18n.instant('fulfillment.shipSuccess'));
        },
        error: (err: HttpErrorResponse) => {
          this.toast.error(
            err?.error?.message || this.i18n.instant('fulfillment.actionFailed')
          );
        },
      });
  }

  async receive(): Promise<void> {
    if (!this.canReceive() || !this.contractId) {
      return;
    }
    const tons = this.weighedQuantityTons;
    if (tons == null || !(tons > 0)) {
      this.toast.error(this.i18n.instant('fulfillment.weighedQtyHint'));
      return;
    }
    const ok = await this.confirm.confirm({
      titleKey: 'fulfillment.confirmReceiveTitle',
      bodyKey: 'fulfillment.confirmReceiveBody',
      confirmKey: 'fulfillment.receive',
      cancelKey: 'common.cancel',
    });
    if (!ok) {
      return;
    }
    this.acting.set(true);
    this.factoryApi
      .receiveFulfillment(this.contractId, {
        weighedQuantityTons: tons,
        weighbridgeTicketUrl: this.weighbridgeTicketUrl.trim() || undefined,
      })
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (f) => {
          this.apply(f);
          this.toast.success(this.i18n.instant('fulfillment.receiveSuccess'));
        },
        error: (err: HttpErrorResponse) => {
          this.toast.error(
            err?.error?.message || this.i18n.instant('fulfillment.actionFailed')
          );
        },
      });
  }

  async qualityCheck(): Promise<void> {
    if (!this.canQualityCheck() || !this.contractId) {
      return;
    }
    const ok = await this.confirm.confirm({
      titleKey: 'fulfillment.confirmQualityTitle',
      bodyKey: 'fulfillment.confirmQualityBody',
      confirmKey: 'fulfillment.qualityCheck',
      cancelKey: 'common.cancel',
    });
    if (!ok) {
      return;
    }
    const notes = this.qualityNotes.trim();
    const specsMet =
      this.specsMetChoice === 'yes'
        ? true
        : this.specsMetChoice === 'no'
          ? false
          : undefined;
    const specsOutcomeNotes = this.specsOutcomeNotes.trim();
    this.acting.set(true);
    this.factoryApi
      .qualityCheckFulfillment(this.contractId, {
        notes: notes || undefined,
        acceptedQuantityTons: this.acceptedQuantityTons,
        discountPercent: this.discountPercent || 0,
        specsMet,
        specsOutcomeNotes: specsOutcomeNotes || undefined,
      })
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (f) => {
          this.apply(f);
          this.qualityNotes = '';
          this.specsMetChoice = '';
          this.specsOutcomeNotes = '';
          this.acceptedQuantityTons = null;
          this.discountPercent = 0;
          this.toast.success(
            this.i18n.instant('fulfillment.qualityCheckSuccess')
          );
        },
        error: (err: HttpErrorResponse) => {
          this.toast.error(
            err?.error?.message || this.i18n.instant('fulfillment.actionFailed')
          );
        },
      });
  }

  async rejectAtGate(): Promise<void> {
    if (!this.canRejectAtGate() || !this.contractId) {
      return;
    }
    if (this.rejectReason === 'Other' && !this.rejectNotes.trim()) {
      this.toast.error(this.i18n.instant('fulfillment.rejectNotesRequired'));
      return;
    }
    const ok = await this.confirm.confirm({
      titleKey: 'fulfillment.confirmRejectTitle',
      bodyKey: 'fulfillment.rejectedBanner',
      confirmKey: 'fulfillment.rejectAtGate',
      cancelKey: 'common.cancel',
    });
    if (!ok) {
      return;
    }
    this.acting.set(true);
    this.factoryApi
      .rejectAtGate(this.contractId, {
        reason: this.rejectReason,
        notes: this.rejectNotes.trim() || undefined,
      })
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (f) => {
          this.apply(f);
          this.toast.success(this.i18n.instant('fulfillment.rejectAtGateSuccess'));
        },
        error: (err: HttpErrorResponse) => {
          this.toast.error(
            err?.error?.message || this.i18n.instant('fulfillment.actionFailed')
          );
        },
      });
  }

  async fulfill(): Promise<void> {
    if (!this.canFulfill() || !this.contractId) {
      return;
    }
    const ok = await this.confirm.confirm({
      titleKey: 'fulfillment.confirmFulfillTitle',
      bodyKey: 'fulfillment.confirmFulfillBody',
      confirmKey: 'fulfillment.fulfill',
      cancelKey: 'common.cancel',
    });
    if (!ok) {
      return;
    }
    this.acting.set(true);
    this.factoryApi
      .fulfillContract(this.contractId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (f) => {
          this.apply(f);
          this.toast.success(this.i18n.instant('fulfillment.fulfillSuccess'));
        },
        error: (err: HttpErrorResponse) => {
          this.toast.error(
            err?.error?.message || this.i18n.instant('fulfillment.actionFailed')
          );
        },
      });
  }

  private apply(f: Fulfillment): void {
    this.notFound.set(false);
    this.loadError.set(null);
    this.fulfillment.set(f);
    this.steps.set(this.buildSteps(f));
    if (
      this.weighedQuantityTons == null &&
      f.contractedQuantityTons != null &&
      f.contractedQuantityTons > 0
    ) {
      this.weighedQuantityTons = f.contractedQuantityTons;
    }
  }

  private buildSteps(f: Fulfillment): FulfillmentStep[] {
    const status = this.normalizeStatus(f.status);
    const atMap: Record<string, string | null> = {
      Planned: f.plannedShipDate,
      Shipped: f.shippedAt,
      Received: f.receivedAt,
      QualityChecked: f.qualityCheckedAt,
      Fulfilled: f.fulfilledAt,
    };
    const meta: Record<
      string,
      { labelKey: string; icon: string; optional?: boolean }
    > = {
      Planned: {
        labelKey: 'fulfillment.status.Planned',
        icon: 'event',
      },
      Shipped: {
        labelKey: 'fulfillment.status.Shipped',
        icon: 'local_shipping',
      },
      Received: {
        labelKey: 'fulfillment.status.Received',
        icon: 'inventory_2',
      },
      QualityChecked: {
        labelKey: 'fulfillment.status.QualityChecked',
        icon: 'fact_check',
        optional: true,
      },
      Fulfilled: {
        labelKey: 'fulfillment.status.Fulfilled',
        icon: 'task_alt',
      },
    };

    if (status === 'Voided' || status === 'RejectedAtGate') {
      return FLOW.map((id) => ({
        id,
        labelKey: meta[id].labelKey,
        icon: meta[id].icon,
        optional: meta[id].optional,
        state: atMap[id] ? 'done' : 'upcoming',
        at: atMap[id],
      }));
    }

    const currentIdx = FLOW.indexOf(status as FulfillmentStatus);
    const qualitySkipped =
      status === 'Fulfilled' && !f.qualityCheckedAt;

    return FLOW.map((id, idx) => {
      let state: StepState = 'upcoming';
      if (id === 'QualityChecked' && qualitySkipped) {
        state = 'skipped';
      } else if (currentIdx < 0) {
        state = 'upcoming';
      } else if (idx < currentIdx) {
        state = 'done';
      } else if (idx === currentIdx) {
        state = status === 'Fulfilled' ? 'done' : 'current';
      } else if (
        id === 'QualityChecked' &&
        status === 'Fulfilled' &&
        f.qualityCheckedAt
      ) {
        state = 'done';
      } else {
        state = 'upcoming';
      }

      // When Fulfilled after quality check, QualityChecked is before Fulfilled in FLOW
      // so idx < currentIdx already marks it done. Handle Received → Fulfilled skip above.

      return {
        id,
        labelKey: meta[id].labelKey,
        icon: meta[id].icon,
        optional: meta[id].optional,
        state,
        at: atMap[id],
      };
    });
  }

  private normalizeStatus(status: string | null | undefined): string {
    if (!status) {
      return '';
    }
    const raw = status.trim();
    const match = FLOW.find(
      (s) => s.toLowerCase() === raw.toLowerCase()
    );
    if (match) {
      return match;
    }
    if (raw.toLowerCase() === 'voided') {
      return 'Voided';
    }
    if (raw.toLowerCase() === 'rejectedatgate') {
      return 'RejectedAtGate';
    }
    return raw;
  }
}
