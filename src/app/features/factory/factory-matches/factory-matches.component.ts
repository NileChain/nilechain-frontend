import { AfterViewInit, Component, OnDestroy, signal } from '@angular/core';
import {
  FactoryMatchItemDto,
  FactoryMatchRiskLevel,
} from '../../../core/models/farm-match.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-factory-matches',
  standalone: true,
  imports: [TranslatePipe, UiLanguageToggleComponent, UiThemeToggleComponent],
  templateUrl: './factory-matches.component.html',
})
export class FactoryMatchesComponent implements AfterViewInit, OnDestroy {
  readonly mapViewMode = signal<'satellite' | 'terrain'>('satellite');

  readonly farms: FactoryMatchItemDto[] = [
    {
      id: 'f1',
      name: 'Nile Valley Farm',
      location: 'Sharqia',
      cropType: 'Premium Wheat',
      quantityTons: 500,
      matchScore: 98,
      riskScore: 12,
      riskLevel: 'low',
      verified: true,
      featured: true,
      latitude: 30.5877,
      longitude: 31.502,
    },
    {
      id: 'f2',
      name: 'Delta Agri Cooperative',
      location: 'Dakahlia',
      cropType: 'Yellow Corn',
      quantityTons: 1200,
      matchScore: 85,
      riskScore: 45,
      riskLevel: 'medium',
      verified: false,
      featured: false,
      latitude: 31.0409,
      longitude: 31.3785,
    },
    {
      id: 'f3',
      name: 'Reclaimed Desert Farms',
      location: 'New Valley',
      cropType: 'Durum Wheat',
      quantityTons: 320,
      matchScore: 62,
      riskScore: 78,
      riskLevel: 'high',
      verified: false,
      featured: false,
      latitude: 25.4518,
      longitude: 30.5464,
    },
  ];

  private readonly riskPalette: Record<FactoryMatchRiskLevel, string> = {
    low: '#1B5E20',
    medium: '#E65100',
    high: '#C62828',
  };

  private map?: import('leaflet').Map;
  private currentTileLayer?: import('leaflet').TileLayer;
  private leaflet?: typeof import('leaflet');

  async ngAfterViewInit(): Promise<void> {
    await this.initializeMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  riskBadgeColor(level: FactoryMatchRiskLevel): string {
    return this.riskPalette[level];
  }

  setMapViewMode(mode: 'satellite' | 'terrain'): void {
    if (this.mapViewMode() === mode) {
      return;
    }

    this.mapViewMode.set(mode);
    if (this.map && this.leaflet) {
      this.applyBaseLayer(mode, this.leaflet);
    }
  }

  zoomIn(): void {
    this.map?.zoomIn();
  }

  zoomOut(): void {
    this.map?.zoomOut();
  }

  private async initializeMap(): Promise<void> {
    const mapElement = document.getElementById('factory-matches-map');
    if (!mapElement) {
      return;
    }

    const L = await import('leaflet');
    this.leaflet = L;

    this.map = L.map(mapElement, { zoomControl: false }).setView([27.5, 30.2], 6);
    this.applyBaseLayer(this.mapViewMode(), L);

    const bounds = L.latLngBounds([]);
    for (const farm of this.farms) {
      const marker = L.circleMarker([farm.latitude, farm.longitude], {
        radius: farm.featured ? 10 : 8,
        color: '#FFFFFF',
        weight: 2,
        fillColor: this.riskPalette[farm.riskLevel],
        fillOpacity: 0.95,
      });

      marker
        .bindPopup(
          `<strong>${farm.name}</strong><br>${farm.cropType}<br>Risk score: ${farm.riskScore}`
        )
        .addTo(this.map);
      bounds.extend([farm.latitude, farm.longitude]);
    }

    if (bounds.isValid()) {
      this.map.fitBounds(bounds.pad(0.35));
    }
  }

  private applyBaseLayer(
    mode: 'satellite' | 'terrain',
    L: typeof import('leaflet')
  ): void {
    this.currentTileLayer?.remove();

    this.currentTileLayer =
      mode === 'satellite'
        ? L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              attribution: 'Tiles © Esri',
              maxZoom: 18,
            }
          )
        : L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution:
              'Map data © OpenStreetMap contributors, SRTM | Map style © OpenTopoMap',
            maxZoom: 17,
          });

    this.currentTileLayer.addTo(this.map!);
  }
}
