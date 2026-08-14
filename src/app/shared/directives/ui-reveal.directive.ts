import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  inject,
  input,
} from '@angular/core';

export type UiRevealAnim =
  | 'fade'
  | 'fadeUp'
  | 'fadeDown'
  | 'fadeLeft'
  | 'fadeRight'
  | 'zoom'
  | 'flip'
  | 'none';

const ANIMATE_CSS: Record<Exclude<UiRevealAnim, 'none'>, string> = {
  fade: 'animate__fadeIn',
  fadeUp: 'animate__fadeInUp',
  fadeDown: 'animate__fadeInDown',
  fadeLeft: 'animate__fadeInLeft',
  fadeRight: 'animate__fadeInRight',
  zoom: 'animate__zoomIn',
  flip: 'animate__flipInX',
};

/**
 * AOS-style scroll reveal powered by IntersectionObserver + Animate.css.
 *
 * Usage:
 *   <div uiReveal="fadeUp" [uiRevealDelay]="80">...</div>
 */
@Directive({
  selector: '[uiReveal]',
  standalone: true,
})
export class UiRevealDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  /** Animation preset (Animate.css under the hood). */
  readonly anim = input<UiRevealAnim>('fadeUp', { alias: 'uiReveal' });
  /** Optional delay in ms. */
  readonly delay = input(0, { alias: 'uiRevealDelay' });

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    node.classList.add('ui-reveal');
    if (this.delay() > 0) {
      node.style.setProperty('--delay', `${this.delay()}ms`);
      node.style.setProperty('animation-delay', `${this.delay()}ms`);
    }

    if (reduced) {
      this.reveal(node, true);
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          this.reveal(entry.target as HTMLElement, false);
          this.observer?.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    this.observer.observe(node);
  }

  private reveal(node: HTMLElement, instant: boolean): void {
    node.classList.add('is-visible');
    const kind = this.resolveAnim();
    if (instant || kind === 'none') return;
    const css = ANIMATE_CSS[kind];
    node.classList.add('animate__animated', css, 'animate__faster');
  }

  /** RTL-aware left/right swap. */
  private resolveAnim(): UiRevealAnim {
    const a = this.anim();
    if (a !== 'fadeLeft' && a !== 'fadeRight') return a;
    const rtl =
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('dir') === 'rtl';
    if (!rtl) return a;
    return a === 'fadeLeft' ? 'fadeRight' : 'fadeLeft';
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
