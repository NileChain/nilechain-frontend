import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  /** True while exit transition runs before removal (A2). */
  exiting?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly defaultTimeoutMs = 3500;
  private readonly exitMs = 150;

  readonly toasts = signal<ToastItem[]>([]);

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    const current = this.toasts().find((t) => t.id === id);
    if (!current || current.exiting) {
      return;
    }

    this.toasts.update((list) =>
      list.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );

    window.setTimeout(() => {
      this.toasts.update((list) => list.filter((t) => t.id !== id));
    }, this.exitMs);
  }

  private push(type: ToastType, message: string): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, type, message }]);
    window.setTimeout(() => this.dismiss(id), this.defaultTimeoutMs);
  }
}
