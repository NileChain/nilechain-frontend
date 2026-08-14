import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { resolveApiErrorMessage } from '../../../core/utils/api-error.util';

export interface ContractChangesApplied {
  contractId: string;
  generatedText: string;
  status: string;
}

@Component({
  selector: 'app-contract-request-changes',
  standalone: true,
  imports: [TranslatePipe, FormsModule],
  template: `
    <div class="space-y-3 text-sm">
      @if (!open()) {
        <button
          type="button"
          class="ui-btn-ghost w-full"
          [disabled]="busy() || !enabled"
          (click)="open.set(true)"
        >
          {{ 'contractChanges.request' | translate }}
        </button>
      } @else {
        <div class="rounded-lg border border-outline-variant bg-surface-container-low p-3 space-y-3">
          <p class="font-semibold">{{ 'contractChanges.title' | translate }}</p>
          <p class="text-xs text-on-surface-variant">
            {{ 'contractChanges.hint' | translate }}
          </p>
          <textarea
            class="ui-input w-full min-h-[7rem]"
            rows="5"
            [(ngModel)]="instructions"
            [attr.placeholder]="'contractChanges.placeholder' | translate"
            [disabled]="busy()"
          ></textarea>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="ui-btn-primary flex-1"
              [disabled]="busy() || instructions.trim().length < 3"
              (click)="submit()"
            >
              {{
                busy()
                  ? ('contractChanges.applying' | translate)
                  : ('contractChanges.apply' | translate)
              }}
            </button>
            <button
              type="button"
              class="ui-btn-ghost"
              [disabled]="busy()"
              (click)="cancel()"
            >
              {{ 'common.cancel' | translate }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ContractRequestChangesComponent {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  @Input({ required: true }) portal: 'factory' | 'farm' = 'factory';
  @Input({ required: true }) contractId = '';
  @Input() enabled = true;

  @Output() readonly applied = new EventEmitter<ContractChangesApplied>();

  readonly open = signal(false);
  readonly busy = signal(false);
  instructions = '';

  cancel(): void {
    this.open.set(false);
    this.instructions = '';
  }

  submit(): void {
    const text = this.instructions.trim();
    if (!this.contractId || text.length < 3) {
      return;
    }
    this.busy.set(true);
    this.http
      .post<ContractChangesApplied>(
        `${environment.backendUrl}/${this.portal}/contracts/${this.contractId}/request-changes`,
        { instructions: text }
      )
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (res) => {
          this.toast.success(this.i18n.instant('contractChanges.success'));
          this.cancel();
          this.applied.emit(res);
        },
        error: (err) =>
          this.toast.error(
            resolveApiErrorMessage(err, this.i18n, {
              fallbackKey: 'contractChanges.failed',
            }).message
          ),
      });
  }
}
