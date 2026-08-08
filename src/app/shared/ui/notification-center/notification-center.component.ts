import {
  Component,
  ElementRef,
  HostListener,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { NotificationCenterService } from '../../../core/services/notification-center.service';
import { AuthService } from '../../../core/services/auth.service';
import { UiEmptyStateComponent } from '../empty-state/empty-state.component';
import { UiLoaderComponent } from '../loader/loader.component';
import {
  captureFocus,
  restoreFocus,
  trapTabKey,
} from '../../a11y/focus-trap';

@Component({
  selector: 'ui-notification-center',
  standalone: true,
  imports: [
    TranslatePipe,
    RouterLink,
    UiEmptyStateComponent,
    UiLoaderComponent,
  ],
  template: `
    @if (center.open()) {
      <div
        class="fixed inset-0 z-[80]"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/40"
          (click)="center.closeDrawer()"
          [attr.aria-label]="'common.close' | translate"
          tabindex="-1"
        ></button>

        <aside
          #panel
          tabindex="-1"
          class="absolute inset-y-0 end-0 w-full max-w-md bg-surface shadow-xl border-s border-outline-variant flex flex-col animate-fade-in outline-none"
        >
          <header
            class="h-16 px-4 flex items-center justify-between border-b border-outline-variant shrink-0"
          >
            <div>
              <h2
                [id]="titleId"
                class="font-title-md text-title-md text-on-surface font-bold"
              >
                {{ 'common.notifications' | translate }}
              </h2>
              @if (center.unreadCount() > 0) {
                <p class="text-label-sm text-on-surface-variant">
                  {{ center.unreadCount() }}
                  {{ 'notifications.unread' | translate }}
                </p>
              }
            </div>
            <div class="flex items-center gap-1">
              @if (center.unreadCount() > 0) {
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-label-sm text-primary hover:bg-surface-container-low"
                  (click)="center.markAllRead()"
                >
                  {{ 'notifications.markRead' | translate }}
                </button>
              }
              <button
                #closeBtn
                type="button"
                class="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant"
                (click)="center.closeDrawer()"
                [attr.aria-label]="'common.close' | translate"
              >
                <span class="material-symbols-outlined" aria-hidden="true"
                  >close</span
                >
              </button>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto p-4 space-y-2">
            @if (center.loading()) {
              <div class="flex justify-center py-12">
                <ui-loader />
              </div>
            } @else if (center.notifications().length === 0) {
              <ui-empty-state
                titleKey="notifications.empty"
                bodyKey="notifications.emptyBody"
                icon="notifications_off"
              />
            } @else {
              @for (item of center.notifications(); track item.id) {
                <article
                  class="rounded-lg border border-outline-variant p-3 transition-colors"
                  [class.bg-surface-container-low]="!item.read"
                  [class.bg-surface]="item.read"
                >
                  <div class="flex items-start gap-3">
                    <span
                      class="material-symbols-outlined text-primary mt-0.5"
                      aria-hidden="true"
                      >notifications</span
                    >
                    <div class="min-w-0 flex-1">
                      <h3
                        class="font-label-md text-label-md text-on-surface"
                        [class.font-bold]="!item.read"
                      >
                        @if (item.title) {
                          {{ item.title }}
                        } @else if (item.titleKey) {
                          {{ item.titleKey | translate }}
                        }
                      </h3>
                      <p
                        class="font-body-sm text-body-sm text-on-surface-variant mt-1"
                      >
                        @if (item.body) {
                          {{ item.body }}
                        } @else if (item.bodyKey) {
                          {{ item.bodyKey | translate }}
                        }
                      </p>
                      <p class="text-label-sm text-outline mt-2">
                        @if (item.timeLabel) {
                          {{ item.timeLabel }}
                        } @else if (item.timeKey) {
                          {{ item.timeKey | translate }}
                        }
                      </p>
                      <div class="flex items-center gap-2 mt-3">
                        @if (!item.read) {
                          <button
                            type="button"
                            class="text-label-sm text-primary hover:underline"
                            (click)="center.markRead(item.id)"
                          >
                            {{ 'notifications.markRead' | translate }}
                          </button>
                        }
                        @if (item.link) {
                          <a
                            [routerLink]="item.link"
                            class="text-label-sm text-primary hover:underline"
                            (click)="center.closeDrawer()"
                          >
                            {{ 'notifications.viewDetails' | translate }}
                          </a>
                        }
                      </div>
                    </div>
                  </div>
                </article>
              }
            }
          </div>

          <footer class="p-4 border-t border-outline-variant shrink-0">
            <a
              [routerLink]="notificationsPageLink"
              class="ui-btn-secondary w-full inline-flex justify-center"
              (click)="center.closeDrawer()"
            >
              {{ 'common.viewAll' | translate }}
            </a>
          </footer>
        </aside>
      </div>
    }
  `,
})
export class UiNotificationCenterComponent {
  readonly center = inject(NotificationCenterService);
  private readonly auth = inject(AuthService);

  readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  readonly titleId = 'ui-notification-center-title';

  private previousFocus: HTMLElement | null = null;
  private wasOpen = false;

  constructor() {
    effect(() => {
      const isOpen = this.center.open();
      if (isOpen && !this.wasOpen) {
        this.previousFocus = captureFocus();
        queueMicrotask(() => {
          this.closeBtn()?.nativeElement.focus();
        });
      } else if (!isOpen && this.wasOpen) {
        restoreFocus(this.previousFocus);
        this.previousFocus = null;
      }
      this.wasOpen = isOpen;
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.center.open()) {
      this.center.closeDrawer();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.center.open()) {
      return;
    }
    const panelEl = this.panel()?.nativeElement;
    if (!panelEl) {
      return;
    }
    trapTabKey(event, panelEl);
  }

  get notificationsPageLink(): string {
    if (this.auth.hasAnyRole(['Factory'])) {
      return '/factory/notifications';
    }
    if (this.auth.hasAnyRole(['Admin'])) {
      return '/admin/dashboard';
    }
    return '/farm/notifications';
  }
}
