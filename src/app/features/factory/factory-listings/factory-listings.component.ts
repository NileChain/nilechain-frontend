import { UiDatePipe } from '../../../core/pipes/ui-date.pipe';
import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { GovLabelPipe } from '../../../core/pipes/gov-label.pipe';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { FarmProfileDrawerComponent } from '../../../shared/ui/farm-profile-drawer/farm-profile-drawer.component';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { TranslateService } from '../../../core/services/translate.service';
import { FarmListing } from '../../../core/models/factory/factory-match.model';
import { CropType } from '../../../core/models/farm/farm-profile.model';
import { EGYPT_GOVERNORATES } from '../../../shared/geo/egypt-governorates';

@Component({
  selector: 'app-factory-listings',
  standalone: true,
  imports: [
    UiDatePipe, TranslatePipe,
    GovLabelPipe,
    AppTopBarComponent,
    UiEmptyStateComponent,
    UiErrorStateComponent,
    UiSkeletonComponent,
    FarmProfileDrawerComponent,
    FormsModule,
    DecimalPipe,
    RouterLink,
  ],
  templateUrl: './factory-listings.component.html',
})
export class FactoryListingsComponent implements OnInit {
  private readonly factoryService = inject(FactoryService);
  private readonly farmService = inject(FarmService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly listings = signal<FarmListing[]>([]);
  readonly cropTypes = signal<CropType[]>([]);
  readonly cropFilter = signal('');
  readonly governorateFilter = signal('');
  readonly profileOpen = signal(false);
  readonly profileFarmId = signal<string | null>(null);

  readonly governorates = EGYPT_GOVERNORATES;

  ngOnInit(): void {
    this.farmService.getCropTypes().subscribe({
      next: (crops) => this.cropTypes.set(crops),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.factoryService
      .getPublishedListings({
        cropTypeId: this.cropFilter() || null,
        governorate: this.governorateFilter() || null,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.listings.set(items ?? []),
        error: () =>
          this.error.set(this.i18n.instant('factory.listings.loadFailed')),
      });
  }

  applyFilters(): void {
    this.load();
  }

  resetFilters(): void {
    this.cropFilter.set('');
    this.governorateFilter.set('');
    this.load();
  }

  openProfile(farmId: string): void {
    this.profileFarmId.set(farmId);
    this.profileOpen.set(true);
  }

  closeProfile(): void {
    this.profileOpen.set(false);
  }
}
