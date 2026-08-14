import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';
import autoAnimate, { type AnimationController } from '@formkit/auto-animate';

/**
 * AutoAnimate (~2KB) — highly rated automatic list/layout transitions.
 * Attach to a parent that gains/loses children (lists, tabs, filters).
 *
 * Usage: <ul uiAutoAnimate> ... </ul>
 */
@Directive({
  selector: '[uiAutoAnimate]',
  standalone: true,
})
export class UiAutoAnimateDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private controller?: AnimationController;

  ngAfterViewInit(): void {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    this.controller = autoAnimate(this.el.nativeElement, {
      duration: 220,
      easing: 'ease-out',
    });
  }

  ngOnDestroy(): void {
    this.controller?.disable();
  }
}
