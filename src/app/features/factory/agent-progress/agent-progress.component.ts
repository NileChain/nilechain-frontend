import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { AgentService } from '../../../core/services/agent/agent.service';
import { AgentRequest, AgentResponse, MatchResult } from '../../../core/models/agent/agent.model';
import { saveAgentSession } from '../../../core/utils/agent-session';

@Component({
  selector: 'app-agent-progress',
  standalone: true,
  imports: [
    TranslatePipe,
    SidebarFactoryComponent,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiLoaderComponent,
    FormsModule,
    RouterLink,
    DecimalPipe,
  ],
  templateUrl: './agent-progress.component.html',
})
export class AgentProgressComponent implements OnInit {
  private readonly agentService = inject(AgentService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly response = signal<AgentResponse | null>(null);
  readonly requestId = signal<string | null>(null);

  cropType = 'Wheat';
  quantityTons = 100;
  qualitySpecs = '';
  pricePerTon = 10000;
  deliveryDate = '';
  factoryGovernorate = 'Giza';

  ngOnInit(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    this.deliveryDate = tomorrow.toISOString().slice(0, 10);

    this.route.queryParamMap.subscribe((params) => {
      const id = params.get('requestId');
      this.requestId.set(id);
    });
  }

  runAgent(): void {
    const id = this.requestId();
    if (!id) {
      this.error.set('requestId query parameter is required.');
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
    this.agentService
      .run(id, payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          this.response.set(result);
          saveAgentSession({
            requestId: id,
            agentRequest: payload,
            response: result,
          });
        },
        error: (err) => {
          const message =
            typeof err?.error === 'string'
              ? err.error
              : err?.error?.message || 'Agent run failed.';
          this.error.set(message);
        },
      });
  }

  topMatches(): MatchResult[] {
    return this.response()?.topMatches ?? [];
  }
}
