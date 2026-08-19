import { UiDatePipe } from '../../../core/pipes/ui-date.pipe';
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import {
  AdminChannelMessage,
  AdminService,
} from '../../../core/services/admin/admin.service';
import { TranslateService } from '../../../core/services/translate.service';
import { channelMessageStatusKey } from '../../../core/i18n/status-i18n.util';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-channel-messages',
  standalone: true,
  imports: [
    UiDatePipe, TranslatePipe,
    AppTopBarComponent,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
  ],
  templateUrl: './admin-channel-messages.component.html',
})
export class AdminChannelMessagesComponent implements OnInit {
  private readonly adminApi = inject(AdminService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<AdminChannelMessage[]>([]);
  readonly disclaimer = signal<string>('');

  statusFilter = '';
  readonly statusFilters = [
    { value: '', labelKey: 'admin.channelMessages.filterAll' },
    { value: 'Logged', labelKey: 'admin.channelMessages.filterLogged' },
    { value: 'Failed', labelKey: 'admin.channelMessages.filterFailed' },
  ];

  ngOnInit(): void {
    this.load();
  }

  setStatusFilter(value: string): void {
    this.statusFilter = value;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminApi
      .listChannelMessages(this.statusFilter || null)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.items.set(res.items ?? []);
          this.disclaimer.set(res.disclaimer ?? '');
        },
        error: (_err: HttpErrorResponse) =>
          this.error.set(this.i18n.instant('admin.channelMessages.loadFailed')),
      });
  }

  statusLabelKey(status: string): string {
    return channelMessageStatusKey(status);
  }
}
