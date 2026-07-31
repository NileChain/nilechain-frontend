import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { SidebarFarmComponent } from '../../../shared/components/sidebar-farm/sidebar-farm.component';
import { AuthService } from '../../../core/services/auth.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { FarmDashboard } from '../../../core/models/farm/farm-dashboard.model';

@Component({
  selector: 'app-farm-dashboard',
  imports: [
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    SidebarFarmComponent,
    UiLoaderComponent,
    RouterLink,
    DecimalPipe,
  ],
  templateUrl: './farm-dashboard.component.html',
  styleUrl: './farm-dashboard.component.scss',
})
export class FarmDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly farmService = inject(FarmService);
  readonly currentUser = this.authService.currentUser;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<FarmDashboard | null>(null);

  constructor(title: Title) {
    title.setTitle('NileChain - Farm Dashboard');
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);
    this.farmService
      .getDashboard()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.dashboard.set(data),
        error: () => this.error.set('Failed to load dashboard.'),
      });
  }

  scoreTone(score: number | null | undefined): string {
    if (score == null) {
      return 'bg-surface-container-highest';
    }
    if (score >= 80) {
      return 'bg-success-green';
    }
    if (score >= 60) {
      return 'bg-warning-orange';
    }
    return 'bg-error';
  }
}
