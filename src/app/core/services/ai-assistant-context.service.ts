import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AiAssistantContextService {
  readonly requestId = signal<string | null>(null);
  readonly matchId = signal<string | null>(null);
  readonly contractId = signal<string | null>(null);
  readonly farmId = signal<string | null>(null);

  set(partial: {
    requestId?: string | null;
    matchId?: string | null;
    contractId?: string | null;
    farmId?: string | null;
  }): void {
    if (partial.requestId !== undefined) this.requestId.set(partial.requestId);
    if (partial.matchId !== undefined) this.matchId.set(partial.matchId);
    if (partial.contractId !== undefined) this.contractId.set(partial.contractId);
    if (partial.farmId !== undefined) this.farmId.set(partial.farmId);
  }
}
