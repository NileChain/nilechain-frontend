import { Component, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { AuthService } from '../../../core/services/auth.service';
import { FarmService } from '../../../core/services/farm/farm.service';
import { NotificationItem } from '../../../core/models/farm/notification-item.model';

@Component({
  selector: 'app-farm-notifications',
  standalone: true,
  imports: [TranslatePipe, UiLanguageToggleComponent, UiThemeToggleComponent, DatePipe],
  templateUrl: './farm-notifications.component.html',
})
export class FarmNotificationsComponent {
  private readonly authService = inject(AuthService);
  private readonly farmService = inject(FarmService);

  readonly currentUser = this.authService.currentUser;
  readonly allNotifications = signal<NotificationItem[]>([]);
  readonly loading = signal(true);
  readonly filter = signal<'all' | 'unread' | 'match' | 'risk'>('all');
  readonly pageSize = 10;
  readonly currentPage = signal(0);

  readonly notifications = computed(() => {
    const items = this.allNotifications();
    const activeFilter = this.filter();

    let filtered = items;
    if (activeFilter === 'unread') filtered = items.filter(n => !n.isRead);
    else if (activeFilter === 'match') filtered = items.filter(n => n.type === 'match');
    else if (activeFilter === 'risk') filtered = items.filter(n => n.type === 'risk');

    return filtered.slice(0, (this.currentPage() + 1) * this.pageSize);
  });

  readonly unreadCount = computed(() => this.allNotifications().filter(n => !n.isRead).length);
  readonly hasMore = computed(() => this.notifications().length < this.allNotifications().length);

  readonly filterOptions: { key: 'all' | 'unread' | 'match' | 'risk'; label: string }[] = [
    { key: 'all', label: 'notifications.all' },
    { key: 'unread', label: 'notifications.unread' },
    { key: 'match', label: 'notifications.matches' },
    { key: 'risk', label: 'notifications.risks' },
  ];

  readonly firstLetter = (name: string): string => name?.charAt(0)?.toUpperCase() ?? '?';

  readonly groupKey = (createdAt: string): string => {
    const now = new Date();
    const date = new Date(createdAt);
    const diff = now.getTime() - date.getTime();
    const day = 24 * 60 * 60 * 1000;

    if (diff < day && date.getDate() === now.getDate()) return 'today';
    if (diff < 2 * day) return 'yesterday';
    return 'earlier';
  };

  readonly groupedNotifications = computed(() => {
    const groups: { key: string; items: NotificationItem[] }[] = [];
    const map = new Map<string, NotificationItem[]>();

    for (const n of this.notifications()) {
      const key = this.groupKey(n.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }

    for (const key of ['today', 'yesterday', 'earlier']) {
      if (map.has(key)) groups.push({ key, items: map.get(key)! });
    }

    return groups;
  });

  readonly notificationIcon = (type: string | null): string => {
    switch (type) {
      case 'risk': return 'warning';
      case 'match': return 'hub';
      case 'message': return 'chat';
      case 'contract': return 'contract';
      default: return 'notifications';
    }
  };

  readonly notificationBg = (type: string | null): string => {
    switch (type) {
      case 'risk': return 'bg-error-container';
      case 'match': return 'bg-primary-container';
      default: return 'bg-surface-container-high';
    }
  };

  readonly notificationIconColor = (type: string | null): string => {
    switch (type) {
      case 'risk': return 'text-on-error-container';
      case 'match': return 'text-on-primary-container';
      default: return 'text-on-surface-variant';
    }
  };

  readonly notificationBorder = (type: string | null): string => {
    switch (type) {
      case 'risk': return 'border-error-container';
      default: return 'border-outline-variant';
    }
  };

  readonly unreadDot = (type: string | null): string => {
    switch (type) {
      case 'risk': return 'bg-error';
      default: return 'bg-primary';
    }
  };

  constructor(title: Title) {
    title.setTitle('NileChain - Notifications');
    this.loadNotifications();
  }

  private loadNotifications(): void {
    this.loading.set(true);
    this.farmService.getNotifications().subscribe(data => {
      this.allNotifications.set(data);
      this.loading.set(false);
    });
  }

  setFilter(f: 'all' | 'unread' | 'match' | 'risk'): void {
    this.filter.set(f);
    this.currentPage.set(0);
  }

  loadMore(): void {
    this.currentPage.update(p => p + 1);
  }

  markAsRead(notificationId: string): void {
    this.farmService.markNotificationAsRead(notificationId).subscribe(() => {
      this.allNotifications.update(items =>
        items.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n)
      );
    });
  }

  get typeLabel(): string {
    switch (this.filter()) {
      case 'unread': return 'Unread';
      case 'match': return 'Matches';
      case 'risk': return 'Risks';
      default: return 'All';
    }
  }
}
