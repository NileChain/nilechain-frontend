import { UiDatePipe } from '../../core/pipes/ui-date.pipe';
import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageTitleService } from '../../core/services/page-title.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { TranslateService } from '../../core/services/translate.service';
import { ToastService } from '../../core/services/toast.service';
import {
  walletLedgerTypeKey,
  walletWithdrawalStatusKey,
} from '../../core/i18n/status-i18n.util';
import {
  WalletBalance,
  WalletService,
  WalletTopUpSession,
} from '../../core/services/wallet/wallet.service';
import { AppTopBarComponent } from '../../shared/components/app-top-bar/app-top-bar.component';
import { UiPortalHeroComponent } from '../../shared/ui/portal-hero/portal-hero.component';
import { UiLoaderComponent } from '../../shared/ui/loader/loader.component';
import { UiCountUpDirective } from '../../shared/directives/ui-count-up.directive';
import { UiAutoAnimateDirective } from '../../shared/directives/ui-auto-animate.directive';

@Component({
  selector: 'app-wallet-page',
  standalone: true,
  imports: [
    UiDatePipe, TranslatePipe,
    DecimalPipe,
    FormsModule,
    AppTopBarComponent,
    UiPortalHeroComponent,
    UiLoaderComponent,
    UiCountUpDirective,
    UiAutoAnimateDirective,
    RouterLink,
  ],
  templateUrl: './wallet-page.component.html',
  styleUrl: './wallet-page.component.scss',
})
export class WalletPageComponent implements OnInit {
  private readonly walletApi = inject(WalletService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly pageTitle = inject(PageTitleService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly acting = signal(false);
  readonly redirecting = signal(false);
  readonly confirming = signal(false);
  readonly wallet = signal<WalletBalance | null>(null);
  readonly pendingTopUp = signal<WalletTopUpSession | null>(null);
  readonly loadError = signal<string | null>(null);

  topUpAmount = 5000;
  withdrawAmount = 500;
  withdrawDest = '';

  get portal(): 'factory' | 'farm' {
    return this.router.url.includes('/farm/') ? 'farm' : 'factory';
  }

  get billingLink(): string {
    return this.portal === 'farm' ? '/farm/billing' : '/factory/billing';
  }

  ngOnInit(): void {
    this.pageTitle.setKey('app.page.wallet');
    if (this.tryConfirmPaymobReturn()) {
      return;
    }
    this.load();
  }

  /** After Paymob Unified Checkout redirect, credit wallet via HMAC-verified confirm. */
  private tryConfirmPaymobReturn(): boolean {
    const params = this.route.snapshot.queryParamMap;
    const hasPaymobReturn =
      params.has('hmac') ||
      params.has('id') ||
      params.has('success') ||
      params.has('topUpId');
    if (!hasPaymobReturn) {
      return false;
    }

    const query: Record<string, string | null> = {};
    params.keys.forEach((key) => {
      query[key] = params.get(key);
    });

    this.confirming.set(true);
    this.loading.set(true);
    this.walletApi
      .confirmPaymobReturn(query, query['hmac'])
      .pipe(
        finalize(() => {
          this.confirming.set(false);
          this.loading.set(false);
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true,
          });
        })
      )
      .subscribe({
        next: (w) => {
          this.wallet.set(w);
          this.toast.info(this.i18n.instant('wallet.topUpToast'));
        },
        error: (err: HttpErrorResponse) => {
          this.toast.error(
            err?.error?.message || this.i18n.instant('wallet.actionFailed')
          );
          this.load();
        },
      });
    return true;
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.walletApi
      .getMine()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (w) => this.wallet.set(w),
        error: (err: HttpErrorResponse) =>
          this.loadError.set(
            err?.error?.message || this.i18n.instant('wallet.loadFailed')
          ),
      });
  }

  startTopUp(): void {
    if (this.topUpAmount <= 0) {
      return;
    }
    this.acting.set(true);
    const returnUrl = `${window.location.origin}/${this.portal}/wallet`;
    this.walletApi
      .startTopUp(this.topUpAmount, returnUrl)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (session) => {
          this.pendingTopUp.set(session);
          if (session.mode === 'Paymob' && session.checkoutUrl) {
            this.redirecting.set(true);
            window.location.href = session.checkoutUrl;
            return;
          }
        },
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message || this.i18n.instant('wallet.actionFailed')
          ),
      });
  }

  completeSimulator(): void {
    const session = this.pendingTopUp();
    if (!session) {
      return;
    }
    this.acting.set(true);
    this.walletApi
      .completeSimulator(session.topUpId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (w) => {
          this.wallet.set(w);
          this.pendingTopUp.set(null);
          this.toast.info(this.i18n.instant('wallet.topUpToast'));
        },
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message || this.i18n.instant('wallet.actionFailed')
          ),
      });
  }

  withdraw(): void {
    if (this.withdrawAmount <= 0) {
      return;
    }
    this.acting.set(true);
    this.walletApi
      .withdraw(
        this.withdrawAmount,
        'BankTransfer',
        this.withdrawDest || undefined
      )
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.toast.info(this.i18n.instant('wallet.withdrawToast'));
          this.load();
        },
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message || this.i18n.instant('wallet.actionFailed')
          ),
      });
  }

  withdrawalStatusKey(status: string): string {
    return walletWithdrawalStatusKey(status);
  }

  ledgerTypeKey(type: string): string {
    return walletLedgerTypeKey(type);
  }
}
