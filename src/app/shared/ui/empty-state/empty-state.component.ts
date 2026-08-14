import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiIconComponent } from '../icon/icon.component';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [TranslatePipe, UiIconComponent],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class UiEmptyStateComponent {
  @Input() titleKey = 'common.empty';
  @Input() bodyKey = '';
  @Input() icon = 'inbox';
  /** Compact empty block for dense list pages (~240–280px). */
  @Input() compact = false;
  /** Optional atmosphere photo (Unsplash / CDN). Decorative only. */
  @Input() imageUrl = '';
}
