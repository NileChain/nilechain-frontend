import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { TranslateService } from '../../../core/services/translate.service';
import { AuthService } from '../../../core/services/auth.service';
import { PersonalizationService } from '../../../core/services/personalization.service';
import {
  CommandPaletteItem,
  CommandPaletteService,
} from '../../../core/services/command-palette.service';
import {
  captureFocus,
  restoreFocus,
  trapTabKey,
} from '../../a11y/focus-trap';

@Component({
  selector: 'ui-command-palette',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (palette.open()) {
      <div
        class="fixed inset-0 z-[85] flex items-start justify-center pt-[12vh] px-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'common.commandPalette' | translate"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/40"
          (click)="palette.closePalette()"
          [attr.aria-label]="'common.close' | translate"
        ></button>

        <div
          #panel
          class="relative w-full max-w-xl rounded-xl bg-surface border border-outline-variant shadow-xl overflow-hidden animate-fade-in"
        >
          <div
            class="flex items-center gap-2 px-4 border-b border-outline-variant"
          >
            <span
              class="material-symbols-outlined text-on-surface-variant"
              aria-hidden="true"
              >search</span
            >
            <input
              #queryInput
              type="search"
              class="flex-1 bg-transparent py-4 outline-none font-body-md text-body-md text-on-surface placeholder:text-outline"
              [placeholder]="'common.searchPlaceholder' | translate"
              [value]="palette.query()"
              (input)="onQuery($event)"
              autocomplete="off"
            />
            <kbd
              class="hidden sm:inline-flex text-label-sm text-on-surface-variant border border-outline-variant rounded px-1.5 py-0.5"
              >Esc</kbd
            >
          </div>

          <ul
            class="max-h-80 overflow-y-auto py-2"
            role="listbox"
            [attr.aria-label]="'common.commandPalette' | translate"
          >
            @if (filtered().length === 0) {
              <li
                class="px-4 py-6 text-center font-body-md text-body-md text-on-surface-variant"
              >
                {{ 'common.noResults' | translate }}
              </li>
            } @else {
              @for (item of filtered(); track item.id; let i = $index) {
                <li role="option" [attr.aria-selected]="i === activeIndex()">
                  <button
                    type="button"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-start transition-colors"
                    [class.bg-surface-container-high]="i === activeIndex()"
                    [class.hover:bg-surface-container-low]="i !== activeIndex()"
                    (click)="select(item)"
                    (mouseenter)="activeIndex.set(i)"
                  >
                    <span
                      class="material-symbols-outlined text-on-surface-variant"
                      aria-hidden="true"
                      >{{ item.icon }}</span
                    >
                    <span class="font-label-md text-label-md text-on-surface">
                      {{ item.labelKey | translate }}
                    </span>
                    <span
                      class="ms-auto text-label-sm text-on-surface-variant truncate max-w-[40%]"
                      >{{ item.link }}</span
                    >
                  </button>
                </li>
              }
            }
          </ul>
        </div>
      </div>
    }
  `,
})
export class UiCommandPaletteComponent {
  readonly palette = inject(CommandPaletteService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly personalization = inject(PersonalizationService);

  readonly queryInput = viewChild<ElementRef<HTMLInputElement>>('queryInput');
  readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  readonly activeIndex = signal(0);

  private previousFocus: HTMLElement | null = null;
  private wasOpen = false;

  readonly filtered = computed(() => {
    const roles = this.auth.roles();
    const q = this.palette.query().trim().toLowerCase();
    // Depend on lang for label matching
    this.translate.currentLang();
    this.translate.ready();

    return this.palette.items.filter((item) => {
      const roleOk =
        roles.length === 0
          ? false
          : item.roles.some((role) =>
              roles.map((r) => r.toLowerCase()).includes(role.toLowerCase())
            );
      if (!roleOk) {
        return false;
      }
      if (!q) {
        return true;
      }
      const label = this.translate.instant(item.labelKey).toLowerCase();
      const keywords = (item.keywords ?? []).join(' ').toLowerCase();
      return (
        label.includes(q) ||
        item.link.toLowerCase().includes(q) ||
        keywords.includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    });
  });

  constructor() {
    effect(() => {
      const isOpen = this.palette.open();
      if (isOpen && !this.wasOpen) {
        this.previousFocus = captureFocus();
        this.activeIndex.set(0);
        queueMicrotask(() => this.queryInput()?.nativeElement.focus());
      } else if (!isOpen && this.wasOpen) {
        restoreFocus(this.previousFocus);
        this.previousFocus = null;
      }
      this.wasOpen = isOpen;
    });

    effect(() => {
      this.palette.query();
      this.activeIndex.set(0);
    });
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    const isPaletteShortcut =
      (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';

    if (isPaletteShortcut) {
      event.preventDefault();
      this.palette.toggle();
      return;
    }

    if (!this.palette.open()) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.palette.closePalette();
      return;
    }

    const panelEl = this.panel()?.nativeElement;
    if (panelEl) {
      trapTabKey(event, panelEl);
    }

    const items = this.filtered();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.set(
        items.length === 0 ? 0 : (this.activeIndex() + 1) % items.length
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.set(
        items.length === 0
          ? 0
          : (this.activeIndex() - 1 + items.length) % items.length
      );
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const item = items[this.activeIndex()];
      if (item) {
        this.select(item);
      }
    }
  }

  onQuery(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.palette.setQuery(value);
  }

  select(item: CommandPaletteItem): void {
    this.palette.closePalette();
    this.personalization.trackRecent({
      id: item.id,
      label: item.labelKey,
      route: item.link,
      icon: item.icon,
    });
    void this.router.navigateByUrl(item.link);
  }
}
