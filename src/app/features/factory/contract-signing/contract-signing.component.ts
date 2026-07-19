import { Component } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SidebarFactoryComponent } from '../../../shared/components/sidebar-factory/sidebar-factory.component';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-contract-signing',
  standalone: true,
  imports: [TranslatePipe, SidebarFactoryComponent, UiLanguageToggleComponent, UiThemeToggleComponent],
  templateUrl: './contract-signing.component.html',
})
export class ContractSigningComponent {
  readonly timeline = [
    {
      key: 'contractSign.created',
      descKey: 'contractSign.createdDesc',
      state: 'done' as const,
    },
    {
      key: 'contractSign.rag',
      descKey: 'contractSign.ragDesc',
      state: 'done' as const,
    },
    {
      key: 'contractSign.review',
      descKey: 'contractSign.reviewDesc',
      state: 'current' as const,
    },
    {
      key: 'contractSign.signed',
      descKey: 'contractSign.signedDesc',
      state: 'pending' as const,
    },
  ] as const;

  readonly summaryRows = [
    { labelKey: 'contractSign.crop', value: 'Yellow maize (Grade A)', emphasize: false },
    { labelKey: 'contractSign.quantity', value: '500 MT', emphasize: false },
    { labelKey: 'contractSign.totalValue', value: '7,500,000 EGP', emphasize: true },
  ] as const;

  readonly clause1Items = [
    'contractSign.clause1Item1',
    'contractSign.clause1Item2',
    'contractSign.clause1Item3',
    'contractSign.clause1Item4',
  ] as const;
}
