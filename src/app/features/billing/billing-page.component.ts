import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { UiDatePipe } from '../../core/pipes/ui-date.pipe';
import { PageTitleService } from '../../core/services/page-title.service';
import { TranslateService } from '../../core/services/translate.service';
import { ToastService } from '../../core/services/toast.service';
import {
  BillingMe,
  BillingMeter,
  BillingService,
} from '../../core/services/billing.service';
import { readApiErrorCode } from '../../core/utils/api-error.util';
import { AppTopBarComponent } from '../../shared/components/app-top-bar/app-top-bar.component';
import { UiPortalHeroComponent } from '../../shared/ui/portal-hero/portal-hero.component';
import { UiLoaderComponent } from '../../shared/ui/loader/loader.component';

@Component({
  selector: 'app-billing-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    UiDatePipe,
    AppTopBarComponent,
    UiPortalHeroComponent,
    UiLoaderComponent,
  ],
  templateUrl: './billing-page.component.html',
  styleUrl: './billing-page.component.scss',
})
export class BillingPageComponent implements OnInit {
  private readonly billing = inject(BillingService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly pageTitle = inject(PageTitleService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly acting = signal(false);
  readonly billingMe = signal<BillingMe | null>(null);
  readonly loadError = signal<string | null>(null);

  get portal(): 'factory' | 'farm' {
    return this.router.url.includes('/farm/') ? 'farm' : 'factory';
  }

  get walletLink(): string {
    return this.portal === 'farm' ? '/farm/wallet' : '/factory/wallet';
  }

  ngOnInit(): void {
    this.pageTitle.setKey('app.page.billing');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.billing
      .getMine()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (me) => this.billingMe.set(me),
        error: () => this.loadError.set(this.i18n.instant('billing.loadFailed')),
      });
  }

  meterLabel(meter: BillingMeter): string {
    if (meter.cap == null) {
      return this.i18n.instant('billing.unlimited');
    }
    return this.i18n.instant('billing.usedOf', {
      used: meter.used,
      cap: meter.cap,
    });
  }

  upgrade(): void {
    this.acting.set(true);
    this.billing
      .subscribe()
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (me) => {
          this.billingMe.set(me);
          this.toast.success(this.i18n.instant('billing.upgraded'));
        },
        error: (err: HttpErrorResponse) => {
          const code = readApiErrorCode(err) ?? '';
          if (code.includes('Insufficient') || code.includes('SubscriptionInsufficient')) {
            this.toast.error(this.i18n.instant('billing.needWallet'));
            return;
          }
          this.toast.error(this.i18n.instant('billing.upgradeFailed'));
        },
      });
  }
}
