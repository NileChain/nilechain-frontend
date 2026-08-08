import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ContractTimelineStep } from '../models/contract-document.model';

@Component({
  selector: 'app-contract-timeline',
  standalone: true,
  imports: [TranslatePipe, DatePipe],
  template: `
    <section class="timeline-card" [attr.aria-label]="'contractDoc.timeline' | translate">
      <h3 class="timeline-card__title">
        <span class="material-symbols-outlined" aria-hidden="true">history</span>
        {{ 'contractDoc.historyTitle' | translate }}
      </h3>
      <ol class="timeline">
        @for (step of steps; track step.id; let i = $index) {
          <li
            class="timeline__item"
            [attr.data-state]="step.state"
            [style.animation-delay.ms]="i * 70"
          >
            <span class="timeline__icon" aria-hidden="true">
              <span class="material-symbols-outlined">{{ step.icon }}</span>
            </span>
            <div class="timeline__body">
              <p class="timeline__label">{{ step.labelKey | translate }}</p>
              <p class="timeline__time">
                @if (step.at) {
                  <span>{{ step.at | date: 'mediumDate' }}</span>
                  <span class="timeline__dot">·</span>
                  <span>{{ step.at | date: 'shortTime' }}</span>
                } @else if (step.state === 'upcoming') {
                  {{ 'contractDoc.pendingStep' | translate }}
                } @else if (step.state === 'current') {
                  {{ 'contractDoc.inProgressStep' | translate }}
                } @else {
                  —
                }
              </p>
            </div>
          </li>
        }
      </ol>
    </section>
  `,
  styleUrl: './contract-timeline.component.scss',
})
export class ContractTimelineComponent {
  @Input({ required: true }) steps: ContractTimelineStep[] = [];
}
