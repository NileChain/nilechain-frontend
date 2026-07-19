import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppLocale, TranslationTree } from '../models/ui.models';

@Injectable({ providedIn: 'root' })
export class TranslateService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<AppLocale, TranslationTree>();

  readonly ready = signal(false);
  readonly currentLang = signal<AppLocale>('en');
  private readonly dictionary = signal<TranslationTree>({});

  async use(locale: AppLocale): Promise<void> {
    this.ready.set(false);

    let tree = this.cache.get(locale);
    if (!tree) {
      tree = await firstValueFrom(
        this.http.get<TranslationTree>(`/i18n/${locale}.json`)
      );
      this.cache.set(locale, tree);
    }

    this.dictionary.set(tree);
    this.currentLang.set(locale);
    this.ready.set(true);
  }

  instant(key: string, params?: Record<string, string | number>): string {
    const value = this.resolve(key);
    if (value == null) {
      return key;
    }
    return this.interpolate(value, params);
  }

  private resolve(key: string): string | null {
    const parts = key.split('.');
    let node: string | TranslationTree | undefined = this.dictionary();

    for (const part of parts) {
      if (node == null || typeof node === 'string') {
        return null;
      }
      node = node[part];
    }

    return typeof node === 'string' ? node : null;
  }

  private interpolate(
    template: string,
    params?: Record<string, string | number>
  ): string {
    if (!params) {
      return template;
    }

    return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
      const value = params[name];
      return value == null ? `{{${name}}}` : String(value);
    });
  }
}
