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
        error: () => this.error.set('Failed to load notifications.'),
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
        error: () => this.error.set('Failed to mark notification as read.'),
      });
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
