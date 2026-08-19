import { DecimalPipe } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { GovLabelPipe } from '../../../core/pipes/gov-label.pipe';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiPortalHeroComponent } from '../../../shared/ui/portal-hero/portal-hero.component';
import { AgentService } from '../../../core/services/agent/agent.service';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { factoryProgressRiskLabelKey } from '../../../core/i18n/status-i18n.util';
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
/** Decorative UI activity lines for the progress timeline — not live agent telemetry. */
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
    GovLabelPipe,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
    AppTopBarComponent,
    UiPortalHeroComponent,
    FormsModule,
    RouterLink,
    DecimalPipe,
  ],
  templateUrl: './agent-progress.component.html',
  styleUrl: './agent-progress.component.scss',
})
export class AgentProgressComponent implements OnInit, OnDestroy {
  private readonly agentService = inject(AgentService);
  private readonly factoryService = inject(FactoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly host = inject(ElementRef<HTMLElement>);
  /** Inspect a finished station; cleared while the run animation is following live. */
  private readonly pinnedStepId = signal<string | null>(null);

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

  constructor() {
    effect(() => {
      const id = this.focusedStep()?.id;
      if (!id) {
        return;
      }
      queueMicrotask(() => {
        const el = this.host.nativeElement.querySelector(
          `#agent-step-${id}`
        ) as HTMLElement | null;
        const scroller = this.host.nativeElement.querySelector(
          '.ai-command__stepper'
        ) as HTMLElement | null;
        if (!el || !scroller) {
          return;
        }
        const elRect = el.getBoundingClientRect();
        const box = scroller.getBoundingClientRect();
        if (elRect.top < box.top) {
          scroller.scrollTop += elRect.top - box.top;
        } else if (elRect.bottom > box.bottom) {
          scroller.scrollTop += elRect.bottom - box.bottom;
        }
      });
    });
  }

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

  riskLevelLabelKey(level: string): string {
    return factoryProgressRiskLabelKey(level);
  }

  /** Explicit fresh run — clears cache for this requestId then POSTs again. */
  rerunAgent(): void {
    const id = this.requestId();
    if (id) {
      this.agentService.clearCachedRun(id);
    }
    this.runAgent(false);
  }

  runAgent(confirmHighRisk = false): void {
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
      // Egypt calendar date as yyyy-MM-dd (no timezone shift via toISOString()).
      deliveryDate: this.deliveryDate,
      factoryGovernorate: this.factoryGovernorate,
    };
    if (confirmHighRisk) {
      payload.confirmHighRiskWarning = true;
    }

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
          this.applyAgentResult(
            id,
            payload,
            result,
            /*fromError*/ false,
            confirmHighRisk
          );
        },
        error: (err) => {
          // FIX: 400 now returns full AgentResponse (trail/partialResult/mode).
          const body = err?.error;
          if (body && typeof body === 'object' && 'orchestratorMode' in body) {
            this.applyAgentResult(
              id,
              payload,
              body as AgentResponse,
              /*fromError*/ true,
              confirmHighRisk
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

  isTruncated(result: AgentResponse): boolean {
    return (result.totalEligible ?? 0) > (result.topMatches?.length ?? 0);
  }

  truncatedLabel(result: AgentResponse): string {
    const shown = result.topMatches?.length ?? 0;
    const total = result.totalEligible ?? 0;
    return this.i18n.instant('factory.progress.truncatedChip', {
      shown,
      total,
    });
  }

  peekHint(result: AgentResponse) {
    return result.peekHint ?? null;
  }

  peekReasonKey(reason: string | undefined): string {
    switch ((reason ?? '').toLowerCase()) {
      case 'emptyprimary':
        return 'factory.progress.peekEmptyPrimary';
      case 'verified':
        return 'factory.progress.peekVerified';
      case 'higherscore':
        return 'factory.progress.peekHigherScore';
      case 'highertrust':
        return 'factory.progress.peekHigherTrust';
      default:
        return 'factory.progress.peekDefault';
    }
  }

  readonly flexActing = signal(false);

  includePeekFarms(): void {
    const id = this.requestId();
    if (!id || this.flexActing()) return;
    this.flexActing.set(true);
    this.factoryService
      .expandGeo(id)
      .pipe(finalize(() => this.flexActing.set(false)))
      .subscribe({
        next: () => {
          this.toast.info(this.i18n.instant('factory.progress.peekAccepted'));
          this.rerunAgent();
        },
        error: (err) =>
          this.toast.error(
            err?.error?.detail ||
              err?.error?.message ||
              this.i18n.instant('factory.progress.peekFailed')
          ),
      });
  }

  showMoreEligible(): void {
    const id = this.requestId();
    if (!id || this.flexActing()) return;
    this.flexActing.set(true);
    this.factoryService
      .showMoreMatches(id)
      .pipe(finalize(() => this.flexActing.set(false)))
      .subscribe({
        next: () => {
          this.toast.info(this.i18n.instant('factory.progress.showMoreAccepted'));
          this.rerunAgent();
        },
        error: (err) =>
          this.toast.error(
            err?.error?.detail ||
              err?.error?.message ||
              this.i18n.instant('factory.progress.showMoreFailed')
          ),
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
    const pinned = this.pinnedStepId();
    if (pinned && !this.loading()) {
      const found = list.find((s) => s.id === pinned);
      if (found) {
        return found;
      }
    }
    return (
      list.find((s) => s.status === 'active') ??
      (this.workflowPhase() === 'completed'
        ? list[list.length - 1] ?? null
        : list.find((s) => s.status === 'pending') ?? list[0] ?? null)
    );
  }

  selectStep(id: string): void {
    if (this.loading()) {
      return;
    }
    this.pinnedStepId.set(id);
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
    fromError: boolean,
    confirmedHighRisk = false
  ): void {
    this.markAllStepsDone();
    this.response.set(result);
    this.agentService.setCachedRun(id, payload, result);

    if ((result.supersededCount ?? 0) > 0) {
      this.toast.info(
        this.i18n.instant('factory.progress.supersededToast', {
          count: result.supersededCount ?? 0,
        })
      );
    }

    if (result.success) {
      this.error.set(null);
      this.toast.success(this.i18n.instant('factory.progress.runSuccess'));
    } else {
      const message =
        result.errorMessage ||
        result.partialReason ||
        this.i18n.instant('factory.progress.runFailed');
      this.error.set(message);
      if (fromError || result.partialResult) {
        this.toast.error(message);
      }
    }

    const shouldPromptHighRisk =
      (result.success || !!result.partialResult) &&
      !!result.riskWarning?.requiresFactoryConfirmation &&
      !confirmedHighRisk;
    if (shouldPromptHighRisk) {
      void this.promptHighRiskConfirmation();
    }
  }

  private async promptHighRiskConfirmation(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'factory.progress.highRiskTitle',
      bodyKey: 'factory.progress.highRiskBody',
      confirmKey: 'factory.progress.highRiskConfirm',
      cancelKey: 'common.cancel',
      danger: true,
    });
    if (confirmed) {
      this.runAgent(true);
    }
    // Cancel: stay on results without generating a contract.
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
    this.pinnedStepId.set(null);
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
