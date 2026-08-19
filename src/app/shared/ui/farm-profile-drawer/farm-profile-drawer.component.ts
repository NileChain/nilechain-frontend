import { UiDatePipe } from '../../../core/pipes/ui-date.pipe';
import { DecimalPipe } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import * as L from 'leaflet';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { GovLabelPipe } from '../../../core/pipes/gov-label.pipe';
import { FarmPublicProfileService } from '../../../core/services/factory/farm-public-profile.service';
import { TranslateService } from '../../../core/services/translate.service';
import { FarmPublicProfileDto } from '../../../core/models/factory/farm-public-profile.model';
import {
  captureFocus,
  restoreFocus,
  trapTabKey,
} from '../../a11y/focus-trap';
import { UiSkeletonComponent } from '../skeleton/skeleton.component';
import { UiErrorStateComponent } from '../error-state/error-state.component';
import { UiRiskScoreBadgeComponent } from '../risk-score-badge/risk-score-badge.component';
import {
  EGYPT_MAP_CENTER,
  resolveMapCoords,
} from '../../geo/egypt-governorates';

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
  selector: 'app-farm-profile-drawer',
  standalone: true,
  imports: [
    UiDatePipe, TranslatePipe,
    GovLabelPipe,
    DecimalPipe,
    RouterLink,
    UiSkeletonComponent,
    UiErrorStateComponent,
    UiRiskScoreBadgeComponent,
  ],
  templateUrl: './farm-profile-drawer.component.html',
  styleUrl: './farm-profile-drawer.component.scss',
})
export class FarmProfileDrawerComponent
  implements OnChanges, AfterViewChecked, OnDestroy
{
  @ViewChild('drawerMapHost') mapHost?: ElementRef<HTMLDivElement>;
  @ViewChild('drawerPanel') drawerPanel?: ElementRef<HTMLElement>;
  @ViewChild('drawerClose') drawerClose?: ElementRef<HTMLButtonElement>;

  @Input() open = false;
  @Input() farmId: string | null = null;
  /** When set, shows Message CTA deep-linked to this match thread. */
  @Input() matchId: string | null = null;
  /** When false, Message CTA is hidden (chat only after both parties signed). */
  @Input() canMessage = false;
  @Input() matchRationale: string | null = null;

  @Output() readonly closed = new EventEmitter<void>();

  private readonly api = inject(FarmPublicProfileService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly profile = signal<FarmPublicProfileDto | null>(null);

  private map?: L.Map;
  private marker?: L.Marker;
  private mapNeedsInit = false;
  private mapInitAttempts = 0;
  private loadedFarmId: string | null = null;
  private previousFocus: HTMLElement | null = null;
  private wasOpen = false;
  private needsInitialFocus = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] || changes['farmId']) {
      if (this.open && this.farmId) {
        this.loadProfile(this.farmId);
      }
      if (!this.open) {
        this.destroyMap();
        this.mapNeedsInit = false;
      }
    }

    if (changes['open']) {
      this.syncFocusManagement();
    }
  }

  ngAfterViewChecked(): void {
    if (this.needsInitialFocus && this.open) {
      const closeBtn = this.drawerClose?.nativeElement;
      if (closeBtn) {
        this.needsInitialFocus = false;
        closeBtn.focus();
      }
    }

    if (!this.open || !this.mapNeedsInit || !this.profile()) {
      return;
    }
    if (this.mapInitAttempts >= 20) {
      this.mapNeedsInit = false;
      return;
    }
    const host = this.mapHost?.nativeElement;
    if (!host || host.clientWidth === 0 || host.clientHeight === 0) {
      this.mapInitAttempts += 1;
      return;
    }
    if (this.map && this.map.getContainer() !== host) {
      this.map.remove();
      this.map = undefined;
      this.marker = undefined;
    }
    if (!this.map) {
      this.initMap(host);
    } else {
      this.updateMarker();
      this.map.invalidateSize();
    }
    this.mapNeedsInit = false;
  }

  ngOnDestroy(): void {
    this.destroyMap();
    if (this.wasOpen) {
      restoreFocus(this.previousFocus);
      this.previousFocus = null;
      this.wasOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.close();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.open) {
      return;
    }
    const panelEl = this.drawerPanel?.nativeElement;
    if (!panelEl) {
      return;
    }
    trapTabKey(event, panelEl);
  }

  close(): void {
    this.closed.emit();
  }

  retry(): void {
    if (this.farmId) {
      this.loadedFarmId = null;
      this.loadProfile(this.farmId);
    }
  }

  documentIcon(fileType: string): string {
    const t = (fileType || '').toLowerCase();
    if (t.includes('pdf')) return 'picture_as_pdf';
    if (t.includes('image') || t.includes('png') || t.includes('jpg')) {
      return 'image';
    }
    return 'description';
  }

  private syncFocusManagement(): void {
    if (this.open && !this.wasOpen) {
      this.previousFocus = captureFocus();
      this.needsInitialFocus = true;
    } else if (!this.open && this.wasOpen) {
      this.needsInitialFocus = false;
      restoreFocus(this.previousFocus);
      this.previousFocus = null;
    }
    this.wasOpen = this.open;
  }

  private loadProfile(farmId: string): void {
    if (this.loadedFarmId === farmId && this.profile()) {
      this.mapNeedsInit = true;
      this.mapInitAttempts = 0;
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.profile.set(null);
    this.destroyMap();
    this.mapNeedsInit = false;

    this.api
      .getPublicProfile(farmId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (dto) => {
          this.profile.set(dto);
          this.loadedFarmId = farmId;
          this.mapNeedsInit = true;
          this.mapInitAttempts = 0;
        },
        error: (err) => {
          this.loadedFarmId = null;
          const status = err?.status;
          const key =
            status === 404
              ? 'factory.matches.profileNotFound'
              : 'factory.matches.profileLoadFailed';
          const fallback =
            typeof err?.error === 'string'
              ? err.error
              : err?.error?.message;
          this.error.set(
            status === 404 || !fallback
              ? this.i18n.instant(key)
              : fallback
          );
        },
      });
  }

  private initMap(host: HTMLDivElement): void {
    const p = this.profile();
    if (!p) return;

    const coords =
      resolveMapCoords({
        latitude: p.latitude,
        longitude: p.longitude,
        governorate: p.governorate,
      }) ?? EGYPT_MAP_CENTER;

    this.map = L.map(host, {
      zoomControl: false,
      attributionControl: false,
    }).setView(coords, 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(this.map);

    this.marker = L.marker(coords).addTo(this.map);
    setTimeout(() => this.map?.invalidateSize(), 50);
  }

  private updateMarker(): void {
    const p = this.profile();
    if (!p || !this.map) return;
    const coords =
      resolveMapCoords({
        latitude: p.latitude,
        longitude: p.longitude,
        governorate: p.governorate,
      }) ?? EGYPT_MAP_CENTER;
    if (this.marker) {
      this.marker.setLatLng(coords);
    } else {
      this.marker = L.marker(coords).addTo(this.map);
    }
    this.map.setView(coords, 8);
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.marker = undefined;
    }
  }
}
