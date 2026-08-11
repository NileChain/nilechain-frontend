import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { UiLoaderComponent } from '../../../shared/ui/loader/loader.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateService } from '../../../core/services/translate.service';
import {
  FactoryConversation,
  FactoryMessage,
  FactoryService,
} from '../../../core/services/factory/factory.service';

@Component({
  selector: 'app-factory-messages',
  standalone: true,
  imports: [
    TranslatePipe,
    UiLoaderComponent,
    UiErrorStateComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    AppTopBarComponent,
    FormsModule,
    DatePipe,
  ],
  templateUrl: './factory-messages.component.html',
})
export class FactoryMessagesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly factoryService = inject(FactoryService);
  private readonly i18n = inject(TranslateService);
  readonly currentUser = this.authService.currentUser;

  readonly loading = signal(true);
  readonly messagesLoading = signal(false);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly threadError = signal<string | null>(null);
  readonly conversations = signal<FactoryConversation[]>([]);
  readonly messages = signal<FactoryMessage[]>([]);
  readonly selectedMatchId = signal<string | null>(null);

  draft = '';

  ngOnInit(): void {
    this.loadConversations();
  }

  loadConversations(): void {
    this.loading.set(true);
    this.error.set(null);
    this.factoryService
      .getConversations()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.conversations.set(items);
          if (items.length > 0 && !this.selectedMatchId()) {
            this.selectConversation(items[0].matchId);
          }
        },
        error: () =>
          this.error.set(this.i18n.instant('messages.loadConversationsFailed')),
      });
  }

  selectConversation(matchId: string): void {
    this.selectedMatchId.set(matchId);
    this.messagesLoading.set(true);
    this.threadError.set(null);
    this.factoryService
      .getMessages(matchId)
      .pipe(finalize(() => this.messagesLoading.set(false)))
      .subscribe({
        next: (items) => this.messages.set(items),
        error: () =>
          this.threadError.set(this.i18n.instant('messages.loadMessagesFailed')),
      });
  }

  selectedConversation(): FactoryConversation | undefined {
    const id = this.selectedMatchId();
    return this.conversations().find((c) => c.matchId === id);
  }

  isOutgoing(message: FactoryMessage): boolean {
    return message.senderId === this.currentUser()?.id;
  }

  send(): void {
    const matchId = this.selectedMatchId();
    const content = this.draft.trim();
    if (!matchId || !content) {
      return;
    }

    this.sending.set(true);
    this.threadError.set(null);
    this.factoryService
      .sendMessage(matchId, content)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: () => {
          this.draft = '';
          this.selectConversation(matchId);
          this.loadConversations();
        },
        error: () =>
          this.threadError.set(this.i18n.instant('messages.sendFailed')),
      });
  }
}
