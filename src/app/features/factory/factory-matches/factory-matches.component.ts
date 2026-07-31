import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { FactoryMatchItem } from '../../../core/models/factory/factory-match.model';

@Component({
  selector: 'app-factory-matches',
  standalone: true,
  imports: [
    TranslatePipe,
    SidebarFactoryComponent,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiLoaderComponent,
    RouterLink,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './factory-matches.component.html',
})
export class FactoryMatchesComponent implements OnInit {
  private readonly factoryService = inject(FactoryService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly matches = signal<FactoryMatchItem[]>([]);
  readonly requestId = signal<string | null>(null);
  readonly selected = signal<FactoryMatchItem | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const id = params.get('requestId');
      this.requestId.set(id);
      if (id) {
        this.loadMatches(id);
      } else {
        this.matches.set([]);
        this.selected.set(null);
      }
    });
  }

  loadMatches(requestId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.factoryService
      .getRequestMatches(requestId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.matches.set(items);
          this.selected.set(items[0] ?? null);
        },
        error: () => this.error.set('Failed to load factory matches.'),
      });
  }

  select(match: FactoryMatchItem): void {
    this.selected.set(match);
  }

  riskLevel(score: number | null): 'low' | 'medium' | 'high' {
    if (score == null) {
      return 'medium';
    }
    if (score >= 70) {
      return 'low';
    }
    if (score >= 40) {
      return 'medium';
    }
    return 'high';
  }
}
