import { AfterViewInit, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
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
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

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
  imports: [TranslatePipe, UiLanguageToggleComponent, UiThemeToggleComponent],
  templateUrl: './factory-dashboard.component.html',
  styleUrl: './factory-dashboard.component.scss',
})
export class FactoryDashboardComponent implements AfterViewInit {
  constructor(title: Title) {
    title.setTitle('NileChain - Factory Dashboard');
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
}
