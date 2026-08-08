import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import * as L from 'leaflet';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import {
  EGYPT_MAP_CENTER,
  EGYPT_MAP_ZOOM,
  PickedLocation,
  nearestGovernorate,
  resolveMapCoords,
} from '../../geo/egypt-governorates';

/**
 * Leaflet's default Icon.Default URLs break under Angular/Vite bundling.
 * Same fix as Factory Matches map.
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

export interface LocationPickerInitial {
  latitude?: number | null;
  longitude?: number | null;
  governorate?: string | null;
}

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [TranslatePipe, DecimalPipe],
  template: `
    <div class="location-picker">
      <div class="location-picker__head">
        <label class="location-picker__label">
          {{ 'locationPicker.label' | translate }}
        </label>
        <p class="location-picker__hint">
          {{ 'locationPicker.hint' | translate }}
        </p>
      </div>

      <div class="location-picker__map-shell">
        <div
          #mapHost
          class="location-picker__map"
          role="application"
          [attr.aria-label]="'locationPicker.label' | translate"
        ></div>

        <button
          type="button"
          class="location-picker__geo-btn"
          (click)="useMyLocation()"
          [disabled]="geoLoading()"
          [attr.aria-busy]="geoLoading()"
          [attr.aria-label]="'locationPicker.useMyLocation' | translate"
          title="{{ 'locationPicker.useMyLocation' | translate }}"
        >
          @if (geoLoading()) {
            <span class="location-picker__spinner" aria-hidden="true"></span>
          } @else {
            <span class="material-symbols-outlined" aria-hidden="true"
              >my_location</span
            >
          }
          <span class="location-picker__geo-label">{{
            'locationPicker.useMyLocation' | translate
          }}</span>
        </button>
      </div>

      @if (geoMessage()) {
        <p class="location-picker__geo-msg" role="status">
          {{ geoMessage() | translate }}
        </p>
      }

      <div class="location-picker__footer" aria-live="polite">
        @if (resolvedGovernorate()) {
          <span class="location-picker__chip">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
              >location_on</span
            >
            <span class="location-picker__gov-ar">{{
              resolvedGovernorateAr()
            }}</span>
            <span class="location-picker__gov-en">{{
              resolvedGovernorate()
            }}</span>
          </span>
          @if (resolvedLat() != null && resolvedLng() != null) {
            <span class="location-picker__coords">
              {{ resolvedLat() | number: '1.4-4' }},
              {{ resolvedLng() | number: '1.4-4' }}
            </span>
          }
        } @else {
          <span class="location-picker__empty">
            {{ 'locationPicker.empty' | translate }}
          </span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .location-picker {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }
      .location-picker__label {
        display: block;
        font-size: 0.875rem;
        font-weight: 650;
        color: var(--color-on-surface-variant, #424940);
        margin-bottom: 0.15rem;
      }
      .location-picker__hint {
        margin: 0;
        font-size: 0.8rem;
        color: var(--color-outline, #72796f);
      }
      .location-picker__map-shell {
        position: relative;
      }
      .location-picker__map {
        width: 100%;
        height: 280px;
        border-radius: 12px;
        border: 1px solid
          color-mix(in srgb, var(--color-outline-variant, #c4c8c0) 80%, transparent);
        overflow: hidden;
        background: var(--color-surface-container-low, #eef1eb);
        box-shadow: inset 0 1px 0 rgb(255 255 255 / 40%);
      }
      .location-picker__geo-btn {
        position: absolute;
        z-index: 500;
        inset-inline-end: 0.75rem;
        bottom: 0.75rem;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.5rem 0.85rem;
        border-radius: 999px;
        border: 1px solid
          color-mix(in srgb, var(--color-outline-variant, #c4c8c0) 70%, transparent);
        background: color-mix(
          in srgb,
          var(--color-surface-container-lowest, #fff) 94%,
          transparent
        );
        color: var(--color-primary, #1b5e20);
        font-size: 0.8rem;
        font-weight: 700;
        box-shadow: 0 6px 18px rgb(16 24 40 / 14%);
        backdrop-filter: blur(8px);
        cursor: pointer;
        transition: transform 0.12s ease, opacity 0.12s ease;
      }
      .location-picker__geo-btn:hover:not(:disabled) {
        transform: translateY(-1px);
      }
      .location-picker__geo-btn:disabled {
        opacity: 0.75;
        cursor: wait;
      }
      .location-picker__geo-btn .material-symbols-outlined {
        font-size: 20px;
        line-height: 1;
      }
      .location-picker__spinner {
        width: 1.1rem;
        height: 1.1rem;
        border-radius: 50%;
        border: 2px solid
          color-mix(in srgb, var(--color-primary, #1b5e20) 25%, transparent);
        border-top-color: var(--color-primary, #1b5e20);
        animation: location-picker-spin 0.7s linear infinite;
      }
      @keyframes location-picker-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (max-width: 520px) {
        .location-picker__geo-label {
          /* Keep icon-only on very small screens to avoid covering the map. */
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }
        .location-picker__geo-btn {
          padding: 0.55rem;
          border-radius: 50%;
        }
      }
      .location-picker__geo-msg {
        margin: 0;
        font-size: 0.8rem;
        color: var(--color-warning, #e65100);
        background: color-mix(
          in srgb,
          var(--color-warning, #e65100) 14%,
          transparent
        );
        border: 1px solid
          color-mix(in srgb, var(--color-warning, #e65100) 28%, transparent);
        border-radius: 10px;
        padding: 0.45rem 0.7rem;
      }
      .location-picker__footer {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.65rem 1rem;
        min-height: 1.75rem;
      }
      .location-picker__chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.75rem;
        border-radius: 999px;
        background: color-mix(
          in srgb,
          var(--color-primary-container, #c8e6c9) 88%,
          #fff
        );
        color: var(--color-on-primary-container, #1b5e20);
        font-weight: 650;
        font-size: 0.875rem;
      }
      .location-picker__gov-ar {
        font-weight: 750;
      }
      .location-picker__gov-en {
        opacity: 0.75;
        font-weight: 550;
        font-size: 0.78rem;
      }
      .location-picker__gov-en::before {
        content: '·';
        margin-inline-end: 0.35rem;
        opacity: 0.5;
      }
      .location-picker__coords {
        font-size: 0.75rem;
        font-variant-numeric: tabular-nums;
        color: var(--color-on-surface-variant, #424940);
      }
      .location-picker__empty {
        font-size: 0.82rem;
        color: var(--color-outline, #72796f);
      }
    `,
  ],
})
export class LocationPickerComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @ViewChild('mapHost') mapHost?: ElementRef<HTMLDivElement>;

  @Input() initialLocation: LocationPickerInitial | null = null;
  @Output() readonly locationChange = new EventEmitter<PickedLocation>();

  readonly resolvedGovernorate = signal<string | null>(null);
  readonly resolvedGovernorateAr = signal<string | null>(null);
  readonly resolvedLat = signal<number | null>(null);
  readonly resolvedLng = signal<number | null>(null);
  readonly geoLoading = signal(false);
  /** i18n key for soft geo errors (denied / unsupported / unavailable). */
  readonly geoMessage = signal<string | null>(null);

  private map?: L.Map;
  private marker?: L.Marker;
  private viewReady = false;
  private lastAppliedKey = '';

  ngAfterViewInit(): void {
    this.viewReady = true;
    // Defer so the host has layout size inside profile cards.
    setTimeout(() => this.ensureMap(), 0);
    setTimeout(() => this.ensureMap(), 120);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialLocation'] && this.viewReady) {
      this.applyInitialMarker(false);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = undefined;
    this.marker = undefined;
  }

  /**
   * Explicit user action only — never auto-prompt on load.
   * Saved [initialLocation] still wins on first paint; this overrides when clicked.
   */
  useMyLocation(): void {
    this.geoMessage.set(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.geoMessage.set('locationPicker.geoUnsupported');
      return;
    }

    this.geoLoading.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.geoLoading.set(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.ensureMap();
        this.placeOrMoveMarker(lat, lng, true);
        // Zoom a bit closer for GPS accuracy feel.
        this.map?.setView([lat, lng], Math.max(this.map.getZoom(), 12), {
          animate: true,
        });
      },
      (err) => {
        this.geoLoading.set(false);
        if (err.code === err.PERMISSION_DENIED) {
          this.geoMessage.set('locationPicker.geoDenied');
        } else {
          this.geoMessage.set('locationPicker.geoUnavailable');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60_000,
      }
    );
  }

  private ensureMap(): void {
    const host = this.mapHost?.nativeElement;
    if (!host || host.clientWidth === 0) {
      setTimeout(() => this.ensureMap(), 80);
      return;
    }
    if (this.map && this.map.getContainer() === host) {
      this.map.invalidateSize();
      this.applyInitialMarker(false);
      return;
    }

    this.map?.remove();
    this.map = L.map(host, {
      center: EGYPT_MAP_CENTER,
      zoom: EGYPT_MAP_ZOOM,
      scrollWheelZoom: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.geoMessage.set(null);
      this.placeOrMoveMarker(e.latlng.lat, e.latlng.lng, true);
    });

    setTimeout(() => this.map?.invalidateSize(), 50);
    this.applyInitialMarker(false);
  }

  private applyInitialMarker(emit: boolean): void {
    const init = this.initialLocation;
    const key = JSON.stringify(init ?? null);
    if (key === this.lastAppliedKey && this.marker) {
      return;
    }
    this.lastAppliedKey = key;

    if (
      init?.latitude != null &&
      init?.longitude != null &&
      Number.isFinite(init.latitude) &&
      Number.isFinite(init.longitude)
    ) {
      this.placeOrMoveMarker(init.latitude, init.longitude, emit);
      return;
    }

    // Seeded profiles without lat/lng: Egypt overview, no pin (gov label only).
    this.marker?.remove();
    this.marker = undefined;
    this.resolvedLat.set(null);
    this.resolvedLng.set(null);

    const centroid = resolveMapCoords({
      latitude: null,
      longitude: null,
      governorate: init?.governorate,
    });
    if (centroid) {
      const near = nearestGovernorate(centroid[0], centroid[1]);
      this.resolvedGovernorate.set(near.name);
      this.resolvedGovernorateAr.set(near.nameAr);
    } else if (init?.governorate) {
      this.resolvedGovernorate.set(init.governorate);
      this.resolvedGovernorateAr.set(init.governorate);
    } else {
      this.resolvedGovernorate.set(null);
      this.resolvedGovernorateAr.set(null);
    }
  }

  private placeOrMoveMarker(lat: number, lng: number, emit: boolean): void {
    if (!this.map) {
      return;
    }
    const gov = nearestGovernorate(lat, lng);
    this.resolvedLat.set(lat);
    this.resolvedLng.set(lng);
    this.resolvedGovernorate.set(gov.name);
    this.resolvedGovernorateAr.set(gov.nameAr);

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const p = this.marker!.getLatLng();
        this.placeOrMoveMarker(p.lat, p.lng, true);
      });
    }

    const z = Math.max(this.map.getZoom(), 8);
    this.map.setView([lat, lng], z, { animate: true });

    if (emit) {
      this.locationChange.emit({
        latitude: lat,
        longitude: lng,
        governorate: gov.name,
        governorateAr: gov.nameAr,
      });
    }
  }
}
