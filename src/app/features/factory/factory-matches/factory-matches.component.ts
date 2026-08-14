import { DatePipe, DecimalPipe } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import * as L from 'leaflet';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiPortalHeroComponent } from '../../../shared/ui/portal-hero/portal-hero.component';
import { FarmProfileDrawerComponent } from '../../../shared/ui/farm-profile-drawer/farm-profile-drawer.component';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { AiAssistantContextService } from '../../../core/services/ai-assistant-context.service';
import { FactoryMatchItem } from '../../../core/models/factory/factory-match.model';
import { readAgentSession } from '../../../core/utils/agent-session';
import {
  ListSortMode,
  normalizeListSort,
  relativeTimeParts,
} from '../../../shared/list/list-ordering.util';
import { FormsModule } from '@angular/forms';

import {
  EGYPT_MAP_CENTER,
  resolveMapCoords,
} from '../../../shared/geo/egypt-governorates';

/**
 * Leaflet's default Icon.Default URLs break under Angular/Vite bundling
 * (relative marker-icon.png → 404). Point at copied assets instead.
 */
function configureLeafletDefaultIcon(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'leaflet/marker-icon-2x.png',
    iconUrl: 'leaflet/marker-icon.png',
    shadowUrl: 'leaflet/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
  });
}

configureLeafletDefaultIcon();

