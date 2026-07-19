import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '../services/translate.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  transform(
    key: string | null | undefined,
    params?: Record<string, string | number>
  ): string {
    if (!key) {
      return '';
    }
    // Depend on reactive signals so impure pipe refreshes on language change
    this.translate.ready();
    this.translate.currentLang();
    return this.translate.instant(key, params);
  }
}
