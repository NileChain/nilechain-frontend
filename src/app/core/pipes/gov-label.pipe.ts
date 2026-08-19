import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocaleService } from '../services/locale.service';
import { governorateLabel } from '../../shared/geo/egypt-governorates';

@Pipe({
  name: 'govLabel',
  standalone: true,
  pure: false,
})
export class GovLabelPipe implements PipeTransform {
  private readonly locale = inject(LocaleService);

  transform(name: string | null | undefined): string {
    if (!name) {
      return '';
    }
    return governorateLabel(name, this.locale.locale());
  }
}
