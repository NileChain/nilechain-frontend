import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateReviewRequest,
  Review,
} from '../../models/review/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/reviews`;

  create(payload: CreateReviewRequest): Observable<Review> {
    return this.http.post<Review>(this.api, payload);
  }

  listForContract(contractId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.api}/contract/${contractId}`);
  }

  listForTarget(targetId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.api}/target/${targetId}`);
  }
}
