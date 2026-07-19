import { Component } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SidebarFactoryComponent } from '../../../shared/components/sidebar-factory/sidebar-factory.component';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-factory-profile',
  standalone: true,
  imports: [TranslatePipe, SidebarFactoryComponent, UiLanguageToggleComponent, UiThemeToggleComponent],
  templateUrl: './factory-profile.component.html',
})
export class FactoryProfileComponent {
  readonly preferredCrops = ['Potato', 'Wheat', 'Corn'] as const;

  readonly documents = [
    { name: 'agricultural_deed_2025.pdf', size: '2.4 MB', icon: 'picture_as_pdf' },
    { name: 'id_card.jpg', size: '1.1 MB', icon: 'image' },
  ] as const;
}
