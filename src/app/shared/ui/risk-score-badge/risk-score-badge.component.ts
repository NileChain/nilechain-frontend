import { DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

/** Risk score pill — uses risk colors only (never provenance teal). */
@Component({
  selector: 'ui-risk-score-badge',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe],
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label-md text-label-md font-semibold border"
      [style.color]="color"
      [style.borderColor]="borderColor"
      [style.background]="background"
      role="status"
    >
      <span class="material-symbols-outlined text-[18px] fill" aria-hidden="true">{{
        icon
      }}</span>
      <span class="ui-data-sm" [style.color]="color">{{
        score != null ? (score | number: '1.0-0') : '—'
      }}</span>
      <span>{{ levelKey | translate }}</span>
    </span>
  `,
})
export class UiRiskScoreBadgeComponent {
  @Input() score: number | null = null;

  get level(): 'low' | 'medium' | 'high' {
    if (this.score == null) return 'medium';
    if (this.score >= 70) return 'low';
    if (this.score >= 40) return 'medium';
    return 'high';
  }

  get levelKey(): string {
    return `factory.riskReport.${this.level}Risk`;
  }

  get color(): string {
    switch (this.level) {
      case 'low':
        return 'var(--color-success)';
      case 'medium':
        return 'var(--color-warning)';
      default:
        return 'var(--color-danger)';
    }
  }

  get background(): string {
    return `color-mix(in srgb, ${this.color} 14%, transparent)`;
  }

  get borderColor(): string {
    return `color-mix(in srgb, ${this.color} 35%, transparent)`;
  }

  get icon(): string {
    switch (this.level) {
      case 'low':
        return 'check_circle';
      case 'medium':
        return 'warning';
      default:
        return 'error';
    }
  }
}
