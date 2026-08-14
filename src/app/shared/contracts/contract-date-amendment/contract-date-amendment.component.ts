import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { resolveApiErrorMessage } from '../../../core/utils/api-error.util';

export interface ContractDateAmendmentState {
  startsAt?: string | null;
  endsAt?: string | null;
  hasPendingDateAmendment?: boolean;
  pendingStartsAt?: string | null;
  pendingEndsAt?: string | null;
  dateAmendmentProposedByUserId?: string | null;
  currentUserId?: string | null;
}

@Component({
  selector: 'app-contract-date-amendment',
  standalone: true,
  imports: [TranslatePipe, FormsModule, DatePipe],
  template: `
    <div class="space-y-3 text-sm">
      <div class="grid grid-cols-2 gap-2">
        <div>
          <p class="text-xs text-on-surface-variant">
            {{ 'contractDates.startsAt' | translate }}
          </p>
          <p class="font-semibold">
            {{
              state?.startsAt
                ? (state!.startsAt | date: 'mediumDate')
                : ('contractDates.pendingSign' | translate)
            }}
          </p>
        </div>
        <div>
          <p class="text-xs text-on-surface-variant">
            {{ 'contractDates.endsAt' | translate }}
          </p>
          <p class="font-semibold">
            {{
              state?.endsAt
                ? (state!.endsAt | date: 'mediumDate')
                : '—'
            }}
          </p>
        </div>
      </div>

      @if (state?.hasPendingDateAmendment) {
        <div class="rounded-lg border border-outline-variant bg-surface-container-low p-3 space-y-2">
          <p class="font-semibold">{{ 'contractDates.pendingTitle' | translate }}</p>
          <p class="text-on-surface-variant">
            {{ 'contractDates.pendingBody' | translate }}
            @if (state?.pendingStartsAt) {
              · {{ 'contractDates.startsAt' | translate }}:
              {{ state!.pendingStartsAt | date: 'mediumDate' }}
            }
            @if (state?.pendingEndsAt) {
              · {{ 'contractDates.endsAt' | translate }}:
              {{ state!.pendingEndsAt | date: 'mediumDate' }}
            }
          </p>
          @if (canRespond) {
            <div class="flex gap-2">
              <button
                type="button"
                class="ui-btn-primary flex-1"
                [disabled]="busy()"
                (click)="accept()"
              >
                {{ 'contractDates.accept' | translate }}
              </button>
              <button
                type="button"
                class="ui-btn-secondary flex-1"
                [disabled]="busy()"
                (click)="reject()"
              >
                {{ 'contractDates.reject' | translate }}
              </button>
            </div>
          } @else {
            <p class="text-xs text-on-surface-variant">
              {{ 'contractDates.awaitingOther' | translate }}
            </p>
          }
        </div>
      } @else if (canPropose) {
        <div class="space-y-2">
          <label class="block space-y-1">
            <span class="text-xs text-on-surface-variant">{{
              'contractDates.newEndsAt' | translate
            }}</span>
            <input
              type="date"
              class="ui-input w-full"
              [(ngModel)]="newEndsAt"
              name="newEndsAt"
            />
          </label>
          <label class="block space-y-1">
            <span class="text-xs text-on-surface-variant">{{
              'contractDates.reason' | translate
            }}</span>
            <input
              type="text"
              class="ui-input w-full"
              [(ngModel)]="reason"
              name="reason"
              [attr.placeholder]="'contractDates.reasonPlaceholder' | translate"
            />
          </label>
          <button
            type="button"
            class="ui-btn-secondary w-full"
            [disabled]="busy() || !newEndsAt"
            (click)="propose()"
          >
            {{ 'contractDates.propose' | translate }}
          </button>
        </div>
      }
    </div>
  `,
})
export class ContractDateAmendmentComponent {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  @Input({ required: true }) portal: 'factory' | 'farm' = 'factory';
  @Input({ required: true }) contractId = '';
  @Input() state: ContractDateAmendmentState | null = null;
  @Input() signed = false;

  @Output() readonly changed = new EventEmitter<void>();

  readonly busy = signal(false);
  newEndsAt = '';
  reason = '';

  get canPropose(): boolean {
    return this.signed && !this.state?.hasPendingDateAmendment;
  }

  get canRespond(): boolean {
    if (!this.state?.hasPendingDateAmendment || !this.state.currentUserId) {
      return false;
    }
    return this.state.dateAmendmentProposedByUserId !== this.state.currentUserId;
  }

  propose(): void {
    if (!this.newEndsAt) return;
    this.busy.set(true);
    this.http
      .post(`${environment.backendUrl}/${this.portal}/contracts/${this.contractId}/date-amendment`, {
        endsAt: this.newEndsAt,
        reason: this.reason || undefined,
      })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.toast.success(this.i18n.instant('contractDates.proposeSuccess'));
          this.newEndsAt = '';
          this.reason = '';
          this.changed.emit();
        },
        error: (err) =>
          this.toast.error(
            resolveApiErrorMessage(err, this.i18n, {
              fallbackKey: 'contractDates.actionFailed',
            }).message
          ),
      });
  }

  accept(): void {
    this.busy.set(true);
    this.http
      .post(
        `${environment.backendUrl}/${this.portal}/contracts/${this.contractId}/date-amendment/accept`,
        {}
      )
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.toast.success(this.i18n.instant('contractDates.acceptSuccess'));
          this.changed.emit();
        },
        error: (err) =>
          this.toast.error(
            resolveApiErrorMessage(err, this.i18n, {
              fallbackKey: 'contractDates.actionFailed',
            }).message
          ),
      });
  }

  reject(): void {
    this.busy.set(true);
    this.http
      .post(
        `${environment.backendUrl}/${this.portal}/contracts/${this.contractId}/date-amendment/reject`,
        {}
      )
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.toast.info(this.i18n.instant('contractDates.rejectSuccess'));
          this.changed.emit();
        },
        error: (err) =>
          this.toast.error(
            resolveApiErrorMessage(err, this.i18n, {
              fallbackKey: 'contractDates.actionFailed',
            }).message
          ),
      });
  }
}
