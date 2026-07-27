import { Component, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { AuthService } from '../../../core/services/auth.service';
import { MatchingService } from '../../../core/services/matching.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { FarmMatchItem } from '../../../core/models/farm/farm-match-item.model';

@Component({
  selector: 'app-farm-matches',
  imports: [TranslatePipe, RouterLink, UiLanguageToggleComponent, UiThemeToggleComponent, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './farm-matches.component.html',
})
export class FarmMatchesComponent {
  private readonly matchingService = inject(MatchingService);
  private readonly farmService = inject(FarmService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  readonly matches = signal<FarmMatchItem[]>([]);
  readonly cropTypes = signal<{ cropTypeId: string; name: string }[]>([]);
  readonly loading = signal(true);

  readonly selectedStatus = signal('');
  readonly selectedCropId = signal('');

  readonly filteredMatches = computed(() => {
    const all = this.matches();
    const status = this.selectedStatus();
    const cropId = this.selectedCropId();

    return all.filter(m => {
      const statusMatch = status ? m.status === status : m.status !== 'Rejected';
      const cropMatch = !cropId || m.cropTypeId === cropId;
      return statusMatch && cropMatch;
    });
  });

  constructor(title: Title) {
    title.setTitle('NileChain - Farm Matches');
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.matchingService.getFarmMatches().subscribe(data => {
      this.matches.set(data);
      this.loading.set(false);
    });

    this.farmService.getCropTypes().subscribe(types => {
      this.cropTypes.set(types);
    });
  }

  readonly firstLetter = (name: string): string => name?.charAt(0)?.toUpperCase() ?? '?';

  readonly matchScoreTone = (score: number | null): string => {
    if (score === null) return 'neutral';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  readonly riskScoreTone = (score: number | null): string => {
    if (score === null) return 'neutral';
    if (score >= 70) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  readonly riskScoreLabel = (score: number | null): string => {
    if (score === null) return '—';
    if (score >= 70) return 'Low Risk';
    if (score >= 50) return 'Medium';
    return 'High Risk';
  };

  readonly statusBadgeClass = (status: string): string => {
    switch (status) {
      case 'Proposed':
        return 'bg-secondary-container text-on-secondary-container';
      case 'Accepted':
        return 'bg-primary-container text-on-primary-container';
      case 'Rejected':
        return 'bg-surface-container-highest text-on-surface-variant';
      case 'Expired':
        return 'bg-error-container text-on-error-container';
      default:
        return 'bg-surface-container-highest text-on-surface-variant';
    }
  };

  readonly canRespond = (status: string): boolean => status === 'Proposed';

  readonly statusFilterLabel = (status: string): string => {
    switch (status) {
      case 'Proposed': return 'Proposed';
      case 'Accepted': return 'Accepted';
      case 'Rejected': return 'Rejected';
      case 'Expired': return 'Expired';
      default: return 'Active (no rejected)';
    }
  };

  acceptMatch(matchId: string): void {
    this.matchingService.respondToMatch(matchId, 'accept').subscribe(() => {
      this.matches.update(all =>
        all.map(m => m.matchId === matchId ? { ...m, status: 'Accepted' } : m)
      );
      this.router.navigate(['/farm/contracts']);
    });
  }

  rejectMatch(matchId: string): void {
    this.matchingService.respondToMatch(matchId, 'reject').subscribe({
      next: () => {
        this.matches.update(all =>
          all.map(m => m.matchId === matchId ? { ...m, status: 'Rejected' } : m)
        );
      }
    });
  }
}
