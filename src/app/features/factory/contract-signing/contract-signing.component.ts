import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { resolveApiErrorMessage } from '../../../core/utils/api-error.util';
import {
  ContractChangesApplied,
  ContractRequestChangesComponent,
} from '../../../shared/contracts/contract-request-changes/contract-request-changes.component';
import { ContractDocumentComponent } from '../../../shared/contracts/contract-document/contract-document.component';
import { ContractDocumentModel } from '../../../shared/contracts/models/contract-document.model';
import { detectDocumentDir } from '../../../shared/contracts/contract-text.util';
import { UiPortalHeroComponent } from '../../../shared/ui/portal-hero/portal-hero.component';

type ContractStatus = 'draft' | 'ready' | 'approved';
type ErrorAction = 'generate' | 'approve' | 'reject';

@Component({
  selector: 'app-contract-signing',
  standalone: true,
  imports: [
    TranslatePipe,
    UiLoaderComponent,
    UiErrorStateComponent,
    AppTopBarComponent,
    FormsModule,
    RouterLink,
    ContractRequestChangesComponent,
    ContractDocumentComponent,
    UiPortalHeroComponent,
  ],
  templateUrl: './contract-signing.component.html',
  styleUrl: './contract-signing.component.scss',
})
export class ContractSigningComponent implements OnInit {
  private readonly agentService = inject(AgentService);
  private readonly factoryService = inject(FactoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly errorCode = signal<string | null>(null);
  readonly errorTitleKey = signal('common.errorTitle');
  readonly lastErrorAction = signal<ErrorAction>('generate');
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

  get isWalletError(): boolean {
    const code = this.errorCode() ?? '';
    return code.includes('InsufficientBalance');
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

  /** Structured deed preview for generated text (signing page). */
  previewDocument(): ContractDocumentModel | null {
    const text = this.contractText();
    if (!text?.trim()) {
      return null;
    }

    const req = this.agentRequest;
    return {
      contractId: this.contractId() || '00000000-0000-0000-0000-000000000000',
      matchId: this.matchId,
      status:
        this.status() === 'approved'
          ? 'PendingFarmSignature'
          : this.status() === 'ready'
            ? 'PendingSignature'
            : 'Draft',
      createdAt: new Date().toISOString(),
      factorySigned: this.status() === 'approved',
      farmSigned: false,
      factoryName: this.factoryName || '—',
      farmName: this.farmName || '—',
      cropName: req?.cropType || '—',
      quantityTons: req?.quantityTons ?? 0,
      unit: 'MT',
      pricePerTon: req?.pricePerTon ?? null,
      deliveryDate: req?.deliveryDate ?? null,
      deliveryLocation: req?.factoryGovernorate ?? null,
      qualityRequirements: req?.qualitySpecs?.trim() || null,
      generatedText: text,
      version: '1.0',
      riskScore: this.selectedFarm?.riskScore ?? null,
    };
  }

  previewDir(): 'rtl' | 'ltr' {
    return detectDocumentDir(this.contractText());
  }

  stepIndex(status: ContractStatus): number {
    return this.statusSteps.findIndex((s) => s.id === status);
  }

  retryLastAction(): void {
    const action = this.lastErrorAction();
    if (action === 'approve') {
      this.approve();
      return;
    }
    if (action === 'reject') {
      return;
    }
    this.generate();
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
        this.setError(this.i18n.instant('contractSign.needFarm'), null, 'generate');
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
      this.setError(
        this.i18n.instant('contractSign.needFactoryName'),
        null,
        'generate'
      );
      return;
    }

    const payload: GenerateContractRequest = {
      agentRequest: this.agentRequest,
      selectedFarm: this.selectedFarm,
      factoryName: this.factoryName,
      matchId: this.matchId ?? undefined,
    };

    this.loading.set(true);
    this.clearError();
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
        error: (err) => this.applyHttpError(err, 'generate', 'contractSign.generateFailed'),
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
    this.clearError();
    this.factoryService
      .approveContract(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.status.set('approved');
          this.toast.success(this.i18n.instant('contractSign.approveSuccess'));
        },
        error: (err) =>
          this.applyHttpError(err, 'approve', 'contractSign.approveFailed'),
      });
  }

  onChangesApplied(result: ContractChangesApplied): void {
    if (result.generatedText) {
      this.contractText.set(result.generatedText);
    }
    this.status.set('ready');
    this.clearError();
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

  private applyHttpError(
    err: unknown,
    action: ErrorAction,
    fallbackKey: string
  ): void {
    const resolved = resolveApiErrorMessage(err, this.i18n, {
      fallbackKey,
      mapCode: (code) => {
        if (code.includes('InsufficientBalance')) {
          return this.i18n.instant('wallet.insufficientForDeal');
        }
        if (code.includes('DealValueInvalid')) {
          return this.i18n.instant('wallet.dealValueInvalid');
        }
        return null;
      },
    });

    const titleKey = resolved.code?.includes('InsufficientBalance')
      ? 'contractSign.walletBlockedTitle'
      : 'common.errorTitle';

    this.setError(resolved.message, resolved.code, action, titleKey);
  }

  private setError(
    message: string,
    code: string | null,
    action: ErrorAction,
    titleKey = 'common.errorTitle'
  ): void {
    this.error.set(message);
    this.errorCode.set(code);
    this.errorTitleKey.set(titleKey);
    this.lastErrorAction.set(action);
  }

  private clearError(): void {
    this.error.set(null);
    this.errorCode.set(null);
    this.errorTitleKey.set('common.errorTitle');
  }
}
