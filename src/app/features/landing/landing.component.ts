import {
  AfterViewInit,
  Component,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { LocaleService } from '../../core/services/locale.service';
import { ThemeService } from '../../core/services/theme.service';
import { AppLocale } from '../../core/models/ui.models';
import { UiBrandMarkComponent } from '../../shared/ui/brand-mark/brand-mark.component';

type NavMenu = 'solutions' | 'resources' | 'lang' | null;

@Component({
  selector: 'app-landing',
  imports: [RouterLink, TranslatePipe, UiBrandMarkComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly localeService = inject(LocaleService);
  readonly theme = inject(ThemeService);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentUser = this.authService.currentUser;
  readonly roles = this.authService.roles;

  readonly mobileOpen = signal(false);
  readonly navScrolled = signal(false);
  readonly openMenu = signal<NavMenu>(null);

  readonly locale = this.localeService.locale;
  readonly langCode = computed(() =>
    this.locale() === 'ar' ? 'ع' : 'EN'
  );

  goToDashboard(): void {
    const roles = this.roles().map((r) => r.toLowerCase());

    if (roles.includes('admin')) {
      void this.router.navigate(['/admin-dashboard']);
    } else if (roles.includes('farm')) {
      void this.router.navigate(['/farm-dashboard']);
    } else if (roles.includes('factory')) {
      void this.router.navigate(['/factory-dashboard']);
    } else {
      void this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.closeAll();
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => void this.router.navigate(['/login']),
    });
  }

  toggleMobile(): void {
    this.openMenu.set(null);
    this.mobileOpen.update((v) => !v);
  }

  closeAll(): void {
    this.mobileOpen.set(false);
    this.openMenu.set(null);
  }

  /** Keep drawer closed if viewport crosses into desktop nav. */
  @HostListener('window:resize')
  onResize(): void {
    if (typeof window !== 'undefined' && window.innerWidth >= 768 && this.mobileOpen()) {
      this.mobileOpen.set(false);
    }
  }

  toggleMenu(menu: Exclude<NavMenu, null>, event?: Event): void {
    event?.stopPropagation();
    this.openMenu.update((cur) => (cur === menu ? null : menu));
  }

  setLocale(locale: AppLocale): void {
    void this.localeService.setLocale(locale);
    this.openMenu.set(null);
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.openMenu()) {
      this.openMenu.set(null);
      return;
    }
    this.closeAll();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeAll();
  }

  private readonly onScroll = (): void => {
    this.navScrolled.set(window.scrollY > 12);
  };

  private observer?: IntersectionObserver;

  constructor(title: Title) {
    title.setTitle('NileChain - Home');
  }

  ngAfterViewInit(): void {
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.group.relative.z-10').forEach((el) => {
      el.classList.add(
        'opacity-0',
        'translate-y-10',
        'transition-all',
        'duration-700'
      );
      this.observer?.observe(el);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.observer?.disconnect();
  }
}
