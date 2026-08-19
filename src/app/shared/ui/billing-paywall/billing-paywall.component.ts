import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { BillingPaywallService } from '../../../core/services/billing-paywall.service';

@Component({
  selector: 'ui-billing-paywall',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (paywall.open()) {
      <div
        class="fixed inset-0 z-[96] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="billing-paywall-title"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/40"
          (click)="paywall.close()"
          [attr.aria-label]="'common.close' | translate"
        ></button>
        <div
          class="relative w-full max-w-md rounded-xl bg-surface border border-outline-variant shadow-xl p-6 space-y-4 animate-fade-in"
        >
          <h2
            id="billing-paywall-title"
            class="font-title-lg text-title-lg text-on-surface font-bold"
          >
            {{ 'billing.paywallTitle' | translate }}
          </h2>
          <p class="font-body-md text-body-md text-on-surface-variant">
            {{ paywallBodyKey() | translate }}
          </p>
          <p class="font-body-sm text-on-surface-variant">
            {{ 'billing.honesty' | translate }}
          </p>
          <div class="flex flex-wrap justify-end gap-2">
            <button type="button" class="ui-btn-ghost" (click)="paywall.close()">
              {{ 'common.close' | translate }}
            </button>
            <button type="button" class="ui-btn-primary" (click)="goBilling()">
              {{ 'billing.upgrade' | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class UiBillingPaywallComponent {
  readonly paywall = inject(BillingPaywallService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  paywallBodyKey(): string {
    return this.paywall.code() === 'Subscription.PlanRequired'
      ? 'billing.planRequired'
      : 'billing.quotaExceeded';
  }

  goBilling(): void {
    this.paywall.close();
    const farm = this.auth.hasAnyRole(['Farm']);
    this.router.navigate([farm ? '/farm/billing' : '/factory/billing']);
  }
}
