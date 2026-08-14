import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
} from '@angular/core';

/**
 * Animates a numeric value from 0 → target when the element enters the viewport.
 * Popular KPI / dashboard micro-interaction.
 *
 * Usage: <span [uiCountUp]="42" [uiCountUpDuration]="900"></span>
 */
@Directive({
  selector: '[uiCountUp]',
  standalone: true,
})
export class UiCountUpDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;
  private raf = 0;
  private started = false;

  readonly value = input(0, { alias: 'uiCountUp' });
  readonly duration = input(900, { alias: 'uiCountUpDuration' });
  readonly decimals = input(0, { alias: 'uiCountUpDecimals' });
  readonly suffix = input('', { alias: 'uiCountUpSuffix' });
  readonly prefix = input('', { alias: 'uiCountUpPrefix' });

  constructor() {
    effect(() => {
      const v = this.value();
      if (this.started) {
        this.write(v);
      }
    });
  }

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      this.write(this.value());
      this.started = true;
      return;
    }

    this.write(0);
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || this.started) continue;
          this.started = true;
          this.animateTo(this.value());
          this.observer?.unobserve(entry.target);
        }
      },
      { threshold: 0.4 }
    );
    this.observer.observe(node);
  }

  private animateTo(target: number): void {
    const start = performance.now();
    const from = 0;
    const dur = Math.max(200, this.duration());

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      // easeOutCubic — feels premium on counters
      const eased = 1 - Math.pow(1 - t, 3);
      this.write(from + (target - from) * eased);
      if (t < 1) {
        this.raf = requestAnimationFrame(tick);
      } else {
        this.write(target);
      }
    };
    this.raf = requestAnimationFrame(tick);
  }

  private write(n: number): void {
    const d = this.decimals();
    const formatted =
      d > 0 ? n.toFixed(d) : Math.round(n).toLocaleString('en-US');
    this.el.nativeElement.textContent = `${this.prefix()}${formatted}${this.suffix()}`;
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}
