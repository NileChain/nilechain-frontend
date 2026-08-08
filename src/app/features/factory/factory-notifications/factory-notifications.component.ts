import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import {
  FactoryNotification,
  FactoryService,
} from '../../../core/services/factory/factory.service';
import {
  AppNotification,
  NotificationCenterService,
} from '../../../core/services/notification-center.service';
import { TranslateService } from '../../../core/services/translate.service';

type NotifTab = 'all' | 'unread' | 'matches' | 'risks';

interface DisplayNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: string;
  unread: boolean;
  link?: string;
}

@Component({
  selector: 'app-factory-notifications',
  standalone: true,
  imports: [
    TranslatePipe,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    AppTopBarComponent,
    RouterLink,
    DatePipe,
  ],
  templateUrl: './factory-notifications.component.html',
})
export class FactoryNotificationsComponent implements OnInit {
  private readonly factoryService = inject(FactoryService);
  private readonly notificationCenter = inject(NotificationCenterService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly items = signal<DisplayNotification[]>([]);
  readonly activeTab = signal<NotifTab>('all');

  readonly tabs: { key: NotifTab; labelKey: string; icon: string | null }[] = [
    { key: 'all', labelKey: 'notifications.all', icon: null },
    { key: 'unread', labelKey: 'notifications.unread', icon: null },
    { key: 'matches', labelKey: 'notifications.matches', icon: 'hub' },
    { key: 'risks', labelKey: 'notifications.risks', icon: 'warning' },
  ];

  readonly visible = computed(() => {
    const tab = this.activeTab();
    const list = this.items();
    switch (tab) {
      case 'unread':
        return list.filter((n) => n.unread);
      case 'matches':
        return list.filter((n) => n.type === 'match');
      case 'risks':
        return list.filter((n) => n.type === 'risk');
      default:
        return list;
    }
  });

  ngOnInit(): void {
    this.load();
  }

  setTab(tab: NotifTab): void {
    this.activeTab.set(tab);
  }

  load(): void {
    this.loading.set(true);
    this.factoryService
      .getNotifications()
      .pipe(
        catchError(() => of(null)),
        finalize(() => this.loading.set(false))
      )
      .subscribe((apiItems) => {
        if (apiItems?.length) {
          this.items.set(apiItems.map((n) => this.fromApi(n)));
        } else {
          this.items.set(
            this.notificationCenter
              .notifications()
              .map((n) => this.fromCenter(n))
          );
        }
      });
  }

  markRead(item: DisplayNotification): void {
    if (!item.unread) {
      return;
    }
    this.items.update((list) =>
      list.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    this.notificationCenter.markRead(item.id);
    this.factoryService.markNotificationRead(item.id).subscribe({
      error: () => {
        /* local state already updated */
      },
    });
  }

  iconFor(type: string): string {
    switch (type) {
      case 'match':
        return 'hub';
      case 'risk':
        return 'warning';
      case 'contract':
        return 'contract';
      case 'message':
        return 'chat';
      default:
        return 'notifications';
    }
  }

  private fromApi(n: FactoryNotification): DisplayNotification {
    return {
      id: n.notificationId,
      title: n.title,
      body: n.message,
      time: n.createdAt,
      type: (n.type ?? 'info').toLowerCase(),
      unread: !n.isRead,
      link: n.link,
    };
  }

  private fromCenter(n: AppNotification): DisplayNotification {
    const type = this.inferType(n);
    return {
      id: n.id,
      title: n.title || (n.titleKey ? this.i18n.instant(n.titleKey) : ''),
      body: n.body || (n.bodyKey ? this.i18n.instant(n.bodyKey) : ''),
      time: n.timeLabel || (n.timeKey ? this.i18n.instant(n.timeKey) : ''),
      type,
      unread: !n.read,
      link: n.link,
    };
  }

  private inferType(n: AppNotification): string {
    const key = (n.titleKey || n.title || '').toLowerCase();
    if (key.includes('match')) {
      return 'match';
    }
    if (key.includes('risk')) {
      return 'risk';
    }
    if (key.includes('contract')) {
      return 'contract';
    }
    if (key.includes('message')) {
      return 'message';
    }
    return 'info';
  }
}
