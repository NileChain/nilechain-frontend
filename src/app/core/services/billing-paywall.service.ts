import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BillingPaywallService {
  readonly open = signal(false);
  readonly code = signal<string | null>(null);

  show(code?: string | null): void {
    this.code.set(code ?? null);
    this.open.set(true);
    document.body.classList.add('overflow-hidden');
  }

  close(): void {
    this.open.set(false);
    this.code.set(null);
    document.body.classList.remove('overflow-hidden');
  }
}
