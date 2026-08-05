import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { SidebarFarmComponent } from '../../shared/components/sidebar-farm/sidebar-farm.component';

@Component({
  selector: 'app-farm-layout',
  standalone: true,
  imports: [SidebarFarmComponent, RouterOutlet],
  templateUrl: './farm-layout.component.html',
  styleUrl: './farm-layout.component.scss',
})
export class FarmLayoutComponent {
  constructor(title: Title) {
    title.setTitle('NileChain - Farm');
  }
}
