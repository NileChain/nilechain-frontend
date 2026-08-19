import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from './translate.service';

@Injectable({ providedIn: 'root' })
export class PageTitleService {
  private readonly title = inject(Title);
  private readonly i18n = inject(TranslateService);
  private readonly key = signal<string | null>(null);
  private readonly params = signal<
    Record<string, string | number> | undefined
  >(undefined);

  constructor() {
    effect(() => {
      this.i18n.ready();
      this.i18n.currentLang();
      const k = this.key();
      if (!k) {
        return;
      }
      this.title.setTitle(this.i18n.instant(k, this.params()));
    });
  }

  setKey(key: string, params?: Record<string, string | number>): void {
    this.params.set(params);
    this.key.set(key);
  }
}
