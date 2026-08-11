import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Chart,
  ChartConfiguration,
  ChartDataset,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { TranslateService } from '../../../core/services/translate.service';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { environment } from '../../../../environments/environment';

export interface MarketPriceSeries {
  cropName: string;
  labels: string[];
  prices: number[];
}

export interface CropKpi {
  cropName: string;
  icon: string;
  color: string;
  currentPrice: number;
  changePercent: number;
  sparkline: number[];
}

export interface MarketInsight {
  icon: string;
  tone: 'up' | 'down' | 'stable' | 'info';
  textKey: string;
  params?: Record<string, string | number>;
}

type RangeKey = '6m' | 'ytd' | '3m';
type DisplayMode = 'average' | 'weekly' | 'monthly';
type LoadState = 'loading' | 'ready' | 'empty' | 'error';

const SERIES_COLORS = [
  '#1B5E20',
  '#2E7D32',
  '#558B2F',
  '#00695C',
  '#827717',
  '#33691E',
];

const CROP_ICONS: Record<string, string> = {
  Beans: 'nutrition',
  Corn: 'grass',
  Cotton: 'apparel',
  Cucumber: 'spa',
  Mango: 'eco',
  Wheat: 'agriculture',
  Potato: 'grocery',
  Rice: 'set_meal',
  Tomato: 'restaurant',
  Onion: 'kitchen',
  Orange: 'emoji_food_beverage',
  Sugarcane: 'yard',
};

