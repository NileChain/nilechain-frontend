import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface RiskReportDto {
  farmId: string;
  farmName: string;
  overallScore: number;
  riskLevel: string;
  profileCompleteness: number;
  certificationScore: number;
  contractHistoryScore: number;
  ratingScore: number;
  aiAnalysis: string;
  recommendation: string;
  ragSourcesUsed: string[];
}

@Injectable({ providedIn: 'root' })
export class RiskReportService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.backendUrl}/farms`;

  getRiskReport(farmId: string): Observable<RiskReportDto> {
    return this.http.get<RiskReportDto>(`${this.api}/${farmId}/risk-report`);
  }
}
