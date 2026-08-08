import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  titleKey: string;
  bodyKey: string;
  confirmKey?: string;
  cancelKey?: string;
  danger?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly open = signal(false);
  readonly options = signal<ConfirmDialogOptions | null>(null);

  private resolver: ((value: boolean) => void) | null = null;

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    if (this.resolver) {
      this.resolver(false);
      this.resolver = null;
    }

    this.options.set({
      confirmKey: 'common.confirm',
      cancelKey: 'common.cancel',
      danger: false,
      ...options,
    });
    this.open.set(true);
    document.body.classList.add('overflow-hidden');

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  resolve(value: boolean): void {
    this.open.set(false);
    document.body.classList.remove('overflow-hidden');
    const resolve = this.resolver;
    this.resolver = null;
    this.options.set(null);
    resolve?.(value);
  }
}
