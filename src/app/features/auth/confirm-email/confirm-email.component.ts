import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageTitleService } from '../../../core/services/page-title.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateService } from '../../../core/services/translate.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-confirm-email',
  imports: [
    RouterLink,
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
  ],
  templateUrl: './confirm-email.component.html',
})
export class ConfirmEmailComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(TranslateService);

  readonly status = signal<'loading' | 'success' | 'error'>('loading');
  readonly errorMessage = signal('');

  constructor(pageTitle: PageTitleService) {
    pageTitle.setKey('app.page.confirmEmail');
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const userId = params['userId'] || '';
      const token = params['token'] || '';
      if (!userId || !token) {
        this.status.set('error');
        this.errorMessage.set(this.i18n.instant('confirmEmail.invalidLink'));
        return;
      }
      this.authService
        .confirmEmail(decodeURIComponent(userId), decodeURIComponent(token))
        .subscribe({
          next: () => this.status.set('success'),
          error: () => {
            this.status.set('error');
            this.errorMessage.set(
              this.i18n.instant('confirmEmail.confirmFailed')
            );
          },
        });
    });
  }
}
