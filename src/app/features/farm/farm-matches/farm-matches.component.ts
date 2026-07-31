import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { AuthService } from '../../../core/services/auth.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { FarmMatchItem } from '../../../core/models/farm/farm-match.model';
import { CropType } from '../../../core/models/farm/farm-profile.model';

@Component({
  selector: 'app-farm-matches',
  standalone: true,
  imports: [
    TranslatePipe,
    SidebarFarmComponent,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiLoaderComponent,
    FormsModule,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './farm-matches.component.html',
})
export class FarmMatchesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly farmService = inject(FarmService);
  readonly currentUser = this.authService.currentUser;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly matches = signal<FarmMatchItem[]>([]);
  readonly cropTypes = signal<CropType[]>([]);
  readonly respondingId = signal<string | null>(null);

  statusFilter = '';
  cropTypeFilter = '';

  ngOnInit(): void {
    this.farmService.getCropTypes().subscribe({
      next: (crops) => this.cropTypes.set(crops),
    });
    this.loadMatches();
  }

  loadMatches(): void {
    this.loading.set(true);
    this.error.set(null);
    this.farmService
      .getMatches(this.statusFilter || null, this.cropTypeFilter || null)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.matches.set(items),
        error: () => this.error.set('Failed to load matches.'),
      });
  }

  resetFilters(): void {
    this.statusFilter = '';
    this.cropTypeFilter = '';
    this.loadMatches();
  }

  riskTone(score: number | null): 'safe' | 'risk' {
    return score != null && score >= 70 ? 'safe' : 'risk';
  }

  respond(matchId: string, action: 'accept' | 'reject'): void {
    this.respondingId.set(matchId);
    this.farmService
      .respondToMatch(matchId, action)
      .pipe(finalize(() => this.respondingId.set(null)))
      .subscribe({
        next: () => this.loadMatches(),
        error: () => this.error.set(`Failed to ${action} match.`),
      });
  }
}
