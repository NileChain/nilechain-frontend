import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { AgentService } from '../../../core/services/agent/agent.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import {
  AgentRequest,
  AgentResponse,
  MatchResult,
} from '../../../core/models/agent/agent.model';
import {
  pendingToAgentRequest,
  readPendingSupplyRequest,
} from '../../../core/utils/agent-session';

type PipelineStepStatus = 'pending' | 'active' | 'done';

interface PipelineStep {
  id: string;
  labelKey: string;
  icon: string;
  status: PipelineStepStatus;
}

interface StepActivity {
  labelKey: string;
  descKey: string;
}

interface ActivityRow extends StepActivity {
  status: PipelineStepStatus;
}

/** Presentation-only detail rows per pipeline station (does not drive the agent). */
const STEP_ACTIVITIES: Record<string, StepActivity[]> = {
  retrieve: [
    {
      labelKey: 'factory.progress.actRetrieveProfiles',
      descKey: 'factory.progress.actRetrieveProfilesDesc',
    },
    {
      labelKey: 'factory.progress.actRetrieveFilter',
      descKey: 'factory.progress.actRetrieveFilterDesc',
    },
    {
      labelKey: 'factory.progress.actRetrieveRadius',
      descKey: 'factory.progress.actRetrieveRadiusDesc',
    },
    {
      labelKey: 'factory.progress.actRetrieveShortlist',
      descKey: 'factory.progress.actRetrieveShortlistDesc',
    },
  ],
  score: [
    {
      labelKey: 'factory.progress.actScoreProfiles',
      descKey: 'factory.progress.actScoreProfilesDesc',
    },
    {
      labelKey: 'factory.progress.actScoreCompat',
      descKey: 'factory.progress.actScoreCompatDesc',
    },
    {
      labelKey: 'factory.progress.actScoreCalc',
      descKey: 'factory.progress.actScoreCalcDesc',
    },
    {
      labelKey: 'factory.progress.actScoreMarket',
      descKey: 'factory.progress.actScoreMarketDesc',
    },
    {
      labelKey: 'factory.progress.actScoreFinalize',
      descKey: 'factory.progress.actScoreFinalizeDesc',
    },
  ],
  risk: [
    {
      labelKey: 'factory.progress.actRiskHistory',
      descKey: 'factory.progress.actRiskHistoryDesc',
    },
    {
      labelKey: 'factory.progress.actRiskCerts',
      descKey: 'factory.progress.actRiskCertsDesc',
    },
    {
      labelKey: 'factory.progress.actRiskScore',
      descKey: 'factory.progress.actRiskScoreDesc',
    },
    {
      labelKey: 'factory.progress.actRiskFlags',
      descKey: 'factory.progress.actRiskFlagsDesc',
    },
  ],
  rank: [
    {
      labelKey: 'factory.progress.actRankSort',
      descKey: 'factory.progress.actRankSortDesc',
    },
    {
      labelKey: 'factory.progress.actRankTradeoffs',
      descKey: 'factory.progress.actRankTradeoffsDesc',
    },
    {
      labelKey: 'factory.progress.actRankTop',
      descKey: 'factory.progress.actRankTopDesc',
    },
  ],
  report: [
    {
      labelKey: 'factory.progress.actReportNarrative',
      descKey: 'factory.progress.actReportNarrativeDesc',
    },
    {
      labelKey: 'factory.progress.actReportSources',
      descKey: 'factory.progress.actReportSourcesDesc',
    },
    {
      labelKey: 'factory.progress.actReportPackage',
      descKey: 'factory.progress.actReportPackageDesc',
    },
  ],
};

