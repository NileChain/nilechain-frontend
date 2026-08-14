import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { LocaleService } from '../../../core/services/locale.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AppLocale } from '../../../core/models/ui.models';
import { UiBrandMarkComponent } from '../brand-mark/brand-mark.component';

export interface PortalLandingLink {
  labelKey: string;
  link: string;
  icon?: string;
  imageUrl?: string;
  bodyKey?: string;
}

/**
 * Website-style landing for authenticated farm/factory portals.
 * Mirrors public landing sections; CTAs enter the portal app.
 */
@Component({
  selector: 'ui-portal-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe, UiBrandMarkComponent, DecimalPipe],
  templateUrl: './portal-home.component.html',
  styleUrl: './portal-home.component.scss',
})
export class UiPortalHomeComponent implements AfterViewInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly localeService = inject(LocaleService);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly theme = inject(ThemeService);

  /** i18n root, e.g. farm.home / factory.home */
  @Input({ required: true }) i18nPrefix!: string;
  @Input() heroImage =
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=80';
  @Input() featureImage =
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1400&q=80';
  @Input() feature2Image =
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80';
  @Input() ctaImage =
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1800&q=80';
  @Input() greetingName = '';
  @Input() primaryCtas: PortalLandingLink[] = [];
  @Input() pathCards: PortalLandingLink[] = [];
  @Input() homeLink = '/farm/home';
  @Input() dashboardLink = '/farm/dashboard';

  readonly mobileOpen = signal(false);
  readonly navScrolled = signal(false);
  readonly langOpen = signal(false);
  readonly scrollProgress = signal(0);
  readonly heroReady = signal(false);

  readonly locale = this.localeService.locale;
  readonly langCode = computed(() => (this.locale() === 'ar' ? 'ع' : 'EN'));

  key(suffix: string): string {
    return `${this.i18nPrefix}.${suffix}`;
  }

  logout(): void {
    this.closeAll();
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => void this.router.navigate(['/login']),
    });
  }

  toggleMobile(): void {
    this.langOpen.set(false);
    this.mobileOpen.update((v) => !v);
  }

  toggleLang(event: Event): void {
    event.stopPropagation();
    this.mobileOpen.set(false);
    this.langOpen.update((v) => !v);
  }

  setLocale(locale: AppLocale): void {
    void this.localeService.setLocale(locale);
    this.langOpen.set(false);
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  closeAll(): void {
    this.mobileOpen.set(false);
    this.langOpen.set(false);
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.langOpen.set(false);
  }

  private readonly onScroll = (): void => {
    this.navScrolled.set(window.scrollY > 12);
    const doc = document.documentElement;
    const max = Math.max(doc.scrollHeight - window.innerHeight, 1);
    this.scrollProgress.set(Math.min(100, (window.scrollY / max) * 100));
  };

  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();

    // Soft hero entrance after paint
    requestAnimationFrame(() => this.heroReady.set(true));

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          el.classList.add('is-visible');
          const anim = el.dataset['anim'];
          if (anim && !reduced) {
            el.classList.add('animate__animated', `animate__${anim}`);
          }
          this.observer?.unobserve(el);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
    );

    this.host.nativeElement.querySelectorAll('.lp-reveal').forEach((el: Element) => {
      if (reduced) {
        el.classList.add('is-visible');
        return;
      }
      this.observer?.observe(el);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.observer?.disconnect();
  }
}
