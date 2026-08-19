import { UiDatePipe } from '../../core/pipes/ui-date.pipe';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageTitleService } from '../../core/services/page-title.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { TranslateService } from '../../core/services/translate.service';
import { IntegrityService } from '../../core/services/integrity/integrity.service';
import { ContractIntegrityVerify } from '../../core/models/integrity/contract-integrity.model';
import { UiLanguageToggleComponent } from '../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../shared/ui/theme-toggle/theme-toggle.component';
import { UiBrandMarkComponent } from '../../shared/ui/brand-mark/brand-mark.component';

@Component({
  selector: 'app-verify-contract',
  standalone: true,
  imports: [
    UiDatePipe, RouterLink,
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiBrandMarkComponent,
  ],
  templateUrl: './verify-contract.component.html',
})
export class VerifyContractComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly integrityApi = inject(IntegrityService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly result = signal<ContractIntegrityVerify | null>(null);

  constructor(pageTitle: PageTitleService) {
    pageTitle.setKey('app.page.verify');
  }

  ngOnInit(): void {
    const hash = this.route.snapshot.paramMap.get('hash') ?? '';
    this.integrityApi.verify(hash).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.result.set({
          outcome: 'NotFound',
          contentHash: hash,
          currentContentMatches: false,
          honestyNote: this.i18n.instant('integrity.honestyNote'),
        });
        this.loading.set(false);
      },
    });
  }

  outcomeKey(outcome: string): string {
    switch (outcome) {
      case 'Verified':
        return 'integrity.outcomeVerified';
      case 'Superseded':
        return 'integrity.outcomeSuperseded';
      case 'Tampered':
        return 'integrity.outcomeTampered';
      default:
        return 'integrity.outcomeNotFound';
    }
  }

  outcomeIcon(outcome: string): string {
    switch (outcome) {
      case 'Verified':
        return 'verified';
      case 'Superseded':
        return 'history';
      case 'Tampered':
        return 'gpp_maybe';
      default:
        return 'search_off';
    }
  }
}
