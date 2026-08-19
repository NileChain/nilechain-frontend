import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

export interface SigningOtpRequestResult {
  expiresAt: string;
}

export interface SigningOtpDialogOptions<T> {
  requestOtp: () => Observable<SigningOtpRequestResult>;
  sign: (otpCode: string) => Observable<T>;
}

@Injectable({ providedIn: 'root' })
export class SigningOtpDialogService {
  readonly open = signal(false);
  readonly options = signal<SigningOtpDialogOptions<unknown> | null>(null);

  private resolver: ((value: unknown) => void) | null = null;
  private rejecter: ((reason: unknown) => void) | null = null;

  prompt<T>(options: SigningOtpDialogOptions<T>): Promise<T | null> {
    if (this.resolver) {
      this.resolver(null);
      this.resolver = null;
      this.rejecter = null;
    }

    this.options.set(options as SigningOtpDialogOptions<unknown>);
    this.open.set(true);
    document.body.classList.add('overflow-hidden');

    return new Promise<T | null>((resolve, reject) => {
      this.resolver = (value) => resolve(value as T | null);
      this.rejecter = (reason) => reject(reason);
    });
  }

  resolve(value: unknown): void {
    this.close();
    const resolve = this.resolver;
    this.resolver = null;
    this.rejecter = null;
    resolve?.(value);
  }

  fail(reason: unknown): void {
    this.close();
    const reject = this.rejecter;
    this.resolver = null;
    this.rejecter = null;
    reject?.(reason);
  }

  cancel(): void {
    this.resolve(null);
  }

  private close(): void {
    this.open.set(false);
    document.body.classList.remove('overflow-hidden');
    this.options.set(null);
  }
}
