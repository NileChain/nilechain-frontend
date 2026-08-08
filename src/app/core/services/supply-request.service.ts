import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  PendingSupplyRequest,
  savePendingSupplyRequest,
} from '../utils/agent-session';

export interface CreateSupplyRequestPayload {
  crop: string;
  quantity: number;
  price: number;
  deliveryDate: string;
  quality: string;
  selectedGovernorates: string[];
}

export interface CreateSupplyRequestResult {
  requestId: string;
}

@Injectable({ providedIn: 'root' })
export class SupplyRequestService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/factory/requests`;

  createRequest(
    payload: CreateSupplyRequestPayload
  ): Observable<CreateSupplyRequestResult> {
    return this.http
      .post<CreateSupplyRequestResult | { requestId: string; id?: string }>(
        this.api,
        payload
      )
      .pipe(
        map((res) => {
          const requestId =
            'requestId' in res && res.requestId
              ? res.requestId
              : 'id' in res && res.id
                ? res.id!
                : '';
          if (!requestId) {
            throw new Error('Server did not return a requestId.');
          }
          this.persistPending(requestId, payload);
          return { requestId };
        })
      );
  }

  private persistPending(
    requestId: string,
    payload: CreateSupplyRequestPayload
  ): void {
    const pending: PendingSupplyRequest = {
      requestId,
      crop: payload.crop,
      quantity: payload.quantity,
      price: payload.price,
      deliveryDate: payload.deliveryDate,
      quality: payload.quality,
      selectedGovernorates: payload.selectedGovernorates,
    };
    savePendingSupplyRequest(pending);
  }
}
