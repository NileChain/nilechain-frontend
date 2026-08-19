import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  titleKey: string;
  bodyKey: string;
  confirmKey?: string;
  cancelKey?: string;
  danger?: boolean;
  promptKey?: string;
  promptRequired?: boolean;
  initialPrompt?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly open = signal(false);
  readonly options = signal<ConfirmDialogOptions | null>(null);
  readonly promptText = signal('');
  readonly promptError = signal(false);

  private resolver: ((value: boolean) => void) | null = null;
  private lastPrompt = '';

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    if (this.resolver) {
      this.resolver(false);
      this.resolver = null;
    }

    this.promptError.set(false);
    this.lastPrompt = '';
    this.promptText.set(options.initialPrompt?.trim() ?? '');
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
    const opts = this.options();
    const prompt = this.promptText().trim();
    if (value && opts?.promptRequired && !prompt) {
      this.promptError.set(true);
      return;
    }

    this.lastPrompt = prompt;
    this.promptError.set(false);
    this.open.set(false);
    document.body.classList.remove('overflow-hidden');
    const resolve = this.resolver;
    this.resolver = null;
    this.options.set(null);
    resolve?.(value);
  }

  takePrompt(): string {
    const value = this.lastPrompt || this.promptText().trim();
    this.lastPrompt = '';
    this.promptText.set('');
    return value;
  }
}

