import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'ui-loader',
  standalone: true,
  imports: [NgClass, TranslatePipe],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
})
export class UiLoaderComponent {
  @Input() label = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() ariaLabel = '';
  /** Full-width mint panel for page-level waits. */
  @Input() block = false;

  get sizeClass(): string {
    return { sm: 'text-[18px]', md: 'text-[28px]', lg: 'text-[40px]' }[
      this.size
    ];
  }
}
