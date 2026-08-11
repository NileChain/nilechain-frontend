import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FactoryNotificationsComponent } from './factory-notifications.component';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { NotificationCenterService } from '../../../core/services/notification-center.service';
import { TranslateService } from '../../../core/services/translate.service';

function mockMatchMedia(): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe('FactoryNotificationsComponent error state', () => {
  let getNotifications: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockMatchMedia();
    getNotifications = vi
      .fn()
      .mockReturnValue(throwError(() => new Error('network')));

    await TestBed.configureTestingModule({
      imports: [FactoryNotificationsComponent],
      providers: [
        provideRouter([]),
        {
          provide: FactoryService,
          useValue: {
            getNotifications,
            markNotificationRead: () => of(void 0),
          },
        },
        {
          provide: NotificationCenterService,
          useValue: {
            notifications: signal([]),
            unreadCount: signal(0),
            open: signal(false),
            loading: signal(false),
            loadError: signal(null),
            markRead: vi.fn(),
            refresh: vi.fn(),
            openDrawer: vi.fn(),
            closeDrawer: vi.fn(),
            toggle: vi.fn(),
            markAllRead: vi.fn(),
          },
        },
        {
          provide: TranslateService,
          useValue: {
            ready: () => true,
            currentLang: () => 'en',
            instant: (key: string) => key,
          },
        },
      ],
    }).compileComponents();
  });

  it('sets loadError instead of empty success on API failure', () => {
    const fixture = TestBed.createComponent(FactoryNotificationsComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    expect(cmp.loadError()).toBe('notifications.loadFailed');
    expect(cmp.items()).toEqual([]);
  });
});
