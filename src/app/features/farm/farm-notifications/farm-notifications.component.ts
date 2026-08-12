import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { FarmService } from '../../../core/services/farm/farm.service';
import { FarmNotification } from '../../../core/models/farm/farm-notification.model';
import { TranslateService } from '../../../core/services/translate.service';

@Component({
  selector: 'app-farm-notifications',
  standalone: true,
  imports: [
    TranslatePipe,
    UiErrorStateComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    AppTopBarComponent,
    DatePipe,
  ],
  templateUrl: './farm-notifications.component.html',
})
export class FarmNotificationsComponent implements OnInit {
  private readonly farmService = inject(FarmService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notifications = signal<FarmNotification[]>([]);
  readonly filter = signal<'all' | 'unread'>('all');
  readonly markingId = signal<string | null>(null);

  readonly visible = computed(() => {
    const items = this.notifications();
    if (this.filter() === 'unread') {
      return items.filter((n) => !n.isRead);
    }
    return items;
  });

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.error.set(null);
    this.farmService
      .getNotifications()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.notifications.set(items),
        error: () =>
          this.error.set(this.i18n.instant('notifications.loadFailed')),
      });
  }

  setFilter(value: 'all' | 'unread'): void {
    this.filter.set(value);
  }

  markRead(notification: FarmNotification): void {
    if (notification.isRead) {
      return;
    }
    this.markingId.set(notification.notificationId);
    this.farmService
      .markNotificationAsRead(notification.notificationId)
      .pipe(finalize(() => this.markingId.set(null)))
      .subscribe({
        next: () => {
          this.notifications.update((list) =>
            list.map((n) =>
              n.notificationId === notification.notificationId
                ? { ...n, isRead: true }
                : n
            )
          );
        },
        error: () =>
          this.error.set(this.i18n.instant('notifications.markReadFailed')),
      });
  }

  displayTitle(notification: FarmNotification): string {
    const typed = this.typeI18n(notification.type, 'title');
    if (typed) {
      return typed;
    }
    if (notification.title?.startsWith('notifications.')) {
      return this.i18n.instant(notification.title);
    }
    const type = notification.type?.trim();
    if (type) {
      const key = `notifications.types.${type}`;
      const translated = this.i18n.instant(key);
      if (translated !== key) {
        return translated;
      }
    }
    return notification.title;
  }

  displayBody(notification: FarmNotification): string {
    const typed = this.typeI18n(notification.type, 'body');
    if (typed) {
      return typed;
    }
    if (notification.message?.startsWith('notifications.')) {
      return this.i18n.instant(notification.message);
    }
    return notification.message;
  }

  private typeI18n(
    type: string | null | undefined,
    part: 'title' | 'body'
  ): string | null {
    const t = type?.trim();
    if (
      t !== 'MatchSuperseded' &&
      t !== 'MatchProposed' &&
      t !== 'MatchExcluded'
    ) {
      return null;
    }
    const camel = t.charAt(0).toLowerCase() + t.slice(1);
    const key = `notifications.types.${camel}.${part}`;
    const translated = this.i18n.instant(key);
    return translated !== key ? translated : null;
  }

  iconFor(type: string | null): string {
    switch ((type ?? '').toLowerCase()) {
      case 'match':
        return 'auto_awesome';
      case 'contract':
        return 'description';
      case 'message':
        return 'chat';
      case 'risk':
      case 'weatherrisk':
        return 'thermostat';
      case 'priceshift':
        return 'trending_up';
      default:
        return 'notifications';
    }
  }

  toneClass(type: string | null): string {
    switch ((type ?? '').toLowerCase()) {
      case 'weatherrisk':
        return 'bg-error-container text-on-error-container';
      case 'priceshift':
        return 'bg-tertiary-container text-on-tertiary-container';
      default:
        return 'bg-surface-container-high text-primary';
    }
  }
}
