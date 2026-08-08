import {
  Component,
  ElementRef,
  HostListener,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { MobileNavService } from '../../../core/services/mobile-nav.service';
import { filter } from 'rxjs';
import {
  captureFocus,
  restoreFocus,
  trapTabKey,
} from '../../a11y/focus-trap';
import { UiBrandMarkComponent } from '../../ui/brand-mark/brand-mark.component';

@Component({
  selector: 'app-sidebar-admin',
  standalone: true,
  imports: [RouterLink, TranslatePipe, NgTemplateOutlet, UiBrandMarkComponent],
  templateUrl: './sidebar-admin.component.html',
})
export class SidebarAdminComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly mobileNav = inject(MobileNavService);

  readonly drawerPanel = viewChild<ElementRef<HTMLElement>>('drawerPanel');
  readonly drawerClose = viewChild<ElementRef<HTMLButtonElement>>('drawerClose');

  readonly items: Array<{
    key: string;
    icon: string;
    labelKey: string;
    link: string;
  }> = [
    {
      key: 'dashboard',
      icon: 'monitoring',
      labelKey: 'nav.dashboard',
      link: '/admin/dashboard',
    },
    {
      key: 'users',
      icon: 'group',
      labelKey: 'nav.users',
      link: '/admin/users',
    },
    {
      key: 'contracts',
      icon: 'description',
      labelKey: 'nav.contracts',
      link: '/admin/contracts',
    },
    {
      key: 'knowledgeBase',
      icon: 'auto_stories',
      labelKey: 'nav.knowledgeBase',
      link: '/admin/knowledge-base',
    },
  ];

  readonly active = signal(this.resolveActive(this.router.url));

  private previousFocus: HTMLElement | null = null;
  private wasOpen = false;

  constructor() {
    effect(() => {
      const isOpen = this.mobileNav.open();
      if (isOpen && !this.wasOpen) {
        this.previousFocus = captureFocus();
        queueMicrotask(() => {
          this.drawerClose()?.nativeElement.focus();
        });
      } else if (!isOpen && this.wasOpen) {
        restoreFocus(this.previousFocus);
        this.previousFocus = null;
      }
      this.wasOpen = isOpen;
    });

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.active.set(this.resolveActive((e as NavigationEnd).url));
        this.mobileNav.closeMenu();
      });
  }

  @HostListener('window:keydown.escape')
  closeOnEscape(): void {
    if (this.mobileNav.open()) {
      this.mobileNav.closeMenu();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.mobileNav.open()) {
      return;
    }
    const panelEl = this.drawerPanel()?.nativeElement;
    if (!panelEl) {
      return;
    }
    trapTabKey(event, panelEl);
  }

  toggleMenu(): void {
    this.mobileNav.toggleMenu();
  }

  private resolveActive(url: string): string {
    const match = this.items.find((item) => url.startsWith(item.link));
    return match?.key ?? 'dashboard';
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/landing']),
    });
  }
}
