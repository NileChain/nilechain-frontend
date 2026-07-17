import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements AfterViewInit, OnDestroy {
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
