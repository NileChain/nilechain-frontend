import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocaleService } from '../services/locale.service';

@Pipe({
  name: 'uiDate',
  standalone: true,
  pure: false,
})
export class UiDatePipe implements PipeTransform {
  private readonly locale = inject(LocaleService);

  transform(
    value: Date | string | number | null | undefined,
    format = 'mediumDate',
    timezone?: string
  ): string | null {
    if (value == null || value === '') {
      return null;
    }
    const loc = this.locale.locale() === 'ar' ? 'ar' : 'en-US';
    return new DatePipe(loc).transform(value, format, timezone);
  }
}
