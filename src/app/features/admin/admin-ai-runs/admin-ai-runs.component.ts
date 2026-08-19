import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { UiDatePipe } from '../../../core/pipes/ui-date.pipe';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { TranslateService } from '../../../core/services/translate.service';
import { AgentService } from '../../../core/services/agent/agent.service';
import { AgentRunRecord } from '../../../core/models/agent/agent.model';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-ai-runs',
  standalone: true,
  imports: [
    UiDatePipe,
    TranslatePipe,
    AppTopBarComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
  ],
  templateUrl: './admin-ai-runs.component.html',
})
export class AdminAiRunsComponent implements OnInit {
  private readonly agentApi = inject(AgentService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<AgentRunRecord[]>([]);
  readonly page = signal(1);
  readonly totalCount = signal(0);

  readonly pageSize = PAGE_SIZE;
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCount() / PAGE_SIZE))
  );

  /** Runs whose provider reported no usage are left out so the total stays honest. */
  readonly pageCostUsd = computed(() =>
    this.items().reduce((sum, run) => sum + (run.estimatedCostUsd ?? 0), 0)
  );

  readonly pageTokens = computed(() =>
    this.items().reduce(
      (sum, run) => sum + (run.promptTokens ?? 0) + (run.completionTokens ?? 0),
      0
    )
  );

  readonly costCoverage = computed(
    () => this.items().filter((r) => r.estimatedCostUsd != null).length
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.agentApi
      .listRuns(this.page(), PAGE_SIZE)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.items.set(res.items ?? []);
          this.totalCount.set(res.totalCount ?? 0);
        },
        error: (_err: HttpErrorResponse) =>
          this.error.set(this.i18n.instant('admin.aiRuns.loadFailed')),
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.page.set(page);
    this.load();
  }

  totalTokens(run: AgentRunRecord): number | null {
    if (run.promptTokens == null && run.completionTokens == null) return null;
    return (run.promptTokens ?? 0) + (run.completionTokens ?? 0);
  }

  /** Sub-cent costs need more than 2 decimals to be readable at all. */
  formatCost(value: number | null | undefined): string {
    if (value == null) return this.i18n.instant('admin.aiRuns.unknown');
    if (value === 0) return '$0';
    return value < 0.01 ? `$${value.toFixed(6)}` : `$${value.toFixed(4)}`;
  }

  formatMs(value: number | null | undefined): string {
    if (value == null) return this.i18n.instant('admin.aiRuns.unknown');
    return value < 1000 ? `${value} ms` : `${(value / 1000).toFixed(1)} s`;
  }

  formatNumber(value: number | null | undefined): string {
    return value == null
      ? this.i18n.instant('admin.aiRuns.unknown')
      : value.toLocaleString();
  }
}
