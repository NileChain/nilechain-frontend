import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { UiLanguageToggleComponent } from '../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../shared/ui/theme-toggle/theme-toggle.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  imports: [
    RouterLink,
    TranslatePipe,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentUser = this.authService.currentUser;

  readonly roles = this.authService.roles;

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
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => void this.router.navigate(['/login']),
    });
  }

  private readonly onScroll = (): void => {
    const nav = document.querySelector('nav');
    if (!nav) {
      return;
    }

    if (window.scrollY > 20) {
      nav.classList.add('shadow-md', 'h-14');
      nav.classList.remove('h-16');
    } else {
      nav.classList.remove('shadow-md', 'h-14');
      nav.classList.add('h-16');
    }
  };

  private observer?: IntersectionObserver;

  constructor(title: Title) {
    title.setTitle('NileChain - Home');
  }

  ngAfterViewInit(): void {
    window.addEventListener('scroll', this.onScroll);

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
