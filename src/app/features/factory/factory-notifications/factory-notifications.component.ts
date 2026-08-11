import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import {
  FactoryNotification,
  FactoryService,
} from '../../../core/services/factory/factory.service';
import { NotificationCenterService } from '../../../core/services/notification-center.service';
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
    UiErrorStateComponent,
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
  readonly loadError = signal<string | null>(null);
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
    this.loadError.set(null);
    this.factoryService
      .getNotifications()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (apiItems) => {
          this.items.set((apiItems ?? []).map((n) => this.fromApi(n)));
        },
        error: () => {
          this.loadError.set(this.i18n.instant('notifications.loadFailed'));
          this.items.set([]);
        },
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
        this.items.update((list) =>
          list.map((n) => (n.id === item.id ? { ...n, unread: true } : n))
        );
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
      title: this.titleForType(n.type, n.title),
      body: n.message,
      time: n.createdAt,
      type: this.normalizeType(n.type),
      unread: !n.isRead,
      link: n.link,
    };
  }

  private titleForType(type: string | null, fallback: string): string {
    const key = type ? `notifications.types.${type}` : null;
    if (key) {
      const translated = this.i18n.instant(key);
      if (translated !== key) {
        return translated;
      }
    }
    return fallback;
  }

  private normalizeType(type: string | null): string {
    const t = (type ?? 'info').toLowerCase();
    if (t.includes('match')) return 'match';
    if (t.includes('risk')) return 'risk';
    if (t.includes('contract')) return 'contract';
    if (t.includes('message')) return 'message';
    return t;
  }
}
