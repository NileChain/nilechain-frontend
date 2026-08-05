import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { AgentService } from '../../../core/services/agent/agent.service';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { MobileNavService } from '../../../core/services/mobile-nav.service';
import {
  AgentRequest,
  GenerateContractRequest,
  MatchResult,
} from '../../../core/models/agent/agent.model';
import { readAgentSession } from '../../../core/utils/agent-session';

@Component({
  selector: 'app-contract-signing',
  standalone: true,
  imports: [
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    FormsModule,
  ],
  templateUrl: './contract-signing.component.html',
})
export class ContractSigningComponent implements OnInit {
  private readonly agentService = inject(AgentService);
  private readonly factoryService = inject(FactoryService);
  private readonly route = inject(ActivatedRoute);
  readonly mobileNav = inject(MobileNavService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly contractText = signal<string | null>(null);

  factoryName = '';
  requestId: string | null = null;
  farmId: string | null = null;
  farmName = '';

  private agentRequest: AgentRequest | null = null;
  private selectedFarm: MatchResult | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.requestId = params.get('requestId');
      this.farmId = params.get('farmId');
      this.farmName = params.get('farmName') ?? '';
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
        deliveryDate: tomorrow.toISOString(),
        factoryGovernorate: 'Giza',
      };
    }

    if (!this.selectedFarm) {
      if (!this.farmId || !this.farmName) {
        this.error.set(
          'Select a farm from agent results first (farmId / farmName required).'
        );
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
      this.error.set('Factory name is required.');
      return;
    }

    const payload: GenerateContractRequest = {
      agentRequest: this.agentRequest,
      selectedFarm: this.selectedFarm,
      factoryName: this.factoryName,
    };

    this.loading.set(true);
    this.error.set(null);
    this.agentService
      .generateContract(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => this.contractText.set(result.contractText),
        error: (err) => {
          const message =
            err?.error?.message ||
            (typeof err?.error === 'string' ? err.error : null) ||
            'Contract generation failed (AI may be unavailable).';
          this.error.set(message);
        },
      });
  }
}
