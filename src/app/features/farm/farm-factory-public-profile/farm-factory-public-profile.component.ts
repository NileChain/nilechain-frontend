import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { GovLabelPipe } from '../../../core/pipes/gov-label.pipe';
import { FactoryPublicProfile } from '../../../core/models/farm/factory-public-profile.model';
import { FarmService } from '../../../core/services/farm/farm.service';
import { TranslateService } from '../../../core/services/translate.service';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-farm-factory-public-profile',
  standalone: true,
  imports: [
    TranslatePipe,
    GovLabelPipe,
    AppTopBarComponent,
    UiEmptyStateComponent,
    UiErrorStateComponent,
    UiSkeletonComponent,
    RouterLink,
    DecimalPipe,
  ],
  templateUrl: './farm-factory-public-profile.component.html',
  styleUrl: './farm-factory-public-profile.component.scss',
})
export class FarmFactoryPublicProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly farmService = inject(FarmService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly forbidden = signal(false);
  readonly notFound = signal(false);
  readonly profile = signal<FactoryPublicProfile | null>(null);
  readonly factoryId = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('factoryId');
      this.factoryId.set(id);
      if (id) {
        this.load(id);
      } else {
        this.error.set(this.i18n.instant('farm.factoryProfile.missingId'));
        this.loading.set(false);
      }
    });
  }

  load(factoryId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.forbidden.set(false);
    this.notFound.set(false);
    this.profile.set(null);
    this.farmService
      .getMatchedFactoryPublicProfile(factoryId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.profile.set(data),
        error: (err: HttpErrorResponse) => {
          if (err?.status === 404) {
            this.notFound.set(true);
            return;
          }
          if (err?.status === 403 || err?.status === 400) {
            this.forbidden.set(true);
            return;
          }
          const body = err?.error;
          const code = typeof body === 'object' ? body?.code ?? body?.error : null;
          if (
            typeof code === 'string' &&
            code.includes('FactoryProfileUnavailable')
          ) {
            this.forbidden.set(true);
            return;
          }
          this.error.set(this.i18n.instant('farm.factoryProfile.loadFailed'));
        },
      });
  }
}
