import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-input',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="space-y-2">
      @if (label) {
        <label
          [attr.for]="inputId"
          class="font-label-md text-label-md text-on-surface-variant block"
        >
          {{ label }}
        </label>
      }
      <div class="relative group">
        @if (icon) {
          <span
            class="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
            aria-hidden="true"
            >{{ icon }}</span
          >
        }
        <input
          [id]="inputId"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [attr.autocomplete]="autocomplete || null"
          [attr.aria-invalid]="invalid || null"
          class="ui-input"
          [class.!ps-10]="!!icon"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onTouched()"
        />
      </div>
    </div>
  `,
})
export class UiInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() icon = '';
  @Input() inputId = `ui-input-${Math.random().toString(36).slice(2, 9)}`;
  @Input() autocomplete = '';
  @Input() invalid = false;
  @Input() disabled = false;

  value = '';
  private onChange: (v: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value = next;
    this.onChange(next);
  }
}
