import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface WalletLedgerItem {
  ledgerEntryId: string;
  entryType: string;
  amountEgp: number;
  availableAfterEgp: number;
  heldAfterEgp: number;
  description?: string | null;
  createdAt: string;
}

export interface WalletWithdrawal {
  withdrawalId: string;
  amountEgp: number;
  status: string;
  method: string;
  destinationSummary?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface WalletBalance {
  walletId: string;
  ownerType: string;
  ownerId: string;
  availableBalanceEgp: number;
  heldBalanceEgp: number;
  currency: string;
  paymobConfigured: boolean;
  simulatorAvailable: boolean;
  platformFeePercent: number;
  disclaimer: string;
  recentLedger: WalletLedgerItem[];
  recentWithdrawals: WalletWithdrawal[];
}

export interface WalletTopUpSession {
  topUpId: string;
  amountEgp: number;
  status: string;
  mode: 'Paymob' | 'Simulator' | string;
  checkoutUrl?: string | null;
  clientSecret?: string | null;
  disclaimer: string;
  sandboxHint?: string | null;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/wallet`;

  getMine(): Observable<WalletBalance> {
    return this.http.get<WalletBalance>(this.api);
  }

  startTopUp(
    amountEgp: number,
    returnUrl?: string,
    idempotencyKey?: string
  ): Observable<WalletTopUpSession> {
    return this.http.post<WalletTopUpSession>(`${this.api}/top-up`, {
      amountEgp,
      returnUrl: returnUrl ?? null,
      idempotencyKey: idempotencyKey ?? null,
    });
  }

  completeSimulator(topUpId: string): Observable<WalletBalance> {
    return this.http.post<WalletBalance>(
      `${this.api}/top-up/${topUpId}/complete-simulator`,
      {}
    );
  }

  confirmPaymobReturn(
    query: Record<string, string | null | undefined>,
    hmac?: string | null
  ): Observable<WalletBalance> {
    const cleaned: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(query)) {
      cleaned[k] = v ?? null;
    }
    return this.http.post<WalletBalance>(`${this.api}/top-up/confirm-paymob`, {
      hmac: hmac ?? cleaned['hmac'] ?? null,
      query: cleaned,
    });
  }

  withdraw(
    amountEgp: number,
    method = 'BankTransfer',
    destinationSummary?: string
  ): Observable<WalletWithdrawal> {
    return this.http.post<WalletWithdrawal>(`${this.api}/withdraw`, {
      amountEgp,
      method,
      destinationSummary: destinationSummary ?? null,
    });
  }
}
