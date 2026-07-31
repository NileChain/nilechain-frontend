import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { SidebarAdminComponent } from '../../shared/components/sidebar-admin/sidebar-admin.component';

@Component({
	selector: 'app-admin-layout',
	standalone: true,
	imports: [SidebarAdminComponent, RouterOutlet],
	templateUrl: './admin-layout.component.html',
	styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
	constructor(title: Title) {
		title.setTitle('NileChain - Admin');
	}
}
