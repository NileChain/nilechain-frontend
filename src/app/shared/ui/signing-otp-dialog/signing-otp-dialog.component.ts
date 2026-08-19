import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SigningOtpDialogService } from '../../../core/services/signing-otp-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import {
  readApiErrorCode,
  resolveApiErrorMessage,
} from '../../../core/utils/api-error.util';
import {
  captureFocus,
  restoreFocus,
  trapTabKey,
} from '../../a11y/focus-trap';

@Component({
  selector: 'ui-signing-otp-dialog',
  standalone: true,
  imports: [TranslatePipe, FormsModule],
  template: `
    @if (dialog.open() && dialog.options()) {
      <div
        class="fixed inset-0 z-[95] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/40"
          (click)="cancel()"
          [attr.aria-label]="'common.close' | translate"
        ></button>

        <div
          #panel
          tabindex="-1"
          class="relative w-full max-w-md rounded-xl bg-surface border border-outline-variant shadow-xl p-6 space-y-4 animate-fade-in outline-none"
        >
          <h2
            [id]="titleId"
            class="font-title-lg text-title-lg text-on-surface font-bold"
          >
            {{ 'signingOtp.title' | translate }}
          </h2>
          <p class="font-body-md text-body-md text-on-surface-variant">
            {{ 'signingOtp.hint' | translate }}
          </p>

          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="ui-btn-secondary"
              [disabled]="sending() || remainingSeconds() > 0"
              (click)="sendCode()"
            >
              {{
                (sentOnce() ? 'signingOtp.resend' : 'signingOtp.send')
                  | translate
              }}
            </button>
            @if (sentOnce()) {
              <span class="font-body-md text-on-surface-variant tabular-nums">
                {{ countdownLabel() }}
              </span>
            }
          </div>

          <div class="space-y-1">
            <label class="font-body-sm text-on-surface-variant" [attr.for]="inputId">
              {{ 'signingOtp.codeLabel' | translate }}
            </label>
            <input
              #otpInput
              [id]="inputId"
              class="ui-input w-full tracking-[0.4em] text-center text-lg"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              [ngModel]="code()"
              (ngModelChange)="onCodeChange($event)"
            />
            @if (inlineError()) {
              <p class="font-body-sm text-error">{{ inlineError() }}</p>
            }
          </div>

          <div class="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" class="ui-btn-secondary" (click)="cancel()">
              {{ 'common.cancel' | translate }}
            </button>
            <button
              type="button"
              class="ui-btn-primary"
              [disabled]="signing() || code().length !== 6"
              (click)="sign()"
            >
              {{ 'signingOtp.sign' | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class UiSigningOtpDialogComponent implements OnDestroy {
  readonly dialog = inject(SigningOtpDialogService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  readonly otpInput = viewChild<ElementRef<HTMLInputElement>>('otpInput');

  readonly titleId = 'ui-signing-otp-title';
  readonly inputId = 'ui-signing-otp-input';

  readonly code = signal('');
  readonly inlineError = signal('');
  readonly sending = signal(false);
  readonly signing = signal(false);
  readonly sentOnce = signal(false);
  readonly remainingSeconds = signal(0);

  private previousFocus: HTMLElement | null = null;
  private wasOpen = false;
  private expiresAtMs = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const isOpen = this.dialog.open();
      if (isOpen && !this.wasOpen) {
        this.reset();
        this.previousFocus = captureFocus();
        queueMicrotask(() => this.panel()?.nativeElement.focus());
      } else if (!isOpen && this.wasOpen) {
        this.clearTimer();
        restoreFocus(this.previousFocus);
        this.previousFocus = null;
      }
      this.wasOpen = isOpen;
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  countdownLabel(): string {
    const total = this.remainingSeconds();
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  onCodeChange(value: string): void {
    const digits = (value ?? '').replace(/\D/g, '').slice(0, 6);
    this.code.set(digits);
    this.inlineError.set('');
  }

  async sendCode(): Promise<void> {
    const options = this.dialog.options();
    if (!options || this.sending() || this.remainingSeconds() > 0) {
      return;
    }
    this.sending.set(true);
    try {
      const result = await firstValueFrom(options.requestOtp());
      this.sentOnce.set(true);
      this.toast.success(this.i18n.instant('signingOtp.sent'));
      const parsed = Date.parse(result?.expiresAt ?? '');
      this.expiresAtMs = Number.isFinite(parsed)
        ? parsed
        : Date.now() + 10 * 60 * 1000;
      this.startTimer();
      queueMicrotask(() => this.otpInput()?.nativeElement.focus());
    } catch (err) {
      this.toast.error(
        resolveApiErrorMessage(err, this.i18n, {
          fallbackKey: 'signingOtp.sendFailed',
        }).message
      );
    } finally {
      this.sending.set(false);
    }
  }

  async sign(): Promise<void> {
    const options = this.dialog.options();
    const otp = this.code();
    if (!options || otp.length !== 6 || this.signing()) {
      return;
    }
    this.signing.set(true);
    this.inlineError.set('');
    try {
      const value = await firstValueFrom(options.sign(otp));
      this.dialog.resolve(value);
    } catch (err) {
      if (isSigningOtpInvalid(err)) {
        this.inlineError.set(
          resolveApiErrorMessage(err, this.i18n, {
            fallbackKey: 'signingOtp.invalid',
          }).message
        );
        this.code.set('');
        queueMicrotask(() => this.otpInput()?.nativeElement.focus());
        return;
      }
      this.dialog.fail(err);
    } finally {
      this.signing.set(false);
    }
  }

  cancel(): void {
    this.dialog.cancel();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialog.open()) {
      this.cancel();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.dialog.open()) {
      return;
    }
    const panelEl = this.panel()?.nativeElement;
    if (!panelEl) {
      return;
    }
    trapTabKey(event, panelEl);
  }

  private reset(): void {
    this.code.set('');
    this.inlineError.set('');
    this.sending.set(false);
    this.signing.set(false);
    this.sentOnce.set(false);
    this.remainingSeconds.set(0);
    this.expiresAtMs = 0;
    this.clearTimer();
  }

  private startTimer(): void {
    this.clearTimer();
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  private tick(): void {
    const remaining = Math.max(
      0,
      Math.ceil((this.expiresAtMs - Date.now()) / 1000)
    );
    this.remainingSeconds.set(remaining);
    if (remaining <= 0) {
      this.clearTimer();
    }
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

function isSigningOtpInvalid(err: unknown): boolean {
  const code = readApiErrorCode(err) ?? '';
  return code.includes('SigningOtp');
}
