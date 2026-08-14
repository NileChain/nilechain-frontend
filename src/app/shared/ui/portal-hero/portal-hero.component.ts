import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

/**
 * Cinematic page hero used across portal screens (landing-inspired).
 * Decorative image + optional heritage quote + title/body.
 */
@Component({
  selector: 'ui-portal-hero',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './portal-hero.component.html',
  styleUrl: './portal-hero.component.scss',
})
export class UiPortalHeroComponent {
  /** Unsplash / CDN atmosphere photo. */
  @Input() imageUrl =
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=75';
  /** Optional Amiri quote key. */
  @Input() quoteKey = '';
  @Input() eyebrowKey = '';
  @Input() titleKey = '';
  @Input() bodyKey = '';
  /** compact = shorter strip under top bar; tall = more cinematic */
  @Input() size: 'compact' | 'tall' = 'compact';
}
