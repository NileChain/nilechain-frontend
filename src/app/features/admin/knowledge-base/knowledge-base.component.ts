import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiPreviewBannerComponent } from '../../../shared/ui/preview-banner/preview-banner.component';
import { MobileNavService } from '../../../core/services/mobile-nav.service';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiPreviewBannerComponent,
  ],
  templateUrl: './knowledge-base.component.html',
})
export class KnowledgeBaseComponent {
  readonly mobileNav = inject(MobileNavService);
  readonly categories = [
    { key: 'quality', icon: 'verified', count: 42 },
    { key: 'contract', icon: 'contract', count: 18 },
    { key: 'science', icon: 'science', count: 156 },
  ] as const;

  readonly documents = [
    {
      title: 'Wheat Export Quality Specs 2026',
      meta: 'PDF · 2.4 MB',
      category: 'quality',
      date: '12 Oct 2025',
      status: 'indexed',
    },
    {
      title: 'Standard Distributor Agreement - EMEA',
      meta: 'DOCX · 1.1 MB',
      category: 'contract',
      date: '10 Oct 2025',
      status: 'indexed',
    },
    {
      title: 'Soil Analysis & Crop Yield Predictions Q3',
      meta: 'CSV · 14.5 MB',
      category: 'science',
      date: '08 Oct 2025',
      status: 'processing',
    },
  ] as const;
}
