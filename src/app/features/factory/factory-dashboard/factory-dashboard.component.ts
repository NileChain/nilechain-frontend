import { AfterViewInit, Component, OnInit, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Legend,
  Tooltip,
} from 'chart.js';
import { finalize } from 'rxjs';
import { SupplyRequestDto } from '../../../core/models/supply-request.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SupplyRequestService } from '../../../core/services/supply-request.service';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { SidebarFactoryComponent } from '../../../shared/components/sidebar-factory/sidebar-factory.component';

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

@Component({
  selector: 'app-factory-dashboard',
  imports: [
    RouterLink,
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    SidebarFactoryComponent,
  ],
  templateUrl: './factory-dashboard.component.html',
  styleUrl: './factory-dashboard.component.scss',
})
export class FactoryDashboardComponent implements AfterViewInit, OnInit {
  private readonly requestService = inject(SupplyRequestService);

  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly requests = signal<SupplyRequestDto[]>([]);

  readonly kpis = signal({
    openRequests: 0,
    matchesFound: 0,
    contracts: 0,
    totalProcurement: 0,
  });

  constructor(title: Title) {
    title.setTitle('NileChain - Factory Dashboard');
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    const canvas = document.getElementById(
      'marketChart'
    ) as HTMLCanvasElement | null;
    if (!canvas) {
      return;
    }

    new Chart(canvas.getContext('2d')!, {
      type: 'line',
      data: {
        labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        datasets: [
          {
            label: 'Potato',
            data: [12000, 12500, 11800, 13200, 13500, 14000],
            borderColor: '#1B5E20',
            backgroundColor: 'rgba(27, 94, 32, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Sugar Beet',
            data: [8500, 8200, 8700, 9100, 8900, 9500],
            borderColor: '#E65100',
            backgroundColor: 'rgba(230, 81, 0, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Wheat',
            data: [15000, 15500, 15200, 15800, 16000, 16500],
            borderColor: '#1B6D24',
            backgroundColor: 'rgba(27, 109, 36, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { family: 'Work Sans', size: 12 } },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: '#E8F5E9' },
            ticks: { font: { family: 'Work Sans' } },
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Work Sans' } },
          },
        },
      },
    });
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.requestService
      .listRequests()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (rows) => {
          this.requests.set(rows);
          this.kpis.set(this.buildKpis(rows));
        },
        error: () => {
          this.loadError.set('Unable to load dashboard data right now.');
          this.requests.set([]);
          this.kpis.set({
            openRequests: 0,
            matchesFound: 0,
            contracts: 0,
            totalProcurement: 0,
          });
        },
      });
  }

  cropLabel(cropType: string): string {
    const map: Record<string, string> = {
      wheat: 'Wheat',
      corn: 'Corn',
      rice: 'Rice',
      cotton: 'Cotton',
    };

    return map[cropType] ?? cropType;
  }

  statusLabelKey(status: SupplyRequestDto['status']): string {
    if (status === 'matched') {
      return 'factory.dashboard.statusMatched';
    }

    if (status === 'draft') {
      return 'factory.dashboard.statusDraft';
    }

    if (status === 'pending-approval') {
      return 'factory.dashboard.statusPendingApproval';
    }

    return 'common.active';
  }

  statusClass(status: SupplyRequestDto['status']): string {
    if (status === 'matched') {
      return 'bg-primary-container text-on-primary';
    }

    if (status === 'draft') {
      return 'bg-surface-container-high text-on-surface-variant';
    }

    if (status === 'pending-approval') {
      return 'bg-error-container text-on-error-container';
    }

    return 'bg-secondary-container text-on-secondary-container';
  }

  formatDeliveryDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  }

  formatAmount(value: number): string {
    return value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(1)}M`
      : `${Math.round(value / 1000)}K`;
  }

  private buildKpis(rows: SupplyRequestDto[]): {
    openRequests: number;
    matchesFound: number;
    contracts: number;
    totalProcurement: number;
  } {
    const openRequests = rows.filter((row) => row.status !== 'matched').length;
    const matchesFound = rows.reduce((sum, row) => sum + row.matchesCount, 0);
    const contracts = rows.filter((row) => row.status === 'matched').length;
    const totalProcurement = rows.reduce(
      (sum, row) => sum + row.quantity * row.targetPrice,
      0
    );

    return {
      openRequests,
      matchesFound,
      contracts,
      totalProcurement,
    };
  }
}