@Component({
  selector: 'app-factory-matches',
  standalone: true,
  imports: [
    TranslatePipe,
    UiErrorStateComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    AppTopBarComponent,
    UiPortalHeroComponent,
    FarmProfileDrawerComponent,
    RouterLink,
    DatePipe,
    DecimalPipe,
    FormsModule,
  ],
  templateUrl: './factory-matches.component.html',
})
export class FactoryMatchesComponent
  implements OnInit, AfterViewChecked, OnDestroy
{
  @ViewChild('mapHost') mapHost?: ElementRef<HTMLDivElement>;

  private readonly factoryService = inject(FactoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly assistantCtx = inject(AiAssistantContextService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly matches = signal<FactoryMatchItem[]>([]);
  readonly requestId = signal<string | null>(null);
  readonly selected = signal<FactoryMatchItem | null>(null);
  readonly profileOpen = signal(false);
  readonly profileFarmId = signal<string | null>(null);
  readonly profileMatchId = signal<string | null>(null);
  readonly profileCanMessage = signal(false);
  readonly profileRationale = signal<string | null>(null);
  readonly sortMode = signal<ListSortMode>('newest');
  readonly excludingId = signal<string | null>(null);
  readonly counterActionId = signal<string | null>(null);

  private map?: L.Map;
  private markerLayer?: L.LayerGroup;
  private markersByFarmId = new Map<string, L.Marker>();
  private mapNeedsInit = false;
  private sizeFixTimer?: ReturnType<typeof setTimeout>;
  private mapInitAttempts = 0;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const id = params.get('requestId');
      this.requestId.set(id);
      this.assistantCtx.set({ requestId: id, matchId: null, farmId: null });
      if (id) {
        this.loadMatches(id);
      } else {
        this.destroyMap();
        this.matches.set([]);
        this.selected.set(null);
        this.mapNeedsInit = false;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (!this.mapNeedsInit || !this.selected()) {
      return;
    }
    if (this.mapInitAttempts >= 20) {
      this.mapNeedsInit = false;
      return;
    }
    const host = this.mapHost?.nativeElement;
    if (!host || host.clientWidth === 0 || host.clientHeight === 0) {
      return;
    }
    // Rebuild if a prior Leaflet instance is bound to a replaced host element.
    if (this.map && this.map.getContainer() !== host) {
      this.map.remove();
      this.map = undefined;
      this.markerLayer = undefined;
      this.markersByFarmId.clear();
    }
    this.mapNeedsInit = false;
    this.mapInitAttempts += 1;
    this.initOrUpdateMap(this.selected()!);
  }

  ngOnDestroy(): void {
    if (this.sizeFixTimer) {
      clearTimeout(this.sizeFixTimer);
    }
    this.destroyMap();
  }

  loadMatches(requestId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.destroyMap();
    this.factoryService
      .getRequestMatches(requestId, this.sortMode())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.matches.set(items);
          this.selected.set(items[0] ?? null);
          this.syncAssistantContext(items[0] ?? null);
          this.mapInitAttempts = 0;
          if (items[0]) {
            this.scheduleMapInit();
          } else {
            this.mapNeedsInit = false;
          }
        },
        error: () =>
          this.error.set(this.i18n.instant('factory.matches.loadFailed')),
      });
  }

  onSortChange(value: string): void {
    this.sortMode.set(normalizeListSort(value));
    const id = this.requestId();
    if (id) {
      this.loadMatches(id);
    }
  }

  relativeLabel(iso: string | null | undefined): string | null {
    const parts = relativeTimeParts(iso);
    if (!parts) return null;
    return this.i18n.instant(parts.key, parts.params);
  }

  select(match: FactoryMatchItem): void {
    this.selected.set(match);
    this.syncAssistantContext(match);
    this.mapInitAttempts = 0;
    this.scheduleMapInit();
    this.toast.info(
      this.i18n.instant('factory.matches.selectedToast', {
        name: match.farmName,
      })
    );
  }

  openFarmProfile(match: FactoryMatchItem, event?: Event): void {
    event?.stopPropagation();
    this.profileFarmId.set(match.farmId);
    this.profileMatchId.set(match.matchId);
    this.profileCanMessage.set(!!match.canMessage);
    this.profileRationale.set(this.whyMatched(match));
    this.profileOpen.set(true);
  }

  closeFarmProfile(): void {
    this.profileOpen.set(false);
    this.profileMatchId.set(null);
    this.profileCanMessage.set(false);
  }

  whyMatched(match: FactoryMatchItem): string {
    const session = readAgentSession();
    if (
      session?.response.comparisonReport &&
      (!this.requestId() || session.requestId === this.requestId())
    ) {
      return session.response.comparisonReport;
    }
    return this.i18n.instant('factory.matches.whyMatchedFallback', {
      score:
        match.matchScore != null
          ? Math.round(match.matchScore).toString()
          : '—',
      risk:
        match.riskScore != null ? Math.round(match.riskScore).toString() : '—',
    });
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

  riskLevelKey(score: number | null): string {
    return `factory.riskReport.${this.riskLevel(score)}Risk`;
  }

  riskColor(score: number | null): string {
    switch (this.riskLevel(score)) {
      case 'low':
        return 'var(--color-success)';
      case 'medium':
        return 'var(--color-warning)';
      default:
        return 'var(--color-danger)';
    }
  }

  riskGaugePercent(score: number | null): number {
    if (score == null) {
      return 50;
    }
    return Math.max(0, Math.min(100, score));
  }

  async excludeMatch(match: FactoryMatchItem): Promise<void> {
    if (this.excludingId()) {
      return;
    }
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'factory.matches.excludeTitle',
      bodyKey: 'factory.matches.excludeBody',
      confirmKey: 'factory.matches.exclude',
      cancelKey: 'common.cancel',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.excludingId.set(match.matchId);
    this.factoryService
      .excludeMatch(match.matchId)
      .pipe(finalize(() => this.excludingId.set(null)))
      .subscribe({
        next: () => {
          this.matches.update((list) =>
            list.filter((m) => m.matchId !== match.matchId)
          );
          if (this.selected()?.matchId === match.matchId) {
            this.selected.set(this.matches()[0] ?? null);
            this.syncAssistantContext(this.selected());
            if (this.selected()) {
              this.scheduleMapInit();
            } else {
              this.destroyMap();
              this.mapNeedsInit = false;
            }
          }
          this.toast.info(this.i18n.instant('factory.matches.excludedToast'));
        },
        error: () =>
          this.toast.error(this.i18n.instant('factory.matches.excludeFailed')),
      });
  }

  isCountered(match: FactoryMatchItem): boolean {
    return (match.status || '').toLowerCase() === 'countered';
  }

  async acceptCounter(match: FactoryMatchItem): Promise<void> {
    if (this.counterActionId()) return;
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'factory.matches.acceptCounterTitle',
      bodyKey: 'factory.matches.acceptCounterBody',
      confirmKey: 'factory.matches.acceptCounter',
      cancelKey: 'common.cancel',
    });
    if (!confirmed) return;
    this.counterActionId.set(match.matchId);
    this.factoryService
      .acceptCounterOffer(match.matchId)
      .pipe(finalize(() => this.counterActionId.set(null)))
      .subscribe({
        next: () => {
          this.toast.info(this.i18n.instant('factory.matches.acceptCounterToast'));
          const id = this.requestId();
          if (id) this.loadMatches(id);
        },
        error: () =>
          this.toast.error(
            this.i18n.instant('factory.matches.acceptCounterFailed')
          ),
      });
  }

  async rejectCounter(match: FactoryMatchItem): Promise<void> {
    if (this.counterActionId()) return;
    const confirmed = await this.confirmDialog.confirm({
      titleKey: 'factory.matches.rejectCounterTitle',
      bodyKey: 'factory.matches.rejectCounterBody',
      confirmKey: 'factory.matches.rejectCounter',
      cancelKey: 'common.cancel',
      danger: true,
    });
    if (!confirmed) return;
    this.counterActionId.set(match.matchId);
    this.factoryService
      .rejectCounterOffer(match.matchId)
      .pipe(finalize(() => this.counterActionId.set(null)))
      .subscribe({
        next: () => {
          this.toast.info(this.i18n.instant('factory.matches.rejectCounterToast'));
          const id = this.requestId();
          if (id) this.loadMatches(id);
        },
        error: () =>
          this.toast.error(
            this.i18n.instant('factory.matches.rejectCounterFailed')
          ),
      });
  }

  private initOrUpdateMap(match: FactoryMatchItem): void {
    const host = this.mapHost?.nativeElement;
    if (!host) {
      this.mapNeedsInit = true;
      return;
    }

    try {
      const focusCoords = this.resolveCoords(match);

      // Angular may recreate #mapHost after L.map() runs, orphaning the instance
      // on a detached node and leaving a blank gray box in the new host.
      if (this.map && this.map.getContainer() !== host) {
        this.map.remove();
        this.map = undefined;
        this.markerLayer = undefined;
        this.markersByFarmId.clear();
      }

      if (!this.map) {
        host.replaceChildren();
        this.map = L.map(host, { zoomControl: true }).setView(focusCoords, 8);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 18,
        }).addTo(this.map);
        this.markerLayer = L.layerGroup().addTo(this.map);
      }

      this.renderShortlistMarkers(match.farmId);

      // Leaflet often paints blank if invalidateSize runs before layout settles.
      if (this.sizeFixTimer) {
        clearTimeout(this.sizeFixTimer);
      }
      this.sizeFixTimer = setTimeout(() => {
        if (this.map && this.mapHost?.nativeElement === this.map.getContainer()) {
          this.map.invalidateSize();
          this.markersByFarmId.get(match.farmId)?.openPopup();
        } else if (this.selected()) {
          // Host was replaced after init — rebuild on the live element.
          this.mapNeedsInit = true;
          this.initOrUpdateMap(this.selected()!);
        }
      }, 100);
    } catch {
      this.destroyMap();
      this.mapNeedsInit = true;
    }
  }

  /** Markers for all shortlisted farms; selected farm gets an open popup. */
  private renderShortlistMarkers(selectedFarmId: string): void {
    if (!this.map) {
      return;
    }
    if (!this.markerLayer) {
      this.markerLayer = L.layerGroup().addTo(this.map);
    }

    this.markerLayer.clearLayers();
    this.markersByFarmId.clear();

    const bounds: L.LatLngExpression[] = [];
    for (const farm of this.matches()) {
      const coords = this.resolveCoords(farm);
      bounds.push(coords);
      const label = this.markerLabel(farm);
      const marker = L.marker(coords).bindPopup(
        `<strong>${this.escapeHtml(farm.farmName)}</strong><br/>${this.escapeHtml(label)}`
      );
      marker.bindTooltip(label, {
        permanent: farm.farmId === selectedFarmId,
        direction: 'top',
        offset: [0, -36],
      });
      marker.on('click', () => this.select(farm));
      this.markerLayer.addLayer(marker);
      this.markersByFarmId.set(farm.farmId, marker);
    }

    if (bounds.length > 1) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [28, 28], maxZoom: 11 });
    } else if (bounds.length === 1) {
      this.map.setView(bounds[0], 8);
    }

    this.markersByFarmId.get(selectedFarmId)?.openPopup();
  }

  private markerLabel(farm: FactoryMatchItem): string {
    if (farm.distanceKm != null && Number.isFinite(farm.distanceKm)) {
      return this.i18n.instant('factory.matches.distanceKm', {
        km: Math.round(farm.distanceKm).toString(),
      });
    }
    if (farm.usedGovernorateFallback) {
      return this.i18n.instant('factory.matches.governorateFallback');
    }
    return this.i18n.instant('factory.matches.distanceUnknown');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Prefer scheduled init so #mapHost survives Angular's post-CD DOM pass. */
  private scheduleMapInit(): void {
    this.mapNeedsInit = true;
    const delays = [0, 50, 150, 400];
    for (const ms of delays) {
      setTimeout(() => {
        if (!this.mapNeedsInit || !this.selected()) {
          return;
        }
        const host = this.mapHost?.nativeElement;
        if (!host || host.clientWidth === 0 || host.clientHeight === 0) {
          return;
        }
        if (this.map && this.map.getContainer() === host) {
          this.mapNeedsInit = false;
          this.initOrUpdateMap(this.selected()!);
          return;
        }
        this.mapNeedsInit = false;
        this.mapInitAttempts += 1;
        this.initOrUpdateMap(this.selected()!);
      }, ms);
    }
  }

  private resolveCoords(match: FactoryMatchItem): [number, number] {
    return (
      resolveMapCoords({
        latitude: match.farmLatitude,
        longitude: match.farmLongitude,
        governorate: match.farmGovernorate || match.farmLocation,
      }) ?? EGYPT_MAP_CENTER
    );
  }

  private syncAssistantContext(match: FactoryMatchItem | null): void {
    this.assistantCtx.set({
      requestId: this.requestId(),
      matchId: match?.matchId ?? null,
      farmId: match?.farmId ?? null,
    });
  }

  private destroyMap(): void {
    this.map?.remove();
    this.map = undefined;
    this.markerLayer = undefined;
    this.markersByFarmId.clear();
  }
}
