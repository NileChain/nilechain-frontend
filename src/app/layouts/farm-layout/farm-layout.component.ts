import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageTitleService } from '../../core/services/page-title.service';
import { SidebarFarmComponent } from '../../shared/components/sidebar-farm/sidebar-farm.component';

@Component({
  selector: 'app-farm-layout',
  standalone: true,
  imports: [SidebarFarmComponent, RouterOutlet],
  templateUrl: './farm-layout.component.html',
  styleUrl: './farm-layout.component.scss',
})
export class FarmLayoutComponent {
  constructor(pageTitle: PageTitleService) {
    pageTitle.setKey('app.page.farm');
  }
}
