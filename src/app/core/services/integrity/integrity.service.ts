import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ContractIntegrity,
  ContractIntegrityVerify,
} from '../../models/integrity/contract-integrity.model';

@Injectable({ providedIn: 'root' })
export class IntegrityService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.backendUrl;

  verify(hash: string): Observable<ContractIntegrityVerify> {
    return this.http.get<ContractIntegrityVerify>(
      `${this.api}/public/verify/${encodeURIComponent(hash.trim())}`
    );
  }

  getForContract(contractId: string): Observable<ContractIntegrity> {
    return this.http.get<ContractIntegrity>(
      `${this.api}/contracts/${contractId}/integrity`
    );
  }
}
