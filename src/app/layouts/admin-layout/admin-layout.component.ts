import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageTitleService } from '../../core/services/page-title.service';
import { SidebarAdminComponent } from '../../shared/components/sidebar-admin/sidebar-admin.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [SidebarAdminComponent, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  constructor(pageTitle: PageTitleService) {
    pageTitle.setKey('app.page.admin');
  }
}
