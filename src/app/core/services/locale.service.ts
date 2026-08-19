import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import { Injectable, computed, inject, signal } from '@angular/core';
import { AppDirection, AppLocale } from '../models/ui.models';
import { TranslateService } from './translate.service';

registerLocaleData(localeAr);

const STORAGE_KEY = 'nilechain-locale';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly translate = inject(TranslateService);

  readonly locale = signal<AppLocale>(this.readInitial());
  readonly direction = computed<AppDirection>(() =>
    this.locale() === 'ar' ? 'rtl' : 'ltr'
  );
  readonly isRtl = computed(() => this.direction() === 'rtl');

  /** Intl locale for numbers (and related formatters) while language switches at runtime. */
  numberLocale(): string {
    return this.locale() === 'ar' ? 'ar-EG' : 'en-US';
  }

  async setLocale(locale: AppLocale): Promise<void> {
    await this.apply(locale);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }

  async toggle(): Promise<void> {
    await this.setLocale(this.locale() === 'ar' ? 'en' : 'ar');
  }

  private async apply(locale: AppLocale): Promise<void> {
    this.locale.set(locale);
    await this.translate.use(locale);

    const root = document.documentElement;
    root.lang = locale;
    root.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }

  private readInitial(): AppLocale {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'ar') {
        return stored;
      }
    } catch {
      /* ignore */
    }
    return 'en';
  }
}
