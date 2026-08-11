import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { of } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { AgentService } from '../../../core/services/agent/agent.service';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import {
  AgentRequest,
  GenerateContractRequest,
  MatchResult,
} from '../../../core/models/agent/agent.model';
import { readAgentSession } from '../../../core/utils/agent-session';

type ContractStatus = 'draft' | 'ready' | 'approved';

@Component({
  selector: 'app-contract-signing',
  standalone: true,
  imports: [
    TranslatePipe,
    UiLoaderComponent,
    UiErrorStateComponent,
    AppTopBarComponent,
    FormsModule,
  ],
  templateUrl: './contract-signing.component.html',
})
export class ContractSigningComponent implements OnInit {
  private readonly agentService = inject(AgentService);
  private readonly factoryService = inject(FactoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly contractText = signal<string | null>(null);
  readonly status = signal<ContractStatus>('draft');
  readonly contractId = signal<string | null>(null);

  factoryName = '';
  requestId: string | null = null;
  farmId: string | null = null;
  farmName = '';
  matchId: string | null = null;

  readonly statusSteps: { id: ContractStatus; labelKey: string }[] = [
    { id: 'draft', labelKey: 'contractSign.statusDraft' },
    { id: 'ready', labelKey: 'contractSign.statusReady' },
    { id: 'approved', labelKey: 'contractSign.statusApproved' },
  ];

  private agentRequest: AgentRequest | null = null;
  private selectedFarm: MatchResult | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.requestId = params.get('requestId');
      this.farmId = params.get('farmId');
      this.farmName = params.get('farmName') ?? '';
      this.matchId = params.get('matchId');
      this.hydrateFromSession();
    });

    this.factoryService.getProfile().subscribe({
      next: (profile) => {
        if (!this.factoryName) {
          this.factoryName = profile.name;
        }
      },
    });
  }

  keyTerms(): string[] {
    const terms: string[] = [];
    if (this.agentRequest) {
      terms.push(this.agentRequest.cropType);
      terms.push(`${this.agentRequest.quantityTons} t`);
      terms.push(`${this.agentRequest.pricePerTon} EGP/t`);
    }
    if (this.farmName) {
      terms.push(this.farmName);
    }
    if (this.factoryName) {
      terms.push(this.factoryName);
    }
    return terms;
  }

  stepIndex(status: ContractStatus): number {
    return this.statusSteps.findIndex((s) => s.id === status);
  }

  private hydrateFromSession(): void {
    const session = readAgentSession();
    if (!session) {
      return;
    }

    this.agentRequest = session.agentRequest;
    if (this.requestId && session.requestId !== this.requestId) {
      return;
    }

    const match =
      session.response.topMatches.find((m) => m.farmId === this.farmId) ??
      session.response.topMatches[0] ??
      null;

    if (match) {
      this.selectedFarm = match;
      this.farmName = match.farmName;
      this.farmId = match.farmId;
      if (match.matchId) {
        this.matchId = match.matchId;
      }
    }
  }

  generate(): void {
    if (!this.agentRequest) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);
      this.agentRequest = {
        cropType: 'Wheat',
        quantityTons: 100,
        qualitySpecs: '',
        pricePerTon: 10000,
        deliveryDate: tomorrow.toISOString().slice(0, 10),
        factoryGovernorate: 'Giza',
      };
    }

    if (!this.selectedFarm) {
      if (!this.farmId || !this.farmName) {
        this.error.set(this.i18n.instant('contractSign.needFarm'));
        return;
      }
      this.selectedFarm = {
        farmId: this.farmId,
        farmName: this.farmName,
        governorate: '',
        matchScore: 0,
        riskScore: 0,
        riskLevel: 'Unknown',
        isVerified: false,
        cropTypes: [],
      };
    }

    if (!this.factoryName.trim()) {
      this.error.set(this.i18n.instant('contractSign.needFactoryName'));
      return;
    }

    const payload: GenerateContractRequest = {
      agentRequest: this.agentRequest,
      selectedFarm: this.selectedFarm,
      factoryName: this.factoryName,
      matchId: this.matchId ?? undefined,
    };

    this.loading.set(true);
    this.error.set(null);
    this.agentService
      .generateContract(payload)
      .pipe(
        switchMap((result) => {
          this.contractText.set(result.contractText);
          if (result.contractId) {
            this.contractId.set(result.contractId);
            return of(result);
          }
          if (this.matchId) {
            return this.factoryService
              .persistContract(this.matchId, result.contractText)
              .pipe(
                switchMap((persisted) => {
                  this.contractId.set(persisted.contractId);
                  return of(result);
                })
              );
          }
          return of(result);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.status.set('ready');
          this.toast.success(this.i18n.instant('contractSign.generateSuccess'));
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            (typeof err?.error === 'string' ? err.error : null) ||
            this.i18n.instant('contractSign.generateFailed');
          this.error.set(message);
        },
      });
  }

  approve(): void {
    const id = this.contractId();
    if (!id) {
      this.status.set('approved');
      this.toast.success(this.i18n.instant('contractSign.approveSuccess'));
      return;
    }
    this.loading.set(true);
    this.factoryService
      .approveContract(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.status.set('approved');
          this.toast.success(this.i18n.instant('contractSign.approveSuccess'));
        },
        error: () =>
          this.error.set(this.i18n.instant('contractSign.generateFailed')),
      });
  }

  requestChanges(): void {
    const id = this.contractId();
    if (!id) {
      this.status.set('draft');
      this.toast.info(this.i18n.instant('contractSign.changesRequested'));
      return;
    }
    this.loading.set(true);
    this.factoryService
      .rejectContract(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.status.set('draft');
          this.toast.info(this.i18n.instant('contractSign.changesRequested'));
        },
        error: () =>
          this.error.set(this.i18n.instant('contractSign.generateFailed')),
      });
  }

  download(): void {
    const id = this.contractId();
    if (id) {
      this.factoryService.downloadContractPdf(id).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `contract-${id}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          this.toast.success(
            this.i18n.instant('contractSign.downloadSuccess')
          );
        },
        error: () => this.downloadTextFallback(),
      });
      return;
    }
    this.downloadTextFallback();
  }

  private downloadTextFallback(): void {
    const text = this.contractText();
    if (!text) {
      return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-${this.requestId ?? 'draft'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success(this.i18n.instant('contractSign.downloadSuccess'));
  }
}