@Component({
  selector: 'app-agent-progress',
  standalone: true,
  imports: [
    TranslatePipe,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
    AppTopBarComponent,
    FormsModule,
    RouterLink,
    DecimalPipe,
  ],
  templateUrl: './agent-progress.component.html',
  styleUrl: './agent-progress.component.scss',
})
export class AgentProgressComponent implements OnInit, OnDestroy {
  private readonly agentService = inject(AgentService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly response = signal<AgentResponse | null>(null);
  readonly requestId = signal<string | null>(null);
  readonly expandedFarmId = signal<string | null>(null);
  /** UI-only elapsed seconds while the agent run is in flight. */
  readonly elapsedSeconds = signal(0);
  readonly steps = signal<PipelineStep[]>([
    {
      id: 'retrieve',
      labelKey: 'factory.progress.stepRetrieve',
      icon: 'database_search',
      status: 'pending',
    },
    {
      id: 'score',
      labelKey: 'factory.progress.stepScore',
      icon: 'analytics',
      status: 'pending',
    },
    {
      id: 'risk',
      labelKey: 'factory.progress.stepRisk',
      icon: 'shield',
      status: 'pending',
    },
    {
      id: 'rank',
      labelKey: 'factory.progress.stepRank',
      icon: 'leaderboard',
      status: 'pending',
    },
    {
      id: 'report',
      labelKey: 'factory.progress.stepReport',
      icon: 'description',
      status: 'pending',
    },
  ]);

  cropType = 'Wheat';
  quantityTons = 100;
  qualitySpecs = '';
  pricePerTon = 10000;
  deliveryDate = '';
  factoryGovernorate = 'Giza';

  private stepTimer: ReturnType<typeof setInterval> | null = null;
  private elapsedTimer: ReturnType<typeof setInterval> | null = null;
  private runStartedAt: number | null = null;
  /** Last requestId we auto-handled in this component instance (cache hydrate or first run). */
  private handledRequestId: string | null = null;

  ngOnInit(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    this.deliveryDate = tomorrow.toISOString().slice(0, 10);

    this.hydrateFromPending();

    this.route.queryParamMap.subscribe((params) => {
      const id = params.get('requestId');
      this.requestId.set(id);
      if (!id) {
        this.handledRequestId = null;
        return;
      }
      // Same instance / same id: ignore duplicate emissions.
      if (id === this.handledRequestId) {
        return;
      }
      this.handledRequestId = id;
      this.hydrateFromPending(id);

      const cached = this.agentService.getCachedRun(id);
      if (cached) {
        this.applyCachedResult(cached.request, cached.response);
        return;
      }

      // Genuine first visit for this requestId — auto-run once.
      this.runAgent();
    });
  }

  ngOnDestroy(): void {
    this.clearStepTimer();
    this.stopElapsedClock();
  }

  /** Explicit fresh run — clears cache for this requestId then POSTs again. */
  rerunAgent(): void {
    const id = this.requestId();
    if (id) {
      this.agentService.clearCachedRun(id);
    }
    this.runAgent();
  }

  runAgent(): void {
    const id = this.requestId();
    if (!id) {
      this.error.set(this.i18n.instant('factory.progress.needRequestId'));
      return;
    }

    const payload: AgentRequest = {
      cropType: this.cropType,
      quantityTons: this.quantityTons,
      qualitySpecs: this.qualitySpecs,
      pricePerTon: this.pricePerTon,
      deliveryDate: new Date(this.deliveryDate).toISOString(),
      factoryGovernorate: this.factoryGovernorate,
    };

    this.loading.set(true);
    this.error.set(null);
    this.response.set(null);
    this.startStepAnimation();

    this.agentService
      .run(id, payload)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.clearStepTimer();
          this.stopElapsedClock();
        })
      )
      .subscribe({
        next: (result) => {
          this.applyAgentResult(id, payload, result, /*fromError*/ false);
        },
        error: (err) => {
          // FIX: 400 now returns full AgentResponse (trail/partialResult/mode).
          const body = err?.error;
          if (body && typeof body === 'object' && 'orchestratorMode' in body) {
            this.applyAgentResult(
              id,
              payload,
              body as AgentResponse,
              /*fromError*/ true
            );
            return;
          }
          this.resetSteps();
          const message =
            typeof body === 'string'
              ? body
              : body?.errorMessage ||
                body?.message ||
                this.i18n.instant('factory.progress.runFailed');
          this.error.set(message);
        },
      });
  }

  topMatches(): MatchResult[] {
    return this.response()?.topMatches ?? [];
  }

  recommendedMatch(): MatchResult | null {
    const matches = this.topMatches();
    if (!matches.length) {
      return null;
    }
    return [...matches].sort((a, b) => b.matchScore - a.matchScore)[0];
  }

  toggleReasoning(farmId: string): void {
    this.expandedFarmId.update((current) =>
      current === farmId ? null : farmId
    );
  }

  isAgenticMode(mode: string | undefined | null): boolean {
    if (!mode) return false;
    const m = mode.toLowerCase();
    return m.includes('agentic') || m === 'sbgreactorchestrator';
  }

  isFallbackMode(mode: string | undefined | null): boolean {
    if (!mode) return false;
    return mode.toLowerCase().includes('fallback');
  }

  modeBadgeLabel(mode: string | undefined | null): string {
    if (this.isFallbackMode(mode)) {
      return this.i18n.instant('factory.progress.modeFallback');
    }
    if (this.isAgenticMode(mode)) {
      return this.i18n.instant('factory.progress.modeAgentic');
    }
    return `${this.i18n.instant('factory.progress.modeLabel')}: ${mode ?? '—'}`;
  }

  /** idle | running | completed — presentation status for the command header. */
  workflowPhase(): 'idle' | 'running' | 'completed' {
    if (this.loading()) return 'running';
    if (this.response()) return 'completed';
    return 'idle';
  }

  workflowStatusKey(): string {
    switch (this.workflowPhase()) {
      case 'running':
        return 'factory.progress.statusLive';
      case 'completed':
        return 'factory.progress.statusCompleted';
      default:
        return 'factory.progress.statusReady';
    }
  }

  focusedStep(): PipelineStep | null {
    const list = this.steps();
    return (
      list.find((s) => s.status === 'active') ??
      (this.workflowPhase() === 'completed'
        ? list[list.length - 1] ?? null
        : list.find((s) => s.status === 'pending') ?? list[0] ?? null)
    );
  }

  focusedStepDetailKey(): string {
    const step = this.focusedStep();
    if (!step) return 'factory.progress.matchingSupport';
    switch (step.id) {
      case 'retrieve':
        return 'factory.progress.detailRetrieve';
      case 'score':
        return 'factory.progress.detailScore';
      case 'risk':
        return 'factory.progress.detailRisk';
      case 'rank':
        return 'factory.progress.detailRank';
      case 'report':
        return 'factory.progress.detailReport';
      default:
        return 'factory.progress.matchingSupport';
    }
  }

  /** Presentation-only activity rows for the focused pipeline station. */
  activityRows(): ActivityRow[] {
    const step = this.focusedStep();
    if (!step) return [];
    const defs = STEP_ACTIVITIES[step.id] ?? [];
    if (step.status === 'done' || this.workflowPhase() === 'completed') {
      return defs.map((d) => ({ ...d, status: 'done' as const }));
    }
    if (step.status === 'pending') {
      return defs.map((d) => ({ ...d, status: 'pending' as const }));
    }
    // Active: first half completed, one processing, rest pending (UI-only).
    const processingIndex = Math.min(
      Math.max(1, Math.floor(defs.length * 0.4)),
      Math.max(0, defs.length - 1)
    );
    return defs.map((d, i) => ({
      ...d,
      status:
        i < processingIndex
          ? ('done' as const)
          : i === processingIndex
            ? ('active' as const)
            : ('pending' as const),
    }));
  }

  connectorFilled(prevIndex: number): boolean {
    const prev = this.steps()[prevIndex];
    return !!prev && prev.status === 'done';
  }

  private applyAgentResult(
    id: string,
    payload: AgentRequest,
    result: AgentResponse,
    fromError: boolean
  ): void {
    this.markAllStepsDone();
    this.response.set(result);
    this.agentService.setCachedRun(id, payload, result);

    if (result.success) {
      this.error.set(null);
      this.toast.success(this.i18n.instant('factory.progress.runSuccess'));
      return;
    }

    const message =
      result.errorMessage ||
      result.partialReason ||
      this.i18n.instant('factory.progress.runFailed');
    this.error.set(message);
    if (fromError || result.partialResult) {
      this.toast.error(message);
    }
  }

  /** Restore a previous run without calling the API or toasting. */
  private applyCachedResult(
    payload: AgentRequest,
    result: AgentResponse
  ): void {
    this.cropType = payload.cropType;
    this.quantityTons = payload.quantityTons;
    this.qualitySpecs = payload.qualitySpecs;
    this.pricePerTon = payload.pricePerTon;
    if (payload.deliveryDate) {
      this.deliveryDate = payload.deliveryDate.slice(0, 10);
    }
    this.factoryGovernorate = payload.factoryGovernorate;
    this.loading.set(false);
    this.error.set(
      result.success
        ? null
        : result.errorMessage ||
            result.partialReason ||
            null
    );
    this.response.set(result);
    this.markAllStepsDone();
    this.clearStepTimer();
    this.stopElapsedClock();
  }

  private hydrateFromPending(requestId?: string): void {
    const pending = readPendingSupplyRequest();
    if (!pending) {
      return;
    }
    if (requestId && pending.requestId !== requestId) {
      return;
    }
    const agentReq = pendingToAgentRequest(pending);
    this.cropType = agentReq.cropType;
    this.quantityTons = agentReq.quantityTons;
    this.qualitySpecs = agentReq.qualitySpecs;
    this.pricePerTon = agentReq.pricePerTon;
    this.deliveryDate = pending.deliveryDate;
    this.factoryGovernorate = agentReq.factoryGovernorate;
  }

  private startStepAnimation(): void {
    this.resetSteps();
    this.startElapsedClock();
    let index = 0;
    this.steps.update((list) =>
      list.map((step, i) => ({
        ...step,
        status: i === 0 ? 'active' : 'pending',
      }))
    );

    this.stepTimer = setInterval(() => {
      index += 1;
      if (index >= this.steps().length) {
        this.clearStepTimer();
        return;
      }
      this.steps.update((list) =>
        list.map((step, i) => ({
          ...step,
          status: i < index ? 'done' : i === index ? 'active' : 'pending',
        }))
      );
    }, 900);
  }

  private markAllStepsDone(): void {
    this.steps.update((list) =>
      list.map((step) => ({ ...step, status: 'done' as const }))
    );
  }

  private resetSteps(): void {
    this.steps.update((list) =>
      list.map((step) => ({ ...step, status: 'pending' as const }))
    );
  }

  private clearStepTimer(): void {
    if (this.stepTimer) {
      clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
  }

  private startElapsedClock(): void {
    this.stopElapsedClock();
    this.runStartedAt = Date.now();
    this.elapsedSeconds.set(0);
    this.elapsedTimer = setInterval(() => {
      if (!this.runStartedAt) return;
      this.elapsedSeconds.set(
        Math.max(0, Math.floor((Date.now() - this.runStartedAt) / 1000))
      );
    }, 250);
  }

  private stopElapsedClock(): void {
    if (this.elapsedTimer) {
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
  }
}
