import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ContractIntegrity } from '../../../core/models/integrity/contract-integrity.model';

@Component({
  selector: 'app-contract-integrity-badge',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    @if (integrity; as a) {
      <div class="integrity-badge" data-tone="verified">
        <span class="material-symbols-outlined" aria-hidden="true">verified</span>
        <div class="integrity-badge__body">
          <p class="integrity-badge__title">
            {{ 'integrity.badgeTitle' | translate }}
          </p>
          <p class="integrity-badge__hash font-mono">
            {{ a.shortHash || a.contentHash.slice(0, 12) }}
          </p>
          <p class="integrity-badge__meta">
            {{ 'integrity.chainIndex' | translate: { n: a.chainIndex } }}
            · {{ a.txRef }}
          </p>
          <a
            class="integrity-badge__link"
            [routerLink]="['/verify', a.contentHash]"
            target="_blank"
            rel="noopener"
          >
            {{ 'integrity.openVerify' | translate }}
          </a>
        </div>
      </div>
    }
  `,
  styles: `
    .integrity-badge {
      display: flex;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border-radius: 0.75rem;
      border: 1px solid color-mix(in srgb, var(--color-primary, #0f7a4a) 35%, transparent);
      background: color-mix(in srgb, var(--color-primary, #0f7a4a) 8%, transparent);
    }
    .integrity-badge .material-symbols-outlined {
      color: var(--color-primary, #0f7a4a);
      font-size: 28px;
    }
    .integrity-badge__title {
      font-weight: 700;
      margin: 0;
    }
    .integrity-badge__hash,
    .integrity-badge__meta {
      margin: 0.15rem 0 0;
      font-size: 0.8rem;
      color: var(--color-on-surface-variant, #5c6b63);
      word-break: break-all;
    }
    .integrity-badge__link {
      display: inline-block;
      margin-top: 0.4rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-primary, #0f7a4a);
      text-decoration: underline;
    }
  `,
})
export class ContractIntegrityBadgeComponent {
  @Input() integrity: ContractIntegrity | null | undefined;
}
