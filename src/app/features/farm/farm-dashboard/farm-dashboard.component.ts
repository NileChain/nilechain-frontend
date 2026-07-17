import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-farm-dashboard',
  imports: [],
  templateUrl: './farm-dashboard.component.html',
  styleUrl: './farm-dashboard.component.scss',
})
export class FarmDashboardComponent {
  constructor(title: Title) {
    title.setTitle('NileChain - Farm Dashboard');
  }
}