@Component({
  selector: 'app-market-price-trends',
  standalone: true,
  imports: [
    TranslatePipe,
    DatePipe,
    DecimalPipe,
    UiEmptyStateComponent,
    UiErrorStateComponent,
    UiSkeletonComponent,
  ],
  templateUrl: './market-price-trends.component.html',
  styleUrl: './market-price-trends.component.scss',
})
export class MarketPriceTrendsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mainChart', { static: false })
  mainChartRef?: ElementRef<HTMLCanvasElement>;

  @ViewChild('chartCard', { static: false })
  chartCardRef?: ElementRef<HTMLElement>;

  private readonly http = inject(HttpClient);
  private readonly i18n = inject(TranslateService);

  private chart: Chart | null = null;
  private sparkCharts = new Map<string, Chart>();
  private chartRegistered = false;
  private rawSeries: MarketPriceSeries[] = [];

  readonly state = signal<LoadState>('loading');
  readonly errorMessage = signal<string | null>(null);
  readonly range = signal<RangeKey>('6m');
  readonly displayMode = signal<DisplayMode>('monthly');
  readonly lastUpdated = signal<Date>(new Date());
  readonly isFullscreen = signal(false);
  readonly kpis = signal<CropKpi[]>([]);
  readonly insights = signal<MarketInsight[]>([]);
  readonly activeCrops = signal<string[]>([]);

  readonly isRtl = computed(() => this.i18n.currentLang() === 'ar');

  ngAfterViewInit(): void {
    this.ensureChartJs();
    this.loadSeries();
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
  }

  ngOnDestroy(): void {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    this.destroyCharts();
  }

  setRange(value: RangeKey): void {
    this.range.set(value);
    this.applyChart();
  }

  setDisplayMode(value: DisplayMode): void {
    this.displayMode.set(value);
    this.applyChart();
  }

  refresh(): void {
    this.loadSeries();
  }

  retry(): void {
    this.loadSeries();
  }

  exportCsv(): void {
    if (!this.rawSeries.length) {
      return;
    }
    const { labels, datasets } = this.buildChartModel(this.rawSeries);
    const header = ['Period', ...datasets.map((d) => String(d.label ?? ''))];
    const rows = labels.map((label, i) => [
      label,
      ...datasets.map((d) => {
        const data = d.data as number[];
        return data[i] != null ? String(data[i]) : '';
      }),
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nilechain-market-prices-${this.displayMode()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  toggleFullscreen(): void {
    const el = this.chartCardRef?.nativeElement;
    if (!el) {
      return;
    }
    if (!document.fullscreenElement) {
      void el.requestFullscreen?.().then(() => {
        this.isFullscreen.set(true);
        setTimeout(() => this.chart?.resize(), 120);
      });
    } else {
      void document.exitFullscreen?.().then(() => {
        this.isFullscreen.set(false);
        setTimeout(() => this.chart?.resize(), 120);
      });
    }
  }

  formatPrice(value: number): string {
    if (value >= 1000) {
      const k = value / 1000;
      return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
    }
    return Math.round(value).toLocaleString();
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  cropIcon(name: string): string {
    return CROP_ICONS[name] ?? 'agriculture';
  }

  private readonly onFullscreenChange = (): void => {
    this.isFullscreen.set(!!document.fullscreenElement);
    setTimeout(() => this.chart?.resize(), 120);
  };

  private loadSeries(): void {
    this.state.set('loading');
    this.errorMessage.set(null);
    this.destroyCharts();

    this.http
      .get<MarketPriceSeries[]>(`${environment.backendUrl}/market-prices/series`)
      .subscribe({
        next: (series) => {
          this.lastUpdated.set(new Date());
          const cleaned = (series ?? [])
            .map((s) => ({
              cropName: s.cropName,
              labels: s.labels ?? [],
              prices: (s.prices ?? []).map((p) => Number(p)),
            }))
            .filter((s) => s.prices.length > 0);

          if (!cleaned.length) {
            this.rawSeries = [];
            this.kpis.set([]);
            this.insights.set([]);
            this.state.set('empty');
            return;
          }

          this.rawSeries = cleaned;
          this.kpis.set(this.buildKpis(cleaned));
          this.insights.set(this.buildInsights(this.kpis()));
          this.state.set('ready');
          // Wait for canvas to render after state flip.
          setTimeout(() => this.applyChart(), 0);
        },
        error: () => {
          this.rawSeries = [];
          this.kpis.set([]);
          this.insights.set([]);
          this.errorMessage.set(
            this.i18n.instant('factory.dashboard.marketLoadError')
          );
          this.state.set('error');
        },
      });
  }

  private applyChart(): void {
    if (this.state() !== 'ready' || !this.rawSeries.length) {
      return;
    }
    const canvas = this.mainChartRef?.nativeElement;
    if (!canvas) {
      setTimeout(() => this.applyChart(), 50);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const { labels, datasets } = this.buildChartModel(this.rawSeries);
    this.activeCrops.set(datasets.map((d) => String(d.label ?? '')));

    const rtl = this.isRtl();
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 650, easing: 'easeOutQuart' },
        layout: {
          padding: (() => {
            const rtl = document.documentElement.dir === 'rtl';
            return { top: 4, bottom: 0, left: rtl ? 8 : 2, right: rtl ? 2 : 8 };
          })(),
        },
        plugins: {
          legend: {
            position: 'bottom',
            align: 'start',
            rtl,
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 6,
              boxHeight: 6,
              padding: 12,
              color: this.cssVar('--color-on-surface-variant', '#5f6b64'),
              font: { family: 'Work Sans', size: 11, weight: 500 },
            },
          },
          tooltip: {
            backgroundColor: this.cssVar('--color-surface-container-lowest', '#fff'),
            titleColor: this.cssVar('--color-on-surface', '#1a1c19'),
            bodyColor: this.cssVar('--color-on-surface-variant', '#5f6b64'),
            borderColor: this.cssVar('--color-outline-variant', '#c4c8c0'),
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: (item) => {
                const v = item.parsed.y ?? 0;
                return ` ${item.dataset.label}: EGP ${Math.round(v).toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: this.cssVar('--color-outline-variant', '#e4e7e1'),
              lineWidth: 0.5,
              drawTicks: false,
            },
            border: { display: false },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 7,
              color: this.cssVar('--color-on-surface-variant', '#5f6b64'),
              font: { family: 'Work Sans', size: 10 },
            },
          },
          y: {
            beginAtZero: false,
            border: { display: false },
            grid: {
              color: this.cssVar('--color-outline-variant', '#e4e7e1'),
              lineWidth: 0.75,
            },
            ticks: {
              maxTicksLimit: 5,
              color: this.cssVar('--color-on-surface-variant', '#5f6b64'),
              font: { family: 'Work Sans', size: 10 },
              callback: (value) => this.formatPrice(Number(value)),
            },
          },
        },
        elements: {
          line: { borderWidth: 1.75, tension: 0.35 },
          point: {
            radius: 0,
            hoverRadius: 4,
            hitRadius: 10,
            hoverBorderWidth: 1.5,
          },
        },
      },
    };

    try {
      this.chart?.destroy();
      this.chart = new Chart(ctx, config);
    } catch {
      /* ignore chart paint failures */
    }
  }

  private buildChartModel(series: MarketPriceSeries[]): {
    labels: string[];
    datasets: ChartDataset<'line', number[]>[];
  } {
    const mode = this.displayMode();
    const range = this.range();
    const maxPoints =
      mode === 'weekly' ? 16 : mode === 'average' ? 10 : 12;

    const processed = series.map((s, i) => {
      const sliced = this.sliceByRange(s, range);
      const reduced =
        mode === 'monthly'
          ? this.aggregateByLabel(sliced)
          : mode === 'weekly'
            ? this.downsample(sliced, maxPoints)
            : this.downsample(this.aggregateByLabel(sliced), maxPoints);

      const color = SERIES_COLORS[i % SERIES_COLORS.length];
      return {
        label: s.cropName,
        labels: reduced.labels,
        prices: reduced.prices,
        color,
      };
    });

    const labels =
      processed.find((p) => p.labels.length)?.labels ??
      processed[0]?.labels ??
      [];

    const datasets: ChartDataset<'line', number[]>[] = processed.map((p) => {
      // Align length to shared labels axis (pad/truncate).
      const data = labels.map((_, idx) => p.prices[idx] ?? p.prices.at(-1) ?? 0);
      return {
        label: p.label,
        data,
        borderColor: p.color,
        backgroundColor: p.color + '10',
        fill: false,
        tension: 0.35,
        pointBackgroundColor: p.color,
        pointBorderColor: this.cssVar('--color-surface-container-lowest', '#fff'),
      };
    });

    return { labels, datasets };
  }

  private sliceByRange(
    series: MarketPriceSeries,
    range: RangeKey
  ): MarketPriceSeries {
    const n = series.prices.length;
    if (n === 0) {
      return series;
    }
    const keep =
      range === '3m' ? Math.max(8, Math.floor(n * 0.35)) : range === 'ytd' ? n : Math.max(10, Math.floor(n * 0.55));
    const start = Math.max(0, n - keep);
    return {
      cropName: series.cropName,
      labels: series.labels.slice(start),
      prices: series.prices.slice(start),
    };
  }

  private downsample(
    series: MarketPriceSeries,
    maxPoints: number
  ): MarketPriceSeries {
    const n = series.prices.length;
    if (n <= maxPoints) {
      return series;
    }
    const labels: string[] = [];
    const prices: number[] = [];
    for (let i = 0; i < maxPoints; i++) {
      const idx = Math.round((i * (n - 1)) / (maxPoints - 1));
      labels.push(series.labels[idx] ?? '');
      prices.push(series.prices[idx]);
    }
    return { cropName: series.cropName, labels, prices };
  }

  private aggregateByLabel(series: MarketPriceSeries): MarketPriceSeries {
    const buckets = new Map<string, number[]>();
    const order: string[] = [];
    for (let i = 0; i < series.prices.length; i++) {
      const label = series.labels[i] || `P${i}`;
      if (!buckets.has(label)) {
        buckets.set(label, []);
        order.push(label);
      }
      buckets.get(label)!.push(series.prices[i]);
    }
    return {
      cropName: series.cropName,
      labels: order,
      prices: order.map((l) => {
        const vals = buckets.get(l)!;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      }),
    };
  }

  private buildKpis(series: MarketPriceSeries[]): CropKpi[] {
    return series.slice(0, 5).map((s, i) => {
      const prices = s.prices;
      const current = prices.at(-1) ?? 0;
      const lookback = Math.max(1, Math.floor(prices.length * 0.2));
      const previous = prices[Math.max(0, prices.length - 1 - lookback)] ?? current;
      const change =
        previous === 0 ? 0 : ((current - previous) / previous) * 100;
      const sparkStart = Math.max(0, prices.length - 12);
      return {
        cropName: s.cropName,
        icon: this.cropIcon(s.cropName),
        color: SERIES_COLORS[i % SERIES_COLORS.length],
        currentPrice: current,
        changePercent: Math.round(change * 10) / 10,
        sparkline: prices.slice(sparkStart),
      };
    });
  }

  private buildInsights(kpis: CropKpi[]): MarketInsight[] {
    if (!kpis.length) {
      return [];
    }
    const insights: MarketInsight[] = [];
    const absChanges = kpis.map((k) => Math.abs(k.changePercent));
    const avgVol =
      absChanges.reduce((a, b) => a + b, 0) / Math.max(absChanges.length, 1);

    for (const k of kpis.slice(0, 3)) {
      if (Math.abs(k.changePercent) < 0.8) {
        insights.push({
          icon: 'horizontal_rule',
          tone: 'stable',
          textKey: 'factory.dashboard.insightStable',
          params: { crop: k.cropName },
        });
      } else if (k.changePercent > 0) {
        insights.push({
          icon: 'trending_up',
          tone: 'up',
          textKey: 'factory.dashboard.insightUp',
          params: {
            crop: k.cropName,
            percent: Math.abs(k.changePercent).toFixed(1),
          },
        });
      } else {
        insights.push({
          icon: 'trending_down',
          tone: 'down',
          textKey: 'factory.dashboard.insightDown',
          params: {
            crop: k.cropName,
            percent: Math.abs(k.changePercent).toFixed(1),
          },
        });
      }
    }

    insights.push({
      icon: avgVol < 3 ? 'verified' : 'monitoring',
      tone: 'info',
      textKey:
        avgVol < 3
          ? 'factory.dashboard.insightLowVolatility'
          : 'factory.dashboard.insightElevatedVolatility',
    });

    return insights.slice(0, 4);
  }

  private destroyCharts(): void {
    this.chart?.destroy();
    this.chart = null;
    for (const c of this.sparkCharts.values()) {
      c.destroy();
    }
    this.sparkCharts.clear();
  }

  private ensureChartJs(): void {
    if (this.chartRegistered) {
      return;
    }
    try {
      Chart.register(
        LineController,
        LineElement,
        PointElement,
        LinearScale,
        CategoryScale,
        Filler,
        Legend,
        Tooltip
      );
      this.chartRegistered = true;
    } catch {
      this.chartRegistered = true;
    }
  }

  private cssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined') {
      return fallback;
    }
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return v || fallback;
  }
}
