import { Component, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiProgressBarComponent } from '../../../shared/ui/progress-bar/progress-bar.component';
import { AuthService } from '../../../core/services/auth.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { ImprovementTip } from '../../../core/models/farm/farm-dashboard.model';

@Component({
  selector: 'app-farm-dashboard',
  imports: [TranslatePipe, RouterLink, UiLanguageToggleComponent, UiThemeToggleComponent, UiProgressBarComponent],
  templateUrl: './farm-dashboard.component.html',
  styleUrl: './farm-dashboard.component.scss',
})
export class FarmDashboardComponent {
  private readonly farmService = inject(FarmService);
  private readonly authService = inject(AuthService);
  readonly currentUser = this.authService.currentUser;

  readonly dashData = toSignal(this.farmService.getDashboard());

  readonly showImproveModal = signal(false);

  readonly riskColor = computed(() => {
    const score = this.dashData()?.riskScore ?? 0;
    if (score >= 75) return 'green';
    if (score >= 50) return 'yellow';
    return 'red';
  });

  readonly riskIcon = computed(() => {
    const color = this.riskColor();
    return color === 'green' ? 'verified' : color === 'yellow' ? 'warning' : 'dangerous';
  });

  readonly riskLabel = computed(() => {
    const color = this.riskColor();
    return color === 'green' ? 'High Health' : color === 'yellow' ? 'Moderate' : 'Low Health';
  });

  readonly riskIconBg = computed(() => {
    const color = this.riskColor();
    return color === 'green' ? 'bg-success-green' : color === 'yellow' ? 'bg-warning-orange' : 'bg-error';
  });

  readonly riskBadgeBg = computed(() => {
    const color = this.riskColor();
    return color === 'green'
      ? 'bg-secondary-container text-on-secondary-container'
      : color === 'yellow'
        ? 'bg-tertiary-container text-on-tertiary-container'
        : 'bg-error-container text-on-error-container';
  });

  readonly firstLetter = (name: string): string => name?.charAt(0)?.toUpperCase() ?? '?';

  readonly statusBadgeClass = (status: string): string => {
    switch (status) {
      case 'Proposed':
      case 'Accepted':
        return 'bg-secondary-container text-on-secondary-container';
      case 'Rejected':
        return 'bg-surface-container-highest text-on-surface-variant';
      case 'Expired':
        return 'bg-error-container text-on-error-container';
      default:
        return 'bg-surface-container-highest text-on-surface-variant';
    }
  };

  readonly statusLabelKey = (status: string): string => {
    switch (status) {
      case 'Proposed':
        return 'farm.dashboard.statusNegotiating';
      case 'Accepted':
        return 'farm.dashboard.statusMatching';
      case 'Rejected':
        return 'farm.dashboard.statusOnHold';
      case 'Expired':
        return 'farm.dashboard.statusExpired';
      default:
        return 'farm.dashboard.statusOnHold';
    }
  };

  readonly actionLabelKey = (status: string): string => {
    switch (status) {
      case 'Proposed':
      case 'Accepted':
        return 'farm.dashboard.review';
      default:
        return 'farm.dashboard.details';
    }
  };

  readonly severityColor = (severity: string): string => {
    switch (severity) {
      case 'high':
        return 'bg-error-container text-on-error-container';
      case 'medium':
        return 'bg-tertiary-container text-on-tertiary-container';
      case 'low':
        return 'bg-secondary-container text-on-secondary-container';
      default:
        return 'bg-surface-container-high text-on-surface-variant';
    }
  };

  readonly severityIcon = (severity: string): string => {
    switch (severity) {
      case 'high':
        return 'priority_high';
      case 'medium':
        return 'remove';
      case 'low':
        return 'check';
      default:
        return '';
    }
  };

  readonly sortedTips = computed<ImprovementTip[]>(() => {
    const tips = this.dashData()?.improvementTips ?? [];
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...tips].sort((a, b) => (order[a.severity] ?? 0) - (order[b.severity] ?? 0));
  });

  openImproveModal(): void {
    this.showImproveModal.set(true);
  }

  closeImproveModal(): void {
    this.showImproveModal.set(false);
  }

  constructor(title: Title) {
    title.setTitle('NileChain - Farm Dashboard');
  }
}
