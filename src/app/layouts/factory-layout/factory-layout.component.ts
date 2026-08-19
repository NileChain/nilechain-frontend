import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { PageTitleService } from '../../core/services/page-title.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { SidebarFactoryComponent } from '../../shared/components/sidebar-factory/sidebar-factory.component';

@Component({
  selector: 'app-factory-layout',
  standalone: true,
  imports: [SidebarFactoryComponent, RouterOutlet, RouterLink, TranslatePipe],
  templateUrl: './factory-layout.component.html',
  styleUrl: './factory-layout.component.scss',
})
export class FactoryLayoutComponent {
  constructor(pageTitle: PageTitleService) {
    pageTitle.setKey('app.page.factory');
  }
}
