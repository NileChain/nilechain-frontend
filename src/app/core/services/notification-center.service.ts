import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { AuthService } from './auth.service';
import {
  FactoryNotification,
  FactoryService,
} from './factory/factory.service';
import { FarmService } from './farm/farm.service';
import { FarmNotification } from '../models/farm/farm-notification.model';
import { TranslateService } from './translate.service';
import { ToastService } from './toast.service';

export interface AppNotification {
  id: string;
  /** Plain text from API (preferred). */
  title?: string;
  body?: string;
  /** Legacy i18n keys (mock fallback). */
  titleKey?: string;
  bodyKey?: string;
  timeKey?: string;
  /** Formatted timestamp for API items. */
  timeLabel?: string;
  read: boolean;
  link?: string;
  type?: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  private readonly auth = inject(AuthService);
  private readonly factoryService = inject(FactoryService);
  private readonly farmService = inject(FarmService);
  private readonly i18n = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly open = signal(false);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly notifications = signal<AppNotification[]>([]);

  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.read).length
  );

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.refresh();
      } else {
        this.notifications.set([]);
        this.loadError.set(null);
      }
    });
  }

  openDrawer(): void {
    this.open.set(true);
    document.body.classList.add('overflow-hidden');
    this.refresh();
  }

  closeDrawer(): void {
    this.open.set(false);
    document.body.classList.remove('overflow-hidden');
  }

  toggle(): void {
    if (this.open()) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  refresh(): void {
    if (!this.auth.isAuthenticated()) {
      this.notifications.set([]);
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);

    const source$ = this.auth.hasAnyRole(['Factory'])
      ? this.factoryService.getNotifications()
      : this.auth.hasAnyRole(['Farm'])
        ? this.farmService.getNotifications()
        : of([] as FactoryNotification[]);

    source$
      .pipe(
        catchError(() => {
          this.loadError.set('load_failed');
          return of([] as FactoryNotification[] | FarmNotification[]);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe((items) => {
        const role: 'factory' | 'farm' = this.auth.hasAnyRole(['Factory'])
          ? 'factory'
          : 'farm';
        this.notifications.set(
          (items as Array<FactoryNotification | FarmNotification>).map((n) =>
            this.fromApi(n, role)
          )
        );
      });
  }

  markRead(id: string): void {
    const current = this.notifications().find((n) => n.id === id);
    if (!current || current.read) {
      return;
    }

    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    if (this.auth.hasAnyRole(['Admin']) && !this.auth.hasAnyRole(['Factory', 'Farm'])) {
      return;
    }

    const req$ = this.auth.hasAnyRole(['Factory'])
      ? this.factoryService.markNotificationRead(id)
      : this.farmService.markNotificationAsRead(id);

    req$.subscribe({
      error: () => {
        // Revert optimistic update on failure.
        this.notifications.update((list) =>
          list.map((n) => (n.id === id ? { ...n, read: false } : n))
        );
      },
    });
  }

  markAllRead(): void {
    const unread = this.notifications().filter((n) => !n.read);
    if (unread.length === 0) {
      return;
    }

    const previous = this.notifications();
    this.notifications.update((list) =>
      list.map((n) => ({ ...n, read: true }))
    );

    if (
      this.auth.hasAnyRole(['Admin']) &&
      !this.auth.hasAnyRole(['Factory', 'Farm'])
    ) {
      return;
    }

    const calls = unread.map((n) =>
      this.auth.hasAnyRole(['Factory'])
        ? this.factoryService.markNotificationRead(n.id)
        : this.farmService.markNotificationAsRead(n.id)
    );

    forkJoin(calls).subscribe({
      next: () => this.refresh(),
      error: () => {
        this.notifications.set(previous);
        this.loadError.set('mark_all_failed');
        this.toast.error(this.i18n.instant('errors.markAllFailed'));
        this.refresh();
      },
    });
  }

  private fromApi(
    n: FactoryNotification | FarmNotification,
    role: 'factory' | 'farm'
  ): AppNotification {
    const link =
      'link' in n && n.link
        ? n.link
        : this.defaultLink(n.type, role);

    return {
      id: n.notificationId,
      title: this.titleForType(n.type, n.title),
      body: n.message,
      timeLabel: this.formatTime(n.createdAt),
      read: n.isRead,
      link,
      type: n.type,
    };
  }

  private titleForType(type: string | null, fallback: string): string {
    if (!type) {
      return fallback;
    }
    const key = `notifications.types.${type}`;
    const translated = this.i18n.instant(key);
    return translated === key ? fallback : translated;
  }

  private defaultLink(
    type: string | null,
    role: 'factory' | 'farm'
  ): string | undefined {
    const t = (type || '').toLowerCase();
    if (role === 'factory') {
      if (t.includes('match')) return '/factory/matches';
      if (t.includes('contract')) return '/factory/contracts';
      if (t.includes('risk')) return '/factory/risk-report';
      if (t.includes('message')) return '/factory/messages';
      return '/factory/notifications';
    }
    if (t.includes('match')) return '/farm/matches';
    if (t.includes('contract')) return '/farm/contracts';
    if (t.includes('message')) return '/farm/messages';
    return '/farm/notifications';
  }

  private formatTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    return d.toLocaleString();
  }
}
