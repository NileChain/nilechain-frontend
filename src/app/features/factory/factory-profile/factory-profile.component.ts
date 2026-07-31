import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SidebarFactoryComponent } from '../../../shared/components/sidebar-factory/sidebar-factory.component';
import { UiLanguageToggleComponent } from '../../../shared/ui/language-toggle/language-toggle.component';
import { UiThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { FactoryService } from '../../../core/services/factory/factory.service';
import { FactoryProfile } from '../../../core/models/factory/factory-profile.model';
import { UpdateFactoryProfileRequest } from '../../../core/models/factory/factory-profile.model';

@Component({
  selector: 'app-factory-profile',
  standalone: true,
  imports: [
    TranslatePipe,
    SidebarFactoryComponent,
    UiLanguageToggleComponent,
    UiThemeToggleComponent,
    UiLoaderComponent,
    ReactiveFormsModule,
    DecimalPipe,
  ],
  templateUrl: './factory-profile.component.html',
})
export class FactoryProfileComponent implements OnInit {
  private readonly factoryService = inject(FactoryService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveSuccess = signal(false);
  readonly profile = signal<FactoryProfile | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', Validators.required),
    location: this.fb.nonNullable.control(''),
    governorate: this.fb.nonNullable.control(''),
    industryType: this.fb.nonNullable.control(''),
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);
    this.factoryService
      .getProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.profile.set(response);
          this.form.patchValue({
            name: response.name,
            location: response.location ?? '',
            governorate: response.governorate ?? '',
            industryType: response.industryType ?? '',
          });
        },
        error: () => this.error.set('Failed to load factory profile.'),
      });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: UpdateFactoryProfileRequest = {
      name: raw.name,
      location: raw.location || null,
      governorate: raw.governorate || null,
      industryType: raw.industryType || null,
    };

    this.saving.set(true);
    this.saveSuccess.set(false);
    this.error.set(null);
    this.factoryService
      .updateProfile(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.saveSuccess.set(true);
          this.loadProfile();
        },
        error: () => this.error.set('Failed to save factory profile.'),
      });
  }
}
